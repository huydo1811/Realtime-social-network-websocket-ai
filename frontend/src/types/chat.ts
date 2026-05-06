export type ConversationType = "PRIVATE" | "GROUP";

export interface ConversationResponse {
  id: number;
  type: ConversationType;
  name: string | null;
  nickname?: string | null;
  bubbleTheme?: "ROSE" | "OCEAN" | "FOREST" | "SUNSET";
  backgroundTheme?: "PLAIN" | "MESH" | "DOTS";
  memberIds: number[];
  createdAt: string;
  unreadCount: number;
  lastMessageContent?: string;
  lastMessageAt?: string;
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
  replyToMessageId?: number | null;
  starred?: boolean;
}

// Realtime event nhận từ STOMP
export interface ChatRealtimeEvent {
  eventId: string;
  eventName:
    | "chat.message.sent"
    | "chat.message.edited"
    | "chat.message.deleted"
    | "chat.message.starred"
    | "chat.typing"
    | "chat.conversation.appearance.updated";
  conversationId: number;
  messageId: number | null;
  senderId: number | null;
  content: string | null;
  createdAt: string | null;
  editedAt: string | null;
  deletedAt: string | null;
  replyToMessageId?: number | null;
  starred?: boolean;
  typing?: boolean;
  nickname?: string | null;
  bubbleTheme?: "ROSE" | "OCEAN" | "FOREST" | "SUNSET";
  backgroundTheme?: "PLAIN" | "MESH" | "DOTS";
  notice?: string | null;
  occurredAt: string;
}