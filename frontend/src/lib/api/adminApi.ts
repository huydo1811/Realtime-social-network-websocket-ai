import { API_URL, apiAuthFetch } from "@/lib/api/userApi";
import type {
  AdminCallEvent,
  AdminCallSession,
  AdminFriendshipItem,
  AdminPageResponse,
} from "@/types/admin";

async function parseError(res: Response, fallback: string): Promise<Error> {
  try {
    const data = (await res.json()) as { message?: string };
    if (data?.message) return new Error(data.message);
  } catch {
    // ignore parse failure
  }
  return new Error(fallback);
}

export const adminApi = {
  async listUserFriendships(userId: number): Promise<AdminFriendshipItem[]> {
    const res = await apiAuthFetch(`${API_URL}/friendships/admin/users/${userId}`);
    if (!res.ok) throw await parseError(res, "Không thể tải danh sách quan hệ bạn bè");
    return (await res.json()) as AdminFriendshipItem[];
  },

  async forceBlockFriendship(friendshipId: number, blockerUserId: number): Promise<AdminFriendshipItem> {
    const res = await apiAuthFetch(`${API_URL}/friendships/admin/${friendshipId}/force-block`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blockerUserId }),
    });
    if (!res.ok) throw await parseError(res, "Không thể chặn quan hệ này");
    return (await res.json()) as AdminFriendshipItem;
  },

  async forceRemoveFriendship(friendshipId: number): Promise<void> {
    const res = await apiAuthFetch(`${API_URL}/friendships/admin/${friendshipId}`, {
      method: "DELETE",
    });
    if (!res.ok) throw await parseError(res, "Không thể xóa quan hệ này");
  },

  async listCallSessions(params?: {
    page?: number;
    size?: number;
    userId?: number;
    status?: string;
  }): Promise<AdminPageResponse<AdminCallSession>> {
    const query = new URLSearchParams();
    query.set("page", String(params?.page ?? 0));
    query.set("size", String(params?.size ?? 20));
    if (params?.userId != null && Number.isFinite(params.userId)) {
      query.set("userId", String(params.userId));
    }
    if (params?.status?.trim()) {
      query.set("status", params.status.trim().toUpperCase());
    }
    const res = await apiAuthFetch(`${API_URL}/calls/admin/sessions?${query.toString()}`);
    if (!res.ok) throw await parseError(res, "Không thể tải lịch sử cuộc gọi");
    return (await res.json()) as AdminPageResponse<AdminCallSession>;
  },

  async listCallEvents(callId: string): Promise<AdminCallEvent[]> {
    const res = await apiAuthFetch(`${API_URL}/calls/admin/sessions/${encodeURIComponent(callId)}/events`);
    if (!res.ok) throw await parseError(res, "Không thể tải timeline sự kiện cuộc gọi");
    return (await res.json()) as AdminCallEvent[];
  },
};
