import { getAuthTokens, saveAuthTokens, clearAuthTokens } from "@/lib/api/authToken";
import { getAdminChatAccessReason } from "@/lib/api/adminChatReason";
import {
  AdminChatAuditLogResponse,
  AdminChatConversationResponse,
  AdminRoomAppearanceDetailResponse,
  BlockStatusResponse,
  ChatBackgroundPresetResponse,
  AdminUpdateConversationAppearanceRequest,
  ConversationReadStatusResponse,
  ConversationResponse,
  MessageResponse,
  UserPresenceResponse,
} from "@/types/chat";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
const CHAT_FETCH_TIMEOUT_MS = 12000;
const READ_RETRY_COUNT = 2;

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

function isReadMethod(method?: string): boolean {
  const normalized = (method || "GET").toUpperCase();
  return normalized === "GET" || normalized === "HEAD";
}

function shouldRetryStatus(status: number): boolean {
  return status === 408 || status === 429 || status >= 500;
}

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit): Promise<Response> {
  // Nếu caller đã truyền signal thì tôn trọng signal đó, không tự bọc timeout.
  if (init.signal) return fetch(input, init);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CHAT_FETCH_TIMEOUT_MS);
  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

async function chatFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const tokens = getAuthTokens();
  if (!tokens?.accessToken) throw new Error("Chưa đăng nhập");

  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  const method = (options.method || "GET").toUpperCase();
  const adminReason =
    typeof window !== "undefined" && path.includes("/chat/admin") ? getAdminChatAccessReason() : "";
  const doFetch = (token: string) =>
    fetchWithTimeout(API_BASE + path, {
      ...options,
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        Authorization: "Bearer " + token,
        ...(options.headers as Record<string, string>),
        // Header values must be ISO-8859-1 in fetch(); encode UTF-8 (e.g. Vietnamese) for the server to decode.
        ...(adminReason ? { "X-Admin-Chat-Reason": encodeURIComponent(adminReason) } : {}),
      },
    });

  const requestWithRetry = async (token: string): Promise<Response> => {
    const maxAttempts = isReadMethod(method) ? READ_RETRY_COUNT + 1 : 1;
    let attempt = 0;

    while (true) {
      try {
        const res = await doFetch(token);
        if (attempt < maxAttempts - 1 && shouldRetryStatus(res.status)) {
          attempt += 1;
          await wait(250 * attempt);
          continue;
        }
        return res;
      } catch (error) {
        if (attempt >= maxAttempts - 1) throw error;
        attempt += 1;
        await wait(250 * attempt);
      }
    }
  };

  let res = await requestWithRetry(tokens.accessToken);

  if ((res.status === 401 || res.status === 403) && tokens.refreshToken) {
    try {
      const refreshRes = await fetchWithTimeout(API_BASE + "/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: tokens.refreshToken }),
      });
      if (!refreshRes.ok) {
        clearAuthTokens();
        throw new Error("Phiên đăng nhập hết hạn");
      }
      const refreshed = await refreshRes.json();
      saveAuthTokens(refreshed);
      res = await requestWithRetry(refreshed.accessToken);
    } catch {
      clearAuthTokens();
      throw new Error("Phiên đăng nhập hết hạn");
    }
  }

  return res;
}

export const chatApi = {
  uploadAttachment: async (file: File, signal?: AbortSignal): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await chatFetch("/chat/uploads", {
      method: "POST",
      body: formData,
      signal,
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "Không thể upload tệp");
    }
    return res.json();
  },

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
    payload: { nickname?: string | null; bubbleTheme?: string; backgroundTheme?: string; backgroundImageUrl?: string | null }
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

  sendMessageWithFiles: async (
    conversationId: number,
    payload: { content: string; idempotencyKey?: string; replyToMessageId?: number | null; files: File[] }
  ): Promise<MessageResponse> => {
    const formData = new FormData();
    formData.append("content", payload.content);
    if (payload.idempotencyKey) formData.append("idempotencyKey", payload.idempotencyKey);
    if (payload.replyToMessageId != null) formData.append("replyToMessageId", String(payload.replyToMessageId));
    payload.files.forEach((file) => formData.append("files", file));
    const res = await chatFetch(`/chat/conversations/${conversationId}/messages/with-files`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "Không thể gửi tin nhắn kèm tệp");
    }
    return res.json();
  },

  getDownloadUrl: async (url: string, name?: string): Promise<string> => {
    const params = new URLSearchParams({ url });
    if (name) params.set("name", name);
    const res = await chatFetch(`/chat/downloads?${params.toString()}`);
    if (!res.ok) throw new Error("Không thể tạo link tải");
    const body = (await res.json()) as { url?: string };
    if (!body?.url) throw new Error("Link tải không hợp lệ");
    return body.url;
  },

  markAsRead: async (conversationId: number): Promise<void> => {
    const res = await chatFetch(`/chat/conversations/${conversationId}/read`, { method: "POST" });
    if (!res.ok) throw new Error("Không thể đánh dấu đã đọc");
  },

  getConversationReadStatuses: async (conversationId: number): Promise<ConversationReadStatusResponse[]> => {
    const res = await chatFetch(`/chat/conversations/${conversationId}/read-statuses`);
    if (!res.ok) throw new Error("Không thể tải read receipt");
    return res.json();
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

  heartbeatPresence: async (online = true): Promise<UserPresenceResponse> => {
    const res = await chatFetch("/chat/presence/heartbeat", {
      method: "POST",
      body: JSON.stringify({ online }),
    });
    if (!res.ok) throw new Error("Không thể cập nhật online/offline");
    return res.json();
  },

  getPresence: async (userIds: number[]): Promise<UserPresenceResponse[]> => {
    if (!userIds.length) return [];
    const params = new URLSearchParams();
    userIds.forEach((id) => params.append("userIds", String(id)));
    const res = await chatFetch(`/chat/presence?${params.toString()}`);
    if (!res.ok) throw new Error("Không thể tải trạng thái online");
    return res.json();
  },

  adminListConversations: async (params?: {
    keyword?: string;
    type?: "PRIVATE" | "GROUP";
  }): Promise<AdminChatConversationResponse[]> => {
    const query = new URLSearchParams();
    if (params?.keyword?.trim()) query.set("keyword", params.keyword.trim());
    if (params?.type) query.set("type", params.type);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    const res = await chatFetch(`/chat/admin/conversations${suffix}`);
    if (!res.ok) throw new Error("Không thể tải danh sách hội thoại quản trị");
    return res.json();
  },

  adminGetMessages: async (
    conversationId: number,
    cursorId?: number,
    size = 30
  ): Promise<MessageResponse[]> => {
    const params = new URLSearchParams({ size: String(size) });
    if (cursorId) params.set("cursorId", String(cursorId));
    const res = await chatFetch(`/chat/admin/conversations/${conversationId}/messages?${params.toString()}`);
    if (!res.ok) throw new Error("Không thể tải tin nhắn quản trị");
    return res.json();
  },

  adminDeleteMessage: async (messageId: number): Promise<void> => {
    const res = await chatFetch(`/chat/admin/messages/${messageId}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Không thể xóa nội dung tin nhắn");
  },

  adminUpdateConversationAppearance: async (
    conversationId: number,
    payload: AdminUpdateConversationAppearanceRequest
  ): Promise<ConversationResponse> => {
    const res = await chatFetch(`/chat/admin/conversations/${conversationId}/appearance`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Không thể cập nhật giao diện tin nhắn");
    return res.json();
  },

  listBackgroundPresets: async (): Promise<ChatBackgroundPresetResponse[]> => {
    const res = await chatFetch("/chat/background-presets");
    if (!res.ok) throw new Error("Không thể tải danh sách background");
    return res.json();
  },

  adminListBackgroundPresets: async (): Promise<ChatBackgroundPresetResponse[]> => {
    const res = await chatFetch("/chat/admin/background-presets");
    if (!res.ok) throw new Error("Không thể tải danh sách background quản trị");
    return res.json();
  },

  adminCreateBackgroundPreset: async (payload: { name: string; imageUrl: string }): Promise<ChatBackgroundPresetResponse> => {
    const res = await chatFetch("/chat/admin/background-presets", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Không thể tạo background preset");
    return res.json();
  },

  adminDeleteBackgroundPreset: async (presetId: number): Promise<void> => {
    const res = await chatFetch(`/chat/admin/background-presets/${presetId}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Không thể xóa background preset");
  },

  adminGetRoomMemberAppearances: async (conversationId: number): Promise<AdminRoomAppearanceDetailResponse> => {
    const res = await chatFetch(`/chat/admin/conversations/${conversationId}/member-appearances`);
    if (!res.ok) throw new Error("Không thể tải ảnh nền theo thành viên phòng");
    return res.json();
  },

  adminClearMemberBackgroundImage: async (conversationId: number, userId: number): Promise<void> => {
    const res = await chatFetch(`/chat/admin/conversations/${conversationId}/members/${userId}/background-image`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Không thể gỡ ảnh nền thành viên");
  },

  blockUser: async (targetUserId: number): Promise<void> => {
    const res = await chatFetch(`/chat/blocks/${targetUserId}`, { method: "POST" });
    if (!res.ok) throw new Error("Không thể chặn người dùng");
  },

  unblockUser: async (targetUserId: number): Promise<void> => {
    const res = await chatFetch(`/chat/blocks/${targetUserId}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Không thể bỏ chặn người dùng");
  },

  getBlockStatus: async (userId: number): Promise<BlockStatusResponse> => {
    const res = await chatFetch(`/chat/blocks/status?userId=${userId}`);
    if (!res.ok) throw new Error("Không thể tải trạng thái chặn");
    return res.json();
  },

  listMyBlocks: async (): Promise<number[]> => {
    const res = await chatFetch("/chat/blocks");
    if (!res.ok) throw new Error("Không thể tải danh sách chặn");
    return res.json();
  },

  adminListAuditLogs: async (
    page = 0,
    size = 20
  ): Promise<{ items: AdminChatAuditLogResponse[]; total: number; page: number; size: number }> => {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    const res = await chatFetch(`/chat/admin/audit-logs?${params}`);
    if (!res.ok) throw new Error("Không thể tải nhật ký quản trị chat");
    return res.json();
  },
};