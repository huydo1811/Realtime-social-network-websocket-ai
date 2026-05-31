import type { FriendshipResponse } from "@/types/friendship";

export type AdminFriendshipItem = FriendshipResponse;

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
