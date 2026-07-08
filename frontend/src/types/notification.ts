export type NotificationKind =
  | "friend_request"
  | "friend_accepted"
  | "friend_rejected"
  | "friend_cancelled"
  | "friend_blocked"
  | "friend_unblocked"
  | "pet_reminder"
  | "pet_walk_invite"
  | "pet_walk_invite_accepted"
  | "pet_walk_invite_declined"
  | "pet_walk_session_finished";

export type AppNotification = {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  actorUserId?: number;
  friendshipId?: number;
  petId?: number;
  walkSessionId?: number;
  meetupId?: number;
  reminderId?: number;
  occurredAt: string;
  read: boolean;
  /** Hiện nút Đồng ý / Từ chối */
  actionable?: boolean;
};

export type NotificationDayGroup = {
  label: string;
  items: AppNotification[];
};
