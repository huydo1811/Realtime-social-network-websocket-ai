export type NotificationKind =
  | "friend_request"
  | "friend_accepted"
  | "friend_rejected"
  | "friend_cancelled"
  | "friend_blocked"
  | "friend_unblocked";

export type AppNotification = {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  actorUserId?: number;
  friendshipId?: number;
  occurredAt: string;
  read: boolean;
  /** Hiện nút Đồng ý / Từ chối */
  actionable?: boolean;
};

export type NotificationDayGroup = {
  label: string;
  items: AppNotification[];
};
