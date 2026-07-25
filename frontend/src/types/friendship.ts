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

export type FollowResponse = {
  id: number;
  followerUserId: number;
  followeeUserId: number;
  createdAt?: string;
};

export type FollowSuggestion = {
  userId: number;
  fullName?: string;
  username?: string;
  avatarUrl?: string | null;
  bio?: string | null;
};

export type GroupVisibility = "PUBLIC" | "PRIVATE";
export type GroupMembershipStatus = "PENDING" | "APPROVED" | "REJECTED";
export type GroupMembershipRole = "OWNER" | "MEMBER";
export type GroupPostStatus = "PENDING" | "APPROVED" | "REJECTED";

export type GroupResponse = {
  id: number;
  ownerUserId: number;
  name: string;
  description?: string | null;
  visibility: GroupVisibility;
  requireApproval: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type GroupMembershipResponse = {
  id: number;
  groupId: number;
  userId: number;
  role: GroupMembershipRole;
  status: GroupMembershipStatus;
  requestedAt?: string;
  handledAt?: string | null;
  handledBy?: number | null;
  joinedAt?: string | null;
};

export type GroupPostResponse = {
  id: number;
  groupId: number;
  groupName?: string | null;
  authorUserId: number;
  authorName?: string | null;
  authorAvatarUrl?: string | null;
  content: string;
  mediaUrl?: string | null;
  status: GroupPostStatus;
  reviewedBy?: number | null;
  reviewedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};
