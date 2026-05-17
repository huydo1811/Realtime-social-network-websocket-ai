import type { FriendshipRealtimeEvent } from "@/types/friendship";
import type { AppNotification, NotificationKind } from "@/types/notification";

function kindFromEvent(name: string): NotificationKind | null {
  switch (name) {
    case "friendship.request.sent":
      return "friend_request";
    case "friendship.request.accepted":
      return "friend_accepted";
    case "friendship.request.rejected":
      return "friend_rejected";
    case "friendship.request.cancelled":
      return "friend_cancelled";
    case "friendship.removed":
      // User requested: no notification when unfriend.
      return null;
    case "friendship.blocked":
      return "friend_blocked";
    case "friendship.unblocked":
      return "friend_unblocked";
    default:
      return null;
  }
}

export function friendshipEventToNotification(
  ev: FriendshipRealtimeEvent,
  me: number
): AppNotification | null {
  const name = ev.eventName ?? "";
  const kind = kindFromEvent(name);
  if (!kind) return null;

  const actor = ev.actorId;
  const target = ev.targetUserId;
  const fid = ev.friendshipId;
  const occurredAt = ev.occurredAt ?? new Date().toISOString();
  const id = fid != null ? `fr-${fid}-${kind}` : `ev-${ev.eventId ?? Date.now()}-${kind}`;

  let title = "Kết bạn";
  let body = "Có cập nhật kết bạn";
  let actorUserId = actor;
  let actionable = false;

  switch (kind) {
    case "friend_request":
      if (target !== me) return null;
      title = "Lời mời kết bạn";
      body = "muốn kết bạn với bạn";
      actorUserId = actor;
      actionable = true;
      break;
    case "friend_accepted":
      title = "Kết bạn";
      body = actor === me ? "Bạn đã chấp nhận lời mời kết bạn" : "đã chấp nhận lời mời kết bạn của bạn";
      break;
    case "friend_rejected":
      title = "Kết bạn";
      body = "Lời mời kết bạn đã bị từ chối";
      break;
    case "friend_cancelled":
      title = "Kết bạn";
      body = "Lời mời kết bạn đã bị hủy";
      break;
    case "friend_blocked":
      title = "Kết bạn";
      body = actor === me ? "Bạn đã chặn một người dùng" : "Có cập nhật chặn / kết bạn";
      break;
    case "friend_unblocked":
      title = "Kết bạn";
      body = "Đã bỏ chặn người dùng";
      break;
  }

  return {
    id,
    kind,
    title,
    body,
    actorUserId,
    friendshipId: fid,
    occurredAt,
    read: false,
    actionable,
  };
}

export function incomingRequestToNotification(
  friendshipId: number,
  peerUserId: number,
  createdAt?: string
): AppNotification {
  return {
    id: `fr-${friendshipId}-friend_request`,
    kind: "friend_request",
    title: "Lời mời kết bạn",
    body: "muốn kết bạn với bạn",
    actorUserId: peerUserId,
    friendshipId,
    occurredAt: createdAt ?? new Date().toISOString(),
    read: false,
    actionable: true,
  };
}
