import { Client, IMessage, StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { getAuthTokens } from "@/lib/api/authToken";
import type { FriendshipRealtimeEvent } from "@/types/friendship";
import { ChatRealtimeEvent } from "@/types/chat";
import type { PetWalkRealtimeEvent } from "@/types/petWalkRealtime";

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

type Listener = (event: ChatRealtimeEvent) => void;
type FriendshipListener = (event: FriendshipRealtimeEvent) => void;
type PetWalkListener = (event: PetWalkRealtimeEvent) => void;

let client: Client | null = null;
const roomSubs = new Map<number, StompSubscription>();
const roomListeners = new Map<number, Set<Listener>>();
let presenceSub: StompSubscription | null = null;
const presenceListeners = new Set<Listener>();
const friendshipUserSubs = new Map<number, StompSubscription>();
const friendshipUserListeners = new Map<number, Set<FriendshipListener>>();
const petWalkUserSubs = new Map<number, StompSubscription>();
const petWalkUserListeners = new Map<number, Set<PetWalkListener>>();
const connectCallbacks = new Set<() => void>();

function ensureFriendshipUserSub(userId: number) {
  if (!client?.connected || friendshipUserSubs.has(userId)) return;

  const sub = client.subscribe(`/topic/friendships/users/${userId}`, (frame: IMessage) => {
    try {
      const event = JSON.parse(frame.body) as FriendshipRealtimeEvent;
      friendshipUserListeners.get(userId)?.forEach((cb) => cb(event));
    } catch {
      console.error("[ChatSocket] Failed to parse friendship event:", frame.body);
    }
  });

  friendshipUserSubs.set(userId, sub);
}

function rebindFriendshipSubs() {
  for (const userId of friendshipUserListeners.keys()) {
    ensureFriendshipUserSub(userId);
  }
}

function ensurePetWalkUserSub(userId: number) {
  if (!client?.connected || petWalkUserSubs.has(userId)) return;

  const sub = client.subscribe(`/topic/pet-walk/users/${userId}`, (frame: IMessage) => {
    try {
      const event = JSON.parse(frame.body) as PetWalkRealtimeEvent;
      petWalkUserListeners.get(userId)?.forEach((cb) => cb(event));
    } catch {
      console.error("[ChatSocket] Failed to parse pet walk event:", frame.body);
    }
  });

  petWalkUserSubs.set(userId, sub);
}

function rebindPetWalkSubs() {
  for (const userId of petWalkUserListeners.keys()) {
    ensurePetWalkUserSub(userId);
  }
}

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
      rebindFriendshipSubs();
      rebindPetWalkSubs();
      connectCallbacks.forEach((cb) => cb());
    },
    onDisconnect: () => {
      roomSubs.clear();
      presenceSub = null;
      friendshipUserSubs.clear();
      petWalkUserSubs.clear();
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
  friendshipUserSubs.clear();
  friendshipUserListeners.clear();
  petWalkUserSubs.clear();
  petWalkUserListeners.clear();
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

/**
 * Nhận sự kiện kết bạn push qua STOMP (Redis → backend → /topic/friendships/users/{userId}).
 */
export function subscribeFriendshipUser(userId: number, onEvent: FriendshipListener): () => void {
  initChatSocket();
  let set = friendshipUserListeners.get(userId);
  if (!set) {
    set = new Set<FriendshipListener>();
    friendshipUserListeners.set(userId, set);
  }
  set.add(onEvent);

  ensureFriendshipUserSub(userId);

  return () => {
    const listeners = friendshipUserListeners.get(userId);
    if (!listeners) return;

    listeners.delete(onEvent);
    if (listeners.size === 0) {
      friendshipUserListeners.delete(userId);
      friendshipUserSubs.get(userId)?.unsubscribe();
      friendshipUserSubs.delete(userId);
    }
  };
}

export function subscribePetWalkUser(userId: number, onEvent: PetWalkListener): () => void {
  initChatSocket();
  let set = petWalkUserListeners.get(userId);
  if (!set) {
    set = new Set<PetWalkListener>();
    petWalkUserListeners.set(userId, set);
  }
  set.add(onEvent);

  ensurePetWalkUserSub(userId);

  return () => {
    const listeners = petWalkUserListeners.get(userId);
    if (!listeners) return;

    listeners.delete(onEvent);
    if (listeners.size === 0) {
      petWalkUserListeners.delete(userId);
      petWalkUserSubs.get(userId)?.unsubscribe();
      petWalkUserSubs.delete(userId);
    }
  };
}