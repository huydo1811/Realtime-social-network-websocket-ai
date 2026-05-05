export type ConversationType = "PRIVATE" | "GROUP";

export interface ConversationResponse {
  id: number;
  type: ConversationType;
  name: string | null;
  memberIds: number[];
  createdAt: string;
  unreadCount: number;
}

export interface MessageResponse {
  id: number;
  conversationId: number;
  senderId: number;
  content: string;
  deleted: boolean;
  createdAt: string;
  editedAt: string | null;
  deletedAt: string | null;
}

// Realtime event nhận từ STOMP
export interface ChatRealtimeEvent {
  eventId: string;
  eventName: "chat.message.sent" | "chat.message.edited" | "chat.message.deleted";
  conversationId: number;
  messageId: number;
  senderId: number;
  content: string;
  createdAt: string;
  editedAt: string | null;
  deletedAt: string | null;
  occurredAt: string;
}