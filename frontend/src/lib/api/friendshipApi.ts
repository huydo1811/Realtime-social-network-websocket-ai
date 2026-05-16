import { API_URL, apiAuthFetch } from "@/lib/api/userApi";
import type {
  FriendshipRealtimeEvent,
  FriendshipResponse,
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
