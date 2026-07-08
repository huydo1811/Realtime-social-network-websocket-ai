export type PetWalkRealtimeEvent = {
  eventName:
    | "pet.walk.meetup.sent"
    | "pet.walk.meetup.accepted"
    | "pet.walk.meetup.declined"
    | "pet.walk.session.finished"
    | string;
  walkSessionId: number;
  meetupId: number | null;
  actorUserId: number;
  targetUserId: number | null;
  petId: number;
  status: "PENDING" | "ACCEPTED" | "DECLINED" | "CANCELLED" | string;
  createdAt: string;
};
