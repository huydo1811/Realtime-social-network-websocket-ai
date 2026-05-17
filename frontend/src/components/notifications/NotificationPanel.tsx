"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import {
  acceptFriendRequest,
  rejectFriendRequest,
} from "@/lib/api/friendshipApi";
import { loadProfilesByIds } from "@/lib/friendship/loadProfiles";
import type { ProfileInfo } from "@/components/user/profile/types";
import { useNotifications } from "@/lib/notifications/NotificationsContext";
import {
  formatTimeAgo,
  groupNotificationsByDay,
} from "@/lib/notifications/notificationStore";
import type { AppNotification } from "@/types/notification";

const PAGE_SIZE = 12;

type PanelProps = {
  anchorRect: DOMRect | null;
  placement?: "sidebar" | "header";
  onClose: () => void;
};

export default function NotificationPanel({ anchorRect, placement = "header", onClose }: PanelProps) {
  const router = useRouter();
  const {
    items,
    markAllRead,
    removeNotification,
    updateNotification,
    refreshFromServer,
  } = useNotifications();
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [profiles, setProfiles] = useState<Map<number, ProfileInfo>>(new Map());
  const [busyId, setBusyId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const visibleItems = items.slice(0, visibleCount);
  const groups = groupNotificationsByDay(visibleItems);
  const hasMore = visibleCount < items.length;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    refreshFromServer().finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [refreshFromServer]);

  useEffect(() => {
    const actorIds = [
      ...new Set(
        items
          .map((n) => n.actorUserId)
          .filter((id): id is number => typeof id === "number" && id > 0)
      ),
    ];
    if (actorIds.length === 0) return;
    let cancelled = false;
    loadProfilesByIds(actorIds).then((map) => {
      if (!cancelled) setProfiles(map);
    });
    return () => {
      cancelled = true;
    };
  }, [items]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (panelRef.current?.contains(e.target as Node)) return;
      onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || !hasMore) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 48) {
      setVisibleCount((c) => Math.min(c + PAGE_SIZE, items.length));
    }
  }, [hasMore, items.length]);

  async function runAction(
    n: AppNotification,
    fn: () => Promise<unknown>
  ) {
    if (n.friendshipId == null) return;
    setBusyId(n.friendshipId);
    try {
      await fn();
      removeNotification(n.id);
      window.dispatchEvent(new CustomEvent("friendship-changed"));
      await refreshFromServer();
    } finally {
      setBusyId(null);
    }
  }

  if (typeof document === "undefined" || !anchorRect) return null;

  const panelWidth = 380;
  const maxHeight = Math.min(window.innerHeight - 24, 520);
  let top = anchorRect.bottom + 8;
  let left =
    placement === "sidebar"
      ? anchorRect.left
      : anchorRect.right - panelWidth;

  if (left + panelWidth > window.innerWidth - 12) {
    left = window.innerWidth - panelWidth - 12;
  }
  if (left < 12) left = 12;
  if (top + maxHeight > window.innerHeight - 12) {
    top = Math.max(12, anchorRect.top - maxHeight - 8);
  }

  const panel = (
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Thông báo"
      className="fixed z-[200] flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-300/40"
      style={{ top, left, width: panelWidth, maxHeight }}
    >
      <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">Thông báo</h2>
          <p className="text-xs text-slate-500">30 ngày gần nhất · cuộn để xem thêm</p>
        </div>
        {items.some((n) => !n.read) && (
          <button
            type="button"
            onClick={markAllRead}
            className="cursor-pointer rounded-lg px-2 py-1 text-xs font-bold text-rose-600 hover:bg-rose-50"
          >
            Đánh dấu đã đọc
          </button>
        )}
      </div>

      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
      >
        {loading && items.length === 0 ? (
          <div className="space-y-2 p-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-3 p-2">
                <div className="h-12 w-12 shrink-0 animate-pulse rounded-full bg-slate-100" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-3 w-4/5 animate-pulse rounded bg-slate-100" />
                  <div className="h-2 w-1/2 animate-pulse rounded bg-slate-50" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
            </div>
            <p className="text-sm font-semibold text-slate-700">Không có thông báo</p>
            <p className="mt-1 text-xs text-slate-500">Lời mời kết bạn và hoạt động khác sẽ hiện ở đây</p>
          </div>
        ) : (
          <div className="pb-2">
            {groups.map((group) => (
              <section key={group.label}>
                <h3 className="sticky top-0 z-10 bg-white/95 px-4 py-2 text-xs font-bold uppercase tracking-wide text-slate-500 backdrop-blur-sm">
                  {group.label}
                </h3>
                <ul className="divide-y divide-slate-50">
                  {group.items.map((n) => (
                    <NotificationRow
                      key={n.id}
                      notification={n}
                      profile={
                        n.actorUserId != null ? profiles.get(n.actorUserId) : undefined
                      }
                      busy={busyId === n.friendshipId}
                      onClose={onClose}
                      onAccept={() =>
                        n.friendshipId != null &&
                        runAction(n, () => acceptFriendRequest(n.friendshipId!))
                      }
                      onReject={() =>
                        n.friendshipId != null &&
                        runAction(n, () => rejectFriendRequest(n.friendshipId!))
                      }
                      onMarkRead={() => updateNotification(n.id, { read: true })}
                    />
                  ))}
                </ul>
              </section>
            ))}
            {hasMore && (
              <p className="py-3 text-center text-xs font-medium text-slate-400">
                Cuộn để xem thêm ({items.length - visibleCount} còn lại)
              </p>
            )}
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-slate-100 px-3 py-2">
        <button
          type="button"
          onClick={() => {
            onClose();
            router.push("/friends");
          }}
          className="block w-full cursor-pointer rounded-xl py-2.5 text-center text-sm font-bold text-rose-600 hover:bg-rose-50"
        >
          Xem tất cả bạn bè &amp; lời mời
        </button>
      </div>
    </div>
  );

  return createPortal(panel, document.body);
}

function NotificationRow({
  notification: n,
  profile,
  busy,
  onClose,
  onAccept,
  onReject,
  onMarkRead,
}: {
  notification: AppNotification;
  profile?: ProfileInfo;
  busy: boolean;
  onClose: () => void;
  onAccept: () => void;
  onReject: () => void;
  onMarkRead: () => void;
}) {
  const name = profile?.fullName ?? (n.actorUserId ? `Người dùng #${n.actorUserId}` : "Hệ thống");
  const avatar = profile?.avatarUrl ?? "/hype.png";
  const href = n.actorUserId ? `/profile/${n.actorUserId}` : "/friends";

  return (
    <li
      className={`px-3 py-2.5 transition hover:bg-slate-50 ${!n.read ? "bg-rose-50/40" : ""}`}
      onMouseEnter={onMarkRead}
    >
      <div className="flex gap-3">
        <Link
          href={href}
          onClick={onClose}
          className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-slate-100 bg-slate-50"
        >
          <Image src={avatar} alt="" fill className="object-cover" sizes="48px" unoptimized />
          {!n.read && (
            <span className="absolute right-0 top-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-rose-500" />
          )}
        </Link>
        <div className="min-w-0 flex-1">
          <p className="text-sm leading-snug text-slate-800">
            <Link href={href} onClick={onClose} className="font-bold text-slate-900 hover:text-rose-600">
              {name}
            </Link>{" "}
            <span className={!n.read ? "font-medium" : ""}>{n.body}</span>
          </p>
          <p className="mt-0.5 text-xs text-slate-400">{formatTimeAgo(n.occurredAt)}</p>
          {n.actionable && n.friendshipId != null && (
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={onAccept}
                className="cursor-pointer flex-1 rounded-lg bg-rose-500 py-1.5 text-xs font-bold text-white hover:bg-rose-600 disabled:opacity-50"
              >
                Đồng ý
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={onReject}
                className="cursor-pointer flex-1 rounded-lg bg-slate-100 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200 disabled:opacity-50"
              >
                Từ chối
              </button>
            </div>
          )}
        </div>
      </div>
    </li>
  );
}
