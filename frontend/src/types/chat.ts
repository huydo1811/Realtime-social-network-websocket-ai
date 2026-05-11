export type ConversationType = "PRIVATE" | "GROUP";

export interface ConversationResponse {
  id: number;
  type: ConversationType;
  name: string | null;
  nickname?: string | null;
  bubbleTheme?: "ROSE" | "OCEAN" | "FOREST" | "SUNSET";
  backgroundTheme?: "PLAIN" | "MESH" | "DOTS";
  backgroundImageUrl?: string | null;
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

export interface ConversationReadStatusResponse {
  userId: number;
  lastReadMessageId: number | null;
  readAt: string;
}

export interface UserPresenceResponse {
  userId: number;
  online: boolean;
  lastSeenAt: string;
}

export interface BlockStatusResponse {
  blockedByMe: boolean;
  blockedMe: boolean;
}

export interface AdminChatConversationResponse {
  id: number;
  type: ConversationType;
  name: string | null;
  memberIds: number[];
  createdAt: string;
  bubbleTheme?: "ROSE" | "OCEAN" | "FOREST" | "SUNSET";
  backgroundTheme?: "PLAIN" | "MESH" | "DOTS";
  messageCount: number;
  lastMessageAt?: string | null;
  lastMessagePreview?: string | null;
}

export interface AdminChatAuditLogResponse {
  id: number;
  adminUserId: number;
  action: string;
  reason?: string | null;
  conversationId?: number | null;
  messageId?: number | null;
  detail?: string | null;
  createdAt: string;
}

export interface AdminUpdateConversationAppearanceRequest {
  nickname?: string | null;
  bubbleTheme?: "ROSE" | "OCEAN" | "FOREST" | "SUNSET";
  backgroundTheme?: "PLAIN" | "MESH" | "DOTS";
  backgroundImageUrl?: string | null;
  targetUserId?: number | null;
}

export interface ChatBackgroundPresetResponse {
  id: number;
  name: string;
  imageUrl: string;
  active: boolean;
  createdBy?: number | null;
  origin?: "ADMIN" | "USER";
  createdAt: string;
}

export interface AdminRoomMemberAppearanceResponse {
  userId: number;
  hasSavedSettings?: boolean;
  nickname?: string | null;
  bubbleTheme?: string | null;
  backgroundTheme?: string | null;
  backgroundImageUrl?: string | null;
}

export interface AdminRoomAppearanceDetailResponse {
  conversationId: number;
  roomNickname?: string | null;
  roomBubbleTheme?: string | null;
  roomBackgroundTheme?: string | null;
  members: AdminRoomMemberAppearanceResponse[];
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
    | "chat.conversation.appearance.updated"
    | "chat.conversation.read"
    | "chat.user.presence";
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
  backgroundImageUrl?: string | null;
  notice?: string | null;
  readerId?: number | null;
  lastReadMessageId?: number | null;
  targetUserId?: number | null;
  online?: boolean;
  lastSeenAt?: string | null;
  occurredAt: string;
}