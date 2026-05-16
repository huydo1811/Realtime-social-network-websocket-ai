import type { FriendshipResponse } from "@/types/friendship";

export function peerUserId(row: FriendshipResponse, myId: number): number {
  return row.userId1 === myId ? row.userId2 : row.userId1;
}
