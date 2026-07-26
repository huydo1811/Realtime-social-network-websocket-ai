import { API_URL, apiAuthFetch } from "@/lib/api/userApi";
import type {
  AdminCallEvent,
  AdminCallSession,
  AdminFriendshipItem,
  AdminGroupDetail,
  AdminGroupMembership,
  AdminGroupPost,
  AdminPageResponse,
} from "@/types/admin";
import type { GroupMembershipStatus, GroupPostStatus, GroupResponse, GroupVisibility } from "@/types/friendship";

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

  async listGroups(params?: {
    q?: string;
    visibility?: GroupVisibility | "";
    ownerUserId?: number;
    page?: number;
    size?: number;
  }): Promise<AdminPageResponse<GroupResponse>> {
    const query = new URLSearchParams();
    query.set("page", String(params?.page ?? 0));
    query.set("size", String(params?.size ?? 20));
    if (params?.q?.trim()) query.set("q", params.q.trim());
    if (params?.visibility) query.set("visibility", params.visibility);
    if (params?.ownerUserId != null && Number.isFinite(params.ownerUserId)) {
      query.set("ownerUserId", String(params.ownerUserId));
    }
    const res = await apiAuthFetch(`${API_URL}/groups/admin?${query.toString()}`);
    if (!res.ok) throw await parseError(res, "Không thể tải danh sách nhóm");
    return (await res.json()) as AdminPageResponse<GroupResponse>;
  },

  async getGroupDetail(groupId: number): Promise<AdminGroupDetail> {
    const res = await apiAuthFetch(`${API_URL}/groups/admin/${groupId}`);
    if (!res.ok) throw await parseError(res, "Không thể tải chi tiết nhóm");
    return (await res.json()) as AdminGroupDetail;
  },

  async listGroupMembers(groupId: number, status?: GroupMembershipStatus | ""): Promise<AdminGroupMembership[]> {
    const query = new URLSearchParams();
    if (status) query.set("status", status);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    const res = await apiAuthFetch(`${API_URL}/groups/admin/${groupId}/members${suffix}`);
    if (!res.ok) throw await parseError(res, "Không thể tải thành viên nhóm");
    return (await res.json()) as AdminGroupMembership[];
  },

  async listGroupPosts(groupId: number, status?: GroupPostStatus | ""): Promise<AdminGroupPost[]> {
    const query = new URLSearchParams();
    if (status) query.set("status", status);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    const res = await apiAuthFetch(`${API_URL}/groups/admin/${groupId}/posts${suffix}`);
    if (!res.ok) throw await parseError(res, "Không thể tải bài viết nhóm");
    return (await res.json()) as AdminGroupPost[];
  },

  async approveGroupMember(groupId: number, membershipId: number): Promise<AdminGroupMembership> {
    const res = await apiAuthFetch(`${API_URL}/groups/admin/${groupId}/members/${membershipId}/approve`, {
      method: "POST",
    });
    if (!res.ok) throw await parseError(res, "Không thể duyệt thành viên");
    return (await res.json()) as AdminGroupMembership;
  },

  async rejectGroupMember(groupId: number, membershipId: number): Promise<AdminGroupMembership> {
    const res = await apiAuthFetch(`${API_URL}/groups/admin/${groupId}/members/${membershipId}/reject`, {
      method: "POST",
    });
    if (!res.ok) throw await parseError(res, "Không thể từ chối thành viên");
    return (await res.json()) as AdminGroupMembership;
  },

  async removeGroupMember(groupId: number, membershipId: number): Promise<void> {
    const res = await apiAuthFetch(`${API_URL}/groups/admin/${groupId}/members/${membershipId}`, {
      method: "DELETE",
    });
    if (!res.ok) throw await parseError(res, "Không thể gỡ thành viên");
  },

  async approveGroupPost(groupId: number, postId: number): Promise<AdminGroupPost> {
    const res = await apiAuthFetch(`${API_URL}/groups/admin/${groupId}/posts/${postId}/approve`, {
      method: "POST",
    });
    if (!res.ok) throw await parseError(res, "Không thể duyệt bài viết nhóm");
    return (await res.json()) as AdminGroupPost;
  },

  async rejectGroupPost(groupId: number, postId: number): Promise<AdminGroupPost> {
    const res = await apiAuthFetch(`${API_URL}/groups/admin/${groupId}/posts/${postId}/reject`, {
      method: "POST",
    });
    if (!res.ok) throw await parseError(res, "Không thể từ chối bài viết nhóm");
    return (await res.json()) as AdminGroupPost;
  },

  async deleteGroup(groupId: number): Promise<void> {
    const res = await apiAuthFetch(`${API_URL}/groups/admin/${groupId}`, {
      method: "DELETE",
    });
    if (!res.ok) throw await parseError(res, "Không thể xóa nhóm");
  },
};
