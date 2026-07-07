import type { PetVisibility } from "@/types/pet";

export type PetWalkSessionStatus = "PLANNED" | "ACTIVE" | "FINISHED" | "CANCELLED";
export type PetWalkMeetupStatus = "PENDING" | "ACCEPTED" | "DECLINED" | "CANCELLED";

export interface PetWalkSessionDto {
  id: number;
  petId: number;
  petName?: string | null;
  createdByUserId: number;
  visibility: PetVisibility;
  status: PetWalkSessionStatus;
  startLatitude: number;
  startLongitude: number;
  currentLatitude: number;
  currentLongitude: number;
  routeName?: string | null;
  note?: string | null;
  startedAt: string;
  endedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PetWalkMeetupRequestDto {
  id: number;
  walkSessionId: number;
  petId?: number | null;
  petName?: string | null;
  requesterUserId: number;
  requesterName?: string | null;
  message?: string | null;
  meetupLatitude?: number | null;
  meetupLongitude?: number | null;
  status: PetWalkMeetupStatus;
  respondedByUserId?: number | null;
  respondedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePetWalkSessionPayload {
  startLatitude: number;
  startLongitude: number;
  visibility?: PetVisibility;
  routeName?: string;
  note?: string;
}

export interface FinishPetWalkSessionPayload {
  endLatitude: number;
  endLongitude: number;
}

export interface CreatePetWalkMeetupPayload {
  message?: string;
  meetupLatitude?: number;
  meetupLongitude?: number;
}