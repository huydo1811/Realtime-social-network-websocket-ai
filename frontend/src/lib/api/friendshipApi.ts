import { API_URL, apiAuthFetch } from "@/lib/api/userApi";
import type {
  FollowResponse,
  FollowSuggestion,
  FriendshipResponse,
  GroupMembershipResponse,
  GroupPostCommentResponse,
  GroupPostResponse,
  GroupPostStatus,
  GroupResponse,
  GroupVisibility,
  GroupMembershipStatus,
  GroupMemberActivityResponse,
  GroupMemberReportResponse,
  RelationshipStatusResponse,
} from "@/types/friendship";

async function parseError(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { message?: string };
    if (typeof data.message === "string") return data.message;
  } catch {
    /* ignore */
  }
  return `Lỗi ${res.status}`;
}

export async function getRelationshipStatus(targetUserId: number): Promise<RelationshipStatusResponse> {
  const res = await apiAuthFetch(`${API_URL}/friendships/status?targetUserId=${targetUserId}`);
  if (!res.ok) throw new Error(await parseError(res));
  const data = (await res.json()) as RelationshipStatusResponse;
  if (data.status === "REJECTED") {
    return {
      ...data,
      status: "NONE",
      friendshipId: undefined,
      requestedBy: undefined,
      canAccept: false,
      canCancel: false,
      canBlock: data.canBlock ?? true,
      canUnblock: false,
    };
  }
  return data;
}

export async function sendFriendRequest(targetUserId: number): Promise<FriendshipResponse> {
  const res = await apiAuthFetch(`${API_URL}/friendships/requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ targetUserId }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return (await res.json()) as FriendshipResponse;
}

export async function acceptFriendRequest(requestId: number): Promise<FriendshipResponse> {
  const res = await apiAuthFetch(`${API_URL}/friendships/requests/${requestId}/accept`, {
    method: "POST",
  });
  if (!res.ok) throw new Error(await parseError(res));
  return (await res.json()) as FriendshipResponse;
}

export async function rejectFriendRequest(requestId: number): Promise<FriendshipResponse> {
  const res = await apiAuthFetch(`${API_URL}/friendships/requests/${requestId}/reject`, {
    method: "POST",
  });
  if (!res.ok) throw new Error(await parseError(res));
  return (await res.json()) as FriendshipResponse;
}

export async function cancelFriendRequest(requestId: number): Promise<void> {
  const res = await apiAuthFetch(`${API_URL}/friendships/requests/${requestId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(await parseError(res));
}

export async function removeFriend(friendshipId: number): Promise<void> {
  const res = await apiAuthFetch(`${API_URL}/friendships/${friendshipId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(await parseError(res));
}

export async function blockUser(targetUserId: number): Promise<FriendshipResponse> {
  const res = await apiAuthFetch(`${API_URL}/friendships/blocks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ targetUserId }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return (await res.json()) as FriendshipResponse;
}

export async function unblockUser(targetUserId: number): Promise<void> {
  const res = await apiAuthFetch(`${API_URL}/friendships/blocks`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ targetUserId }),
  });
  if (!res.ok) throw new Error(await parseError(res));
}

export async function listFriends(): Promise<FriendshipResponse[]> {
  const res = await apiAuthFetch(`${API_URL}/friendships/friends`);
  if (!res.ok) throw new Error(await parseError(res));
  return (await res.json()) as FriendshipResponse[];
}

export async function listIncomingRequests(): Promise<FriendshipResponse[]> {
  const res = await apiAuthFetch(`${API_URL}/friendships/requests/incoming`);
  if (!res.ok) throw new Error(await parseError(res));
  return (await res.json()) as FriendshipResponse[];
}

export async function listOutgoingRequests(): Promise<FriendshipResponse[]> {
  const res = await apiAuthFetch(`${API_URL}/friendships/requests/outgoing`);
  if (!res.ok) throw new Error(await parseError(res));
  return (await res.json()) as FriendshipResponse[];
}

export async function listBlockedUsers(): Promise<FriendshipResponse[]> {
  const res = await apiAuthFetch(`${API_URL}/friendships/blocks`);
  if (!res.ok) throw new Error(await parseError(res));
  return (await res.json()) as FriendshipResponse[];
}

export async function followUser(targetUserId: number): Promise<FollowResponse> {
  const res = await apiAuthFetch(`${API_URL}/follows`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ targetUserId }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return (await res.json()) as FollowResponse;
}

export async function unfollowUser(targetUserId: number): Promise<void> {
  const res = await apiAuthFetch(`${API_URL}/follows`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ targetUserId }),
  });
  if (!res.ok) throw new Error(await parseError(res));
}

export async function getFollowStatus(targetUserId: number): Promise<{ following: boolean }> {
  const res = await apiAuthFetch(`${API_URL}/follows/status?targetUserId=${targetUserId}`);
  if (!res.ok) throw new Error(await parseError(res));
  return (await res.json()) as { following: boolean };
}

export async function listFollowing(): Promise<FollowResponse[]> {
  const res = await apiAuthFetch(`${API_URL}/follows/following`);
  if (!res.ok) throw new Error(await parseError(res));
  return (await res.json()) as FollowResponse[];
}

export async function listFollowSuggestions(limit = 8): Promise<FollowSuggestion[]> {
  const res = await apiAuthFetch(`${API_URL}/follows/suggestions?limit=${limit}`);
  if (!res.ok) throw new Error(await parseError(res));
  return (await res.json()) as FollowSuggestion[];
}

export async function createGroup(payload: {
  name: string;
  description?: string;
  avatarUrl?: string;
  visibility: GroupVisibility;
  requireApproval: boolean;
  requirePostApproval?: boolean;
}): Promise<GroupResponse> {
  const res = await apiAuthFetch(`${API_URL}/groups`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...payload,
      requirePostApproval: payload.requirePostApproval ?? true,
    }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return (await res.json()) as GroupResponse;
}

export async function updateGroup(
  groupId: number,
  payload: { name?: string; description?: string; avatarUrl?: string }
): Promise<GroupResponse> {
  const res = await apiAuthFetch(`${API_URL}/groups/${groupId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return (await res.json()) as GroupResponse;
}

export async function deleteGroup(groupId: number): Promise<void> {
  const res = await apiAuthFetch(`${API_URL}/groups/${groupId}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await parseError(res));
}

export async function discoverGroups(params?: { query?: string; visibility?: GroupVisibility }): Promise<GroupResponse[]> {
  const qs = new URLSearchParams();
  if (params?.query?.trim()) qs.set("q", params.query.trim());
  if (params?.visibility) qs.set("visibility", params.visibility);
  const res = await apiAuthFetch(`${API_URL}/groups/discover${qs.toString() ? `?${qs.toString()}` : ""}`);
  if (!res.ok) throw new Error(await parseError(res));
  return (await res.json()) as GroupResponse[];
}

export async function getGroup(groupId: number): Promise<GroupResponse> {
  const res = await apiAuthFetch(`${API_URL}/groups/${groupId}`);
  if (!res.ok) throw new Error(await parseError(res));
  return (await res.json()) as GroupResponse;
}

export async function listMyGroupMemberships(): Promise<GroupMembershipResponse[]> {
  const res = await apiAuthFetch(`${API_URL}/groups/mine`);
  if (!res.ok) throw new Error(await parseError(res));
  return (await res.json()) as GroupMembershipResponse[];
}

export async function listMyOwnedGroups(): Promise<GroupResponse[]> {
  const res = await apiAuthFetch(`${API_URL}/groups/mine/owned`);
  if (!res.ok) throw new Error(await parseError(res));
  return (await res.json()) as GroupResponse[];
}

export async function joinGroup(groupId: number): Promise<GroupMembershipResponse> {
  const res = await apiAuthFetch(`${API_URL}/groups/${groupId}/join`, { method: "POST" });
  if (!res.ok) throw new Error(await parseError(res));
  return (await res.json()) as GroupMembershipResponse;
}

export async function listGroupMembers(groupId: number, status: GroupMembershipStatus = "APPROVED"): Promise<GroupMembershipResponse[]> {
  const res = await apiAuthFetch(`${API_URL}/groups/${groupId}/members?status=${status}`);
  if (!res.ok) throw new Error(await parseError(res));
  return (await res.json()) as GroupMembershipResponse[];
}

export async function approveGroupMembership(groupId: number, membershipId: number): Promise<GroupMembershipResponse> {
  const res = await apiAuthFetch(`${API_URL}/groups/${groupId}/members/${membershipId}/approve`, { method: "POST" });
  if (!res.ok) throw new Error(await parseError(res));
  return (await res.json()) as GroupMembershipResponse;
}

export async function rejectGroupMembership(groupId: number, membershipId: number): Promise<GroupMembershipResponse> {
  const res = await apiAuthFetch(`${API_URL}/groups/${groupId}/members/${membershipId}/reject`, { method: "POST" });
  if (!res.ok) throw new Error(await parseError(res));
  return (await res.json()) as GroupMembershipResponse;
}

export async function removeGroupMember(groupId: number, membershipId: number): Promise<void> {
  const res = await apiAuthFetch(`${API_URL}/groups/${groupId}/members/${membershipId}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await parseError(res));
}

export async function updateGroupPost(
  groupId: number,
  postId: number,
  payload: { content: string; mediaUrl?: string }
): Promise<GroupPostResponse> {
  const res = await apiAuthFetch(`${API_URL}/groups/${groupId}/posts/${postId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return (await res.json()) as GroupPostResponse;
}

export async function deleteGroupPost(groupId: number, postId: number): Promise<void> {
  const res = await apiAuthFetch(`${API_URL}/groups/${groupId}/posts/${postId}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await parseError(res));
}

export async function createGroupPost(groupId: number, payload: { content: string; mediaUrl?: string }): Promise<GroupPostResponse> {
  const res = await apiAuthFetch(`${API_URL}/groups/${groupId}/posts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return (await res.json()) as GroupPostResponse;
}

export async function listGroupPosts(groupId: number, status: GroupPostStatus = "APPROVED"): Promise<GroupPostResponse[]> {
  const res = await apiAuthFetch(`${API_URL}/groups/${groupId}/posts?status=${status}`);
  if (!res.ok) throw new Error(await parseError(res));
  return (await res.json()) as GroupPostResponse[];
}

export async function approveGroupPost(groupId: number, postId: number): Promise<GroupPostResponse> {
  const res = await apiAuthFetch(`${API_URL}/groups/${groupId}/posts/${postId}/approve`, { method: "POST" });
  if (!res.ok) throw new Error(await parseError(res));
  return (await res.json()) as GroupPostResponse;
}

export async function rejectGroupPost(groupId: number, postId: number): Promise<GroupPostResponse> {
  const res = await apiAuthFetch(`${API_URL}/groups/${groupId}/posts/${postId}/reject`, { method: "POST" });
  if (!res.ok) throw new Error(await parseError(res));
  return (await res.json()) as GroupPostResponse;
}

export async function toggleGroupPostLike(
  groupId: number,
  postId: number
): Promise<{ liked: boolean; likeCount: number }> {
  const res = await apiAuthFetch(`${API_URL}/groups/${groupId}/posts/${postId}/like`, { method: "POST" });
  if (!res.ok) throw new Error(await parseError(res));
  return (await res.json()) as { liked: boolean; likeCount: number };
}

export async function listGroupPostLikers(
  groupId: number,
  postId: number
): Promise<
  Array<{ userId: number; fullName?: string; username?: string; avatarUrl?: string | null; likedAt?: string }>
> {
  const res = await apiAuthFetch(`${API_URL}/groups/${groupId}/posts/${postId}/likes`);
  if (!res.ok) throw new Error(await parseError(res));
  return (await res.json()) as Array<{
    userId: number;
    fullName?: string;
    username?: string;
    avatarUrl?: string | null;
    likedAt?: string;
  }>;
}

export async function listGroupPostComments(groupId: number, postId: number): Promise<GroupPostCommentResponse[]> {
  const res = await apiAuthFetch(`${API_URL}/groups/${groupId}/posts/${postId}/comments`);
  if (!res.ok) throw new Error(await parseError(res));
  return (await res.json()) as GroupPostCommentResponse[];
}

export async function createGroupPostComment(
  groupId: number,
  postId: number,
  content: string
): Promise<GroupPostCommentResponse> {
  const res = await apiAuthFetch(`${API_URL}/groups/${groupId}/posts/${postId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return (await res.json()) as GroupPostCommentResponse;
}

export async function listGroupFeed(limit = 30): Promise<GroupPostResponse[]> {
  const safeLimit = Math.min(Math.max(limit, 1), 100);
  const res = await apiAuthFetch(`${API_URL}/groups/feed?limit=${safeLimit}`);
  if (!res.ok) throw new Error(await parseError(res));
  return (await res.json()) as GroupPostResponse[];
}

export async function reportGroupMember(
  groupId: number,
  userId: number,
  reason: string
): Promise<GroupMemberReportResponse> {
  const res = await apiAuthFetch(`${API_URL}/groups/${groupId}/member-reports`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reportedUserId: userId, reason }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return (await res.json()) as GroupMemberReportResponse;
}

export async function listGroupMemberReports(groupId: number): Promise<GroupMemberReportResponse[]> {
  const res = await apiAuthFetch(`${API_URL}/groups/${groupId}/member-reports`);
  if (!res.ok) throw new Error(await parseError(res));
  return (await res.json()) as GroupMemberReportResponse[];
}

export async function getGroupMemberActivity(
  groupId: number,
  userId: number
): Promise<GroupMemberActivityResponse> {
  const res = await apiAuthFetch(`${API_URL}/groups/${groupId}/members/${userId}/activity`);
  if (!res.ok) throw new Error(await parseError(res));
  return (await res.json()) as GroupMemberActivityResponse;
}
