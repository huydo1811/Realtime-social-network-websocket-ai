import type { FriendshipResponse, GroupMembershipResponse, GroupPostResponse, GroupResponse, GroupVisibility } from "@/types/friendship";

export type AdminFriendshipItem = FriendshipResponse;

export type AdminGroupDetail = GroupResponse & {
  memberCount: number;
  pendingMemberCount: number;
  postCount: number;
  pendingPostCount: number;
  requirePostApproval?: boolean;
};

export type AdminGroupMembership = GroupMembershipResponse;
export type AdminGroupPost = GroupPostResponse;
export type AdminGroupVisibility = GroupVisibility;

export type AdminCallSession = {
  id: number;
  callId: string;
  callerId: number;
  calleeId: number;
  mediaType: string;
  status: string;
  startedAt?: string | null;
  answeredAt?: string | null;
  endedAt?: string | null;
  endReason?: string | null;
  createdAt?: string | null;
};

export type AdminCallEvent = {
  id: number;
  callId: string;
  eventType: string;
  actorId?: number | null;
  payload?: string | null;
  occurredAt?: string | null;
};

export type AdminPageResponse<T> = {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
};

export type AdminOperationAuditLog = {
  id: number;
  adminUserId: number;
  action: string;
  resourceType?: string | null;
  resourceId?: string | null;
  detail?: string | null;
  requestPath?: string | null;
  httpMethod?: string | null;
  ipAddress?: string | null;
  createdAt?: string | null;
};
