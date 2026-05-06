import { Client, IMessage, StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { getAuthTokens } from "@/lib/api/authToken";
import { ChatRealtimeEvent } from "@/types/chat";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

type Listener = (event: ChatRealtimeEvent) => void;

let client: Client | null = null;
const roomSubs = new Map<number, StompSubscription>();
const roomListeners = new Map<number, Set<Listener>>();
let presenceSub: StompSubscription | null = null;
const presenceListeners = new Set<Listener>();
const connectCallbacks = new Set<() => void>();

function ensureConversationSub(conversationId: number) {
  if (!client?.connected || roomSubs.has(conversationId)) return;

  const sub = client.subscribe(`/topic/chat/conversations/${conversationId}`, (frame: IMessage) => {
    try {
      const event = JSON.parse(frame.body) as ChatRealtimeEvent;
      roomListeners.get(conversationId)?.forEach((cb) => cb(event));
    } catch {
      console.error("[ChatSocket] Failed to parse event:", frame.body);
    }
  });

  roomSubs.set(conversationId, sub);
}

function rebindAllConversationSubs() {
  for (const conversationId of roomListeners.keys()) {
    ensureConversationSub(conversationId);
  }
}

function ensurePresenceSub() {
  if (!client?.connected || presenceSub) return;
  presenceSub = client.subscribe("/topic/chat/presence", (frame: IMessage) => {
    try {
      const event = JSON.parse(frame.body) as ChatRealtimeEvent;
      presenceListeners.forEach((cb) => cb(event));
    } catch {
      console.error("[ChatSocket] Failed to parse presence event:", frame.body);
    }
  });
}

export function initChatSocket(
  _onEvent?: (event: ChatRealtimeEvent) => void,
  onConnected?: () => void
): Client {
  if (onConnected) connectCallbacks.add(onConnected);

  if (client?.connected) {
    connectCallbacks.forEach((cb) => cb());
    return client;
  }

  // Đang connecting/reconnecting thì dùng lại, không tạo client mới.
  if (client) return client;

  const token = getAuthTokens()?.accessToken ?? "";

  client = new Client({
    webSocketFactory: () => new SockJS(`${API_BASE}/ws`),
    connectHeaders: { Authorization: `Bearer ${token}` },
    reconnectDelay: 1500,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    onConnect: () => {
      rebindAllConversationSubs();
      ensurePresenceSub();
      connectCallbacks.forEach((cb) => cb());
    },
    onDisconnect: () => {
      roomSubs.clear();
      presenceSub = null;
    },
    onStompError: (frame) => {
      console.error("[ChatSocket] STOMP error:", frame.headers["message"]);
    },
    onWebSocketError: (evt) => {
      console.error("[ChatSocket] WS error:", evt);
    },
  });

  client.activate();
  return client;
}

/**
 * Nhiều component có thể listen cùng một conversation.
 * Luôn gọi hàm cleanup khi unmount.
 */
export function subscribeConversation(
  conversationId: number,
  onEvent: Listener
): () => void {
  let set = roomListeners.get(conversationId);
  if (!set) {
    set = new Set<Listener>();
    roomListeners.set(conversationId, set);
  }
  set.add(onEvent);

  ensureConversationSub(conversationId);

  return () => {
    const listeners = roomListeners.get(conversationId);
    if (!listeners) return;

    listeners.delete(onEvent);
    if (listeners.size === 0) {
      roomListeners.delete(conversationId);
      roomSubs.get(conversationId)?.unsubscribe();
      roomSubs.delete(conversationId);
    }
  };
}

export function unsubscribeConversation(conversationId: number): void {
  roomSubs.get(conversationId)?.unsubscribe();
  roomSubs.delete(conversationId);
  roomListeners.delete(conversationId);
}

export function disconnectChatSocket(): void {
  client?.deactivate();
  roomSubs.clear();
  roomListeners.clear();
  presenceSub = null;
  presenceListeners.clear();
  connectCallbacks.clear();
  client = null;
}

export function isChatSocketConnected(): boolean {
  return client?.connected ?? false;
}

export function subscribePresence(onEvent: Listener): () => void {
  presenceListeners.add(onEvent);
  ensurePresenceSub();
  return () => {
    presenceListeners.delete(onEvent);
    if (presenceListeners.size === 0) {
      presenceSub?.unsubscribe();
      presenceSub = null;
    }
  };
}