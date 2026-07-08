import type { AppNotification } from "@/types/notification";
import type { PetWalkRealtimeEvent } from "@/types/petWalkRealtime";

function normalizeOccurredAt(value: unknown): string {
  if (typeof value === "string" && value.trim()) return value;
  if (typeof value === "number" && Number.isFinite(value)) {
    return new Date(value).toISOString();
  }
  if (value && typeof value === "object") {
    const record = value as { seconds?: number; nanos?: number };
    if (typeof record.seconds === "number") {
      return new Date(record.seconds * 1000 + (record.nanos ?? 0) / 1e6).toISOString();
    }
  }
  return new Date().toISOString();
}

export function petWalkEventToNotification(
  event: PetWalkRealtimeEvent,
  myUserId: number
): AppNotification | null {
  if (!event || typeof myUserId !== "number") return null;

  const occurredAt = normalizeOccurredAt(event.createdAt);

  if (event.eventName === "pet.walk.meetup.sent") {
    const isReceiver = event.targetUserId === myUserId;
    if (!isReceiver) return null;
    return {
      id: `pet-walk-invite-${event.meetupId}`,
      kind: "pet_walk_invite",
      title: "Lời mời đi dạo mới",
      body: "Có người muốn tham gia phiên đi dạo của bạn.",
      actorUserId: event.actorUserId,
      petId: event.petId,
      walkSessionId: event.walkSessionId,
      meetupId: event.meetupId,
      occurredAt,
      read: false,
      actionable: false,
    };
  }

  if (event.eventName === "pet.walk.meetup.accepted") {
    const isActor = event.actorUserId === myUserId;
    return {
      id: `pet-walk-accepted-${event.meetupId}`,
      kind: "pet_walk_invite_accepted",
      title: "Cập nhật lời mời đi dạo",
      body: isActor
        ? "Bạn đã chấp nhận lời mời tham gia đi dạo."
        : "Lời mời đi dạo của bạn đã được chấp nhận.",
      actorUserId: event.actorUserId,
      petId: event.petId,
      walkSessionId: event.walkSessionId,
      meetupId: event.meetupId,
      occurredAt,
      read: false,
      actionable: false,
    };
  }

  if (event.eventName === "pet.walk.meetup.declined") {
    const isActor = event.actorUserId === myUserId;
    return {
      id: `pet-walk-declined-${event.meetupId}`,
      kind: "pet_walk_invite_declined",
      title: "Cập nhật lời mời đi dạo",
      body: isActor
        ? "Bạn đã từ chối lời mời tham gia đi dạo."
        : "Lời mời đi dạo của bạn đã bị từ chối.",
      actorUserId: event.actorUserId,
      petId: event.petId,
      walkSessionId: event.walkSessionId,
      meetupId: event.meetupId,
      occurredAt,
      read: false,
      actionable: false,
    };
  }

  if (event.eventName === "pet.walk.session.finished") {
    const isActor = event.actorUserId === myUserId;
    return {
      id: `pet-walk-finished-${event.walkSessionId}-${occurredAt}`,
      kind: "pet_walk_session_finished",
      title: "Phiên đi dạo đã kết thúc",
      body: isActor
        ? "Bạn đã kết thúc phiên đi dạo."
        : "Phiên đi dạo chung đã được kết thúc.",
      actorUserId: event.actorUserId,
      petId: event.petId,
      walkSessionId: event.walkSessionId,
      meetupId: event.meetupId,
      occurredAt,
      read: false,
      actionable: false,
    };
  }

  return null;
}
