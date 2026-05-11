import { Client, IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { getAuthTokens } from "@/lib/api/authToken";

function resolveApiBaseUrl(): string {
  const candidate = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (candidate) {
    try {
      const parsed = new URL(candidate);
      if (
        typeof window !== "undefined" &&
        (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") &&
        window.location.hostname !== "localhost" &&
        window.location.hostname !== "127.0.0.1"
      ) {
        parsed.hostname = window.location.hostname;
      }
      return parsed.toString().replace(/\/$/, "");
    } catch {
      return candidate;
    }
  }
  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.hostname}:8080`;
  }
  return "http://localhost:8080";
}

const API_BASE = resolveApiBaseUrl();

export type CallEventType =
  | "CALL_INVITE"
  | "CALL_ACCEPT"
  | "CALL_REJECT"
  | "CALL_END"
  | "CALL_CANCEL"
  | "CALL_TIMEOUT"
  | "CALL_BUSY"
  | "CALL_CONNECTED"
  | "CALL_RECONNECT"
  | "CALL_STATE_SYNC"
  | "CALL_ERROR"
  | "USER_RINGING"
  | "WEBRTC_OFFER"
  | "WEBRTC_ANSWER"
  | "WEBRTC_ICE_CANDIDATE";

export interface CallRealtimeEvent {
  eventId: string;
  eventType: CallEventType;
  callId: string;
  mediaType: "voice" | "video" | null;
  fromUserId: number;
  toUserId: number;
  state: string | null;
  reason: string | null;
  payload: Record<string, unknown>;
  occurredAt: string;
}

type CallEventListener = (event: CallRealtimeEvent) => void;

let client: Client | null = null;
let callUserSub: { unsubscribe: () => void } | null = null;
let subscribedUserId: number | null = null;
const listeners = new Set<CallEventListener>();

function ensureCallSub(userId: number) {
  if (!client?.connected || callUserSub) return;
  const token = getAuthTokens()?.accessToken ?? "";
  callUserSub = client.subscribe(
    `/topic/call/users/${userId}`,
    (frame: IMessage) => {
      try {
        const event = JSON.parse(frame.body) as CallRealtimeEvent;
        listeners.forEach((cb) => cb(event));
      } catch {
        console.error("[CallSocket] Failed to parse event:", frame.body);
      }
    },
    { Authorization: `Bearer ${token}` }
  );
}

export function initCallSocket(userId: number): void {
  subscribedUserId = userId;
  if (client?.connected) {
    ensureCallSub(userId);
    return;
  }
  if (client) return; // already activating / reconnecting

  const token = getAuthTokens()?.accessToken ?? "";
  client = new Client({
    webSocketFactory: () => new SockJS(`${API_BASE}/ws`),
    connectHeaders: { Authorization: `Bearer ${token}` },
    reconnectDelay: 2000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    onConnect: () => {
      if (subscribedUserId != null) ensureCallSub(subscribedUserId);
    },
    onDisconnect: () => {
      callUserSub = null;
    },
    onStompError: (frame) => {
      console.error("[CallSocket] STOMP error:", frame.headers["message"]);
    },
    onWebSocketError: (evt) => {
      console.error("[CallSocket] WS error:", evt);
    },
  });

  client.activate();
}

export function addCallEventListener(listener: CallEventListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function sendCallSignal(signal: Record<string, unknown>): void {
  if (!client?.connected) {
    console.warn("[CallSocket] Not connected, cannot send signal");
    return;
  }
  const token = getAuthTokens()?.accessToken ?? "";
  client.publish({
    destination: "/app/call.signal",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(signal),
  });
}

export function disconnectCallSocket(): void {
  client?.deactivate();
  callUserSub = null;
  listeners.clear();
  client = null;
  subscribedUserId = null;
}

export function isCallSocketConnected(): boolean {
  return client?.connected ?? false;
}
