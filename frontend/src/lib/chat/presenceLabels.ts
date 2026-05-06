/** Dòng phụ dưới tên — đồng bộ ChatWindow / RightSidebar / popup chat */
export function formatLastActiveSubtitle(lastSeenAt?: string | null): string {
  if (!lastSeenAt) return "Không hoạt động";
  const last = new Date(lastSeenAt).getTime();
  if (!Number.isFinite(last)) return "Không hoạt động";
  const diffMinutes = Math.max(1, Math.floor((Date.now() - last) / 60000));
  if (diffMinutes < 60) return `Hoạt động ${diffMinutes} phút trước`;
  const diffHours = Math.floor(diffMinutes / 60);
  return `Hoạt động ${diffHours} giờ trước`;
}
