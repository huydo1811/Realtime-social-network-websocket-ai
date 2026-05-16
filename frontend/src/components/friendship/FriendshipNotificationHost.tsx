"use client";

import { useCallback, useEffect, useState } from "react";
import { getAuthTokens } from "@/lib/api/authToken";
import { getUserIdFromAccessToken } from "@/lib/auth/jwtSubject";
import { initChatSocket, subscribeFriendshipUser } from "@/lib/socket/chatSocket";
import type { FriendshipRealtimeEvent } from "@/types/friendship";

type Toast = { id: string; text: string };

function messageFor(event: FriendshipRealtimeEvent, me: number): string {
  const name = event.eventName ?? "";
  const actor = event.actorId;
  const target = event.targetUserId;

  switch (name) {
    case "friendship.request.sent":
      if (target === me) return "Bạn có lời mời kết bạn mới";
      if (actor === me) return "Đã gửi lời mời kết bạn";
      return "Có hoạt động kết bạn mới";
    case "friendship.request.accepted":
      return "Lời mời kết bạn đã được chấp nhận";
    case "friendship.request.rejected":
      return "Lời mời kết bạn đã bị từ chối";
    case "friendship.request.cancelled":
      return "Lời mời kết bạn đã bị hủy";
    case "friendship.removed":
      return "Đã hủy kết bạn";
    case "friendship.blocked":
      return actor === me ? "Đã chặn người dùng" : "Cập nhật chặn / kết bạn";
    case "friendship.unblocked":
      return "Đã bỏ chặn";
    default:
      return "Cập nhật kết bạn";
  }
}

export default function FriendshipNotificationHost() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((text: string) => {
    const id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : String(Date.now());
    setToasts((prev) => [...prev.slice(-2), { id, text }]);
    window.dispatchEvent(new CustomEvent("friendship-changed"));
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 6500);
  }, []);

  useEffect(() => {
    const tokens = getAuthTokens();
    if (!tokens?.accessToken) return;
    const me = getUserIdFromAccessToken(tokens.accessToken);
    if (me == null) return;

    initChatSocket(undefined, () => {});
    const unsub = subscribeFriendshipUser(me, (event) => {
      push(messageFor(event, me));
    });
    return () => unsub();
  }, [push]);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed left-1/2 top-4 z-[100] flex w-full max-w-lg -translate-x-1/2 flex-col gap-2 px-4">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto animate-in fade-in slide-in-from-top-4 rounded-2xl border border-rose-100 bg-white/95 px-4 py-3 shadow-lg shadow-rose-100/40 backdrop-blur-sm duration-300"
        >
          <p className="text-sm font-semibold text-slate-800">{t.text}</p>
          <p className="mt-1 text-xs text-slate-500">Thông báo kết bạn · realtime</p>
        </div>
      ))}
    </div>
  );
}
