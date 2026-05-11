/** Dòng phụ dưới tên — đồng bộ ChatWindow / RightSidebar / popup chat */
export function formatLastActiveSubtitle(lastSeenAt?: string | null): string {
  if (!lastSeenAt) return "Không hoạt động";
  const lastDate = new Date(lastSeenAt);
  const lastMs = lastDate.getTime();
  if (!Number.isFinite(lastMs)) return "Không hoạt động";

  const diffMs = Date.now() - lastMs;
  if (diffMs < 0) return "Vừa mới hoạt động";

  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));
  if (diffMinutes < 60) return `Hoạt động ${diffMinutes} phút trước`;

  const now = new Date();
  const nowStart = new Date(now);
  nowStart.setHours(0, 0, 0, 0);

  const lastStart = new Date(lastDate);
  lastStart.setHours(0, 0, 0, 0);

  const msPerDay = 24 * 60 * 60 * 1000;
  const diffDays = Math.round((nowStart.getTime() - lastStart.getTime()) / msPerDay);
  if (diffDays >= 1) return `Hoạt động ${diffDays} ngày trước`;

  const diffHours = Math.floor(diffMinutes / 60);
  return `Hoạt động ${diffHours} giờ trước`;
}
