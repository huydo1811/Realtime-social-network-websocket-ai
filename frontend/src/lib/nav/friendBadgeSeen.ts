const STORAGE_KEY = "nav:friend-incoming-seen-count";

export function getFriendIncomingSeenCount(): number {
  if (typeof window === "undefined") return 0;
  const n = Number(sessionStorage.getItem(STORAGE_KEY) || "0");
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export function markFriendIncomingSeen(incomingCount: number) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, String(Math.max(0, incomingCount)));
}

export function friendIncomingBadgeCount(incomingCount: number): number {
  return Math.max(0, incomingCount - getFriendIncomingSeenCount());
}
