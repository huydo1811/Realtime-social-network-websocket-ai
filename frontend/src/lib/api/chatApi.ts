import { getAuthTokens, saveAuthTokens, clearAuthTokens } from "@/lib/api/authToken";
import { ConversationResponse, MessageResponse } from "@/types/chat";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

async function chatFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const tokens = getAuthTokens();
  if (!tokens?.accessToken) throw new Error("Chưa đăng nhập");

  const doFetch = (token: string) =>
    fetch(API_BASE + path, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
        ...(options.headers as Record<string, string>),
      },
    });

  let res = await doFetch(tokens.accessToken);

  if (res.status === 401 && tokens.refreshToken) {
    try {
      const refreshed = await fetch(API_BASE + "/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: tokens.refreshToken }),
      }).then((r) => r.json());
      saveAuthTokens(refreshed);
      res = await doFetch(refreshed.accessToken);
    } catch {
      clearAuthTokens();
      throw new Error("Phiên đăng nhập hết hạn");
    }
  }

  return res;
}

export const chatApi = {
  listConversations: async (): Promise<ConversationResponse[]> => {
    const res = await chatFetch("/chat/conversations");
    if (!res.ok) throw new Error("Không thể tải danh sách cuộc trò chuyện");
    return res.json();
  },

  getConversation: async (conversationId: number): Promise<ConversationResponse> => {
    const res = await chatFetch(`/chat/conversations/${conversationId}`);
    if (!res.ok) throw new Error("Không tìm thấy cuộc trò chuyện");
    return res.json();
  },

  createConversation: async (payload: {
    type: "PRIVATE" | "GROUP";
    name?: string;
    participantIds: number[];
    idempotencyKey?: string;
  }): Promise<ConversationResponse> => {
    const res = await chatFetch("/chat/conversations", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Không thể tạo cuộc trò chuyện");
    return res.json();
  },

  updateConversationAppearance: async (
    conversationId: number,
    payload: { nickname?: string | null; bubbleTheme?: string; backgroundTheme?: string }
  ): Promise<ConversationResponse> => {
    const res = await chatFetch(`/chat/conversations/${conversationId}/appearance`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Khong the cap nhat giao dien cuoc tro chuyen");
    return res.json();
  },

  getMessages: async (
    conversationId: number,
    cursorId?: number,
    size = 20
  ): Promise<MessageResponse[]> => {
    const params = new URLSearchParams({ size: String(size) });
    if (cursorId) params.set("cursorId", String(cursorId));
    const res = await chatFetch(`/chat/conversations/${conversationId}/messages?${params}`);
    if (!res.ok) throw new Error("Không thể tải tin nhắn");
    return res.json();
  },

  sendMessage: async (
    conversationId: number,
    content: string,
    idempotencyKey?: string,
    replyToMessageId?: number | null
  ): Promise<MessageResponse> => {
    const res = await chatFetch(`/chat/conversations/${conversationId}/messages`, {
      method: "POST",
      body: JSON.stringify({ content, idempotencyKey, replyToMessageId }),
    });
    if (!res.ok) throw new Error("Không thể gửi tin nhắn");
    return res.json();
  },

  markAsRead: async (conversationId: number): Promise<void> => {
    const res = await chatFetch(`/chat/conversations/${conversationId}/read`, { method: "POST" });
    if (!res.ok) throw new Error("Không thể đánh dấu đã đọc");
  },

  editMessage: async (messageId: number, content: string): Promise<MessageResponse> => {
    const res = await chatFetch(`/chat/messages/${messageId}`, {
      method: "PUT",
      body: JSON.stringify({ content }),
    });
    if (!res.ok) throw new Error("Không thể sửa tin nhắn");
    return res.json();
  },

  deleteMessage: async (messageId: number): Promise<void> => {
    const res = await chatFetch(`/chat/messages/${messageId}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Không thể xóa tin nhắn");
  },

  toggleStar: async (messageId: number): Promise<MessageResponse> => {
    const res = await chatFetch(`/chat/messages/${messageId}/star`, { method: "POST" });
    if (!res.ok) throw new Error("Không thể ghim sao tin nhắn");
    return res.json();
  },

  sendTyping: async (conversationId: number, typing: boolean): Promise<void> => {
    const res = await chatFetch(`/chat/conversations/${conversationId}/typing`, {
      method: "POST",
      body: JSON.stringify({ typing }),
    });
    if (!res.ok) throw new Error("Không thể cập nhật trạng thái đang nhập");
  },
};