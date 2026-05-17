import type { AppNotification, NotificationDayGroup } from "@/types/notification";

const RETENTION_DAYS = 30;
const MAX_ITEMS = 200;

function storageKey(userId: number) {
  return `hype:notifications:${userId}`;
}

export function loadNotifications(userId: number): AppNotification[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AppNotification[];
    if (!Array.isArray(parsed)) return [];
    return pruneOld(parsed);
  } catch {
    return [];
  }
}

export function saveNotifications(userId: number, items: AppNotification[]) {
  if (typeof window === "undefined") return;
  const pruned = pruneOld(items).slice(0, MAX_ITEMS);
  localStorage.setItem(storageKey(userId), JSON.stringify(pruned));
}

function pruneOld(items: AppNotification[]): AppNotification[] {
  const cutoff = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
  return items
    .filter((n) => new Date(n.occurredAt).getTime() >= cutoff)
    .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
}

export function mergeNotifications(
  existing: AppNotification[],
  incoming: AppNotification[]
): AppNotification[] {
  const map = new Map<string, AppNotification>();
  for (const n of existing) map.set(n.id, n);
  for (const n of incoming) {
    const prev = map.get(n.id);
    if (!prev) {
      map.set(n.id, n);
      continue;
    }
    map.set(n.id, {
      ...prev,
      ...n,
      read: prev.read || n.read,
      actionable: n.actionable ?? prev.actionable,
    });
  }
  return pruneOld([...map.values()]);
}

export function dayGroupLabel(date: Date, now = new Date()): string {
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.floor((startOfToday.getTime() - startOfDate.getTime()) / 86400000);

  if (diffDays === 0) return "Hôm nay";
  if (diffDays === 1) return "Hôm qua";
  if (diffDays < 7) {
    return date.toLocaleDateString("vi-VN", { weekday: "long" });
  }
  return date.toLocaleDateString("vi-VN", { day: "numeric", month: "long", year: "numeric" });
}

export function groupNotificationsByDay(items: AppNotification[]): NotificationDayGroup[] {
  const groups: NotificationDayGroup[] = [];
  let lastLabel = "";

  for (const item of items) {
    const label = dayGroupLabel(new Date(item.occurredAt));
    if (label !== lastLabel) {
      groups.push({ label, items: [item] });
      lastLabel = label;
    } else {
      groups[groups.length - 1].items.push(item);
    }
  }
  return groups;
}

export function formatTimeAgo(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Vừa xong";
  if (mins < 60) return `${mins} phút`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày`;
  return d.toLocaleDateString("vi-VN", { day: "numeric", month: "short" });
}
