export type FriendshipStatusDto = "PENDING" | "ACCEPTED" | "REJECTED" | "BLOCKED";

export type FriendshipResponse = {
  friendshipId: number;
  userId1: number;
  userId2: number;
  requestedBy: number;
  status: FriendshipStatusDto;
  createdAt?: string;
  updatedAt?: string;
};

export type RelationshipStatusResponse = {
  status: FriendshipStatusDto | "NONE";
  friendshipId?: number;
  requestedBy?: number;
  canAccept: boolean;
  canCancel: boolean;
  canBlock: boolean;
  canUnblock: boolean;
};

export type FriendshipRealtimeEvent = {
  eventId?: string;
  eventName?: string;
  actorId?: number;
  targetUserId?: number;
  friendshipId?: number;
  status?: FriendshipStatusDto;
  occurredAt?: string;
};
