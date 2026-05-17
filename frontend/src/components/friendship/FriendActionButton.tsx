"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  acceptFriendRequest,
  blockUser,
  cancelFriendRequest,
  getRelationshipStatus,
  rejectFriendRequest,
  removeFriend,
  sendFriendRequest,
  unblockUser,
} from "@/lib/api/friendshipApi";
import type { RelationshipStatusResponse } from "@/types/friendship";

type Props = {
  targetUserId: number;
  onMutate?: () => void;
  /** e.g. w-full on discover cards */
  className?: string;
  /** Center Kết bạn / Chặn side-by-side (discover cards) */
  centered?: boolean;
};

function normalizeRelationshipStatus(raw: RelationshipStatusResponse): RelationshipStatusResponse {
  if (raw.status === "REJECTED") {
    return {
      ...raw,
      status: "NONE",
      friendshipId: undefined,
      requestedBy: undefined,
      canAccept: false,
      canCancel: false,
      canBlock: raw.canBlock ?? true,
      canUnblock: false,
    };
  }
  return raw;
}

function dispatchFriendshipChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("friendship-changed"));
  }
}

export default function FriendActionButton({
  targetUserId,
  onMutate,
  className = "",
  centered = false,
}: Props) {
  const [status, setStatus] = useState<RelationshipStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const invalidTarget = !Number.isFinite(targetUserId) || targetUserId <= 0;

  const refresh = useCallback(async () => {
    if (invalidTarget) {
      setLoading(false);
      setStatus(null);
      setErr("Người dùng không hợp lệ");
      return;
    }
    setLoading(true);
    setErr(null);
    try {
      const s = await getRelationshipStatus(targetUserId);
      setStatus(normalizeRelationshipStatus(s));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Không tải được trạng thái kết bạn");
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, [targetUserId, invalidTarget]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const h = () => void refresh();
    window.addEventListener("friendship-changed", h);
    return () => window.removeEventListener("friendship-changed", h);
  }, [refresh]);

  const notify = () => {
    onMutate?.();
    dispatchFriendshipChanged();
  };

  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    setErr(null);
    try {
      await fn();
      await refresh();
      notify();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Thao tác thất bại");
    } finally {
      setBusy(false);
    }
  }

  const btn =
    "cursor-pointer inline-flex items-center justify-center gap-2 rounded-xl font-bold transition-all active:scale-95 disabled:opacity-50 px-4 py-2.5 text-sm";

  const wrap = (node: ReactNode) => (
    <div className={`flex flex-col gap-2 ${className}`.trim()}>{node}</div>
  );

  const rowClass = centered
    ? "flex flex-row flex-wrap items-center justify-center gap-2 w-full"
    : "flex flex-col gap-2 sm:flex-row sm:flex-wrap";

  const primaryBtnClass = centered
    ? `${btn} min-w-[7.5rem] flex-1 max-w-[9.5rem] bg-rose-500 text-white shadow-sm shadow-rose-200 hover:bg-rose-600`
    : `${btn} w-full bg-rose-500 text-white shadow-sm shadow-rose-200 hover:bg-rose-600 sm:w-auto`;

  const blockBtnClass = centered
    ? `${btn} min-w-[7.5rem] flex-1 max-w-[9.5rem] bg-slate-100 text-slate-700 hover:bg-slate-200`
    : `${btn} w-full bg-slate-100 text-slate-700 hover:bg-slate-200 sm:w-auto`;

  function renderNoneActions(canBlock = true) {
    return wrap(
      <>
        <div className={rowClass}>
          <button
            type="button"
            disabled={busy || invalidTarget}
            className={primaryBtnClass}
            onClick={() => run(async () => sendFriendRequest(targetUserId))}
          >
            Kết bạn
          </button>
          {canBlock && (
            <button
              type="button"
              disabled={busy || invalidTarget}
              className={blockBtnClass}
              onClick={() => run(async () => blockUser(targetUserId))}
            >
              Chặn
            </button>
          )}
        </div>
        {err && (
          <p className="text-xs text-rose-600">
            {err}{" "}
            <button type="button" className="cursor-pointer font-bold underline" onClick={() => void refresh()}>
              Thử lại
            </button>
          </p>
        )}
      </>
    );
  }

  if (loading) {
    return <div className={`h-11 w-full animate-pulse rounded-xl bg-slate-100 ${className}`.trim()} />;
  }

  if (!status) {
    return renderNoneActions(true);
  }

  if (status.status === "NONE") {
    return renderNoneActions(status.canBlock);
  }

  if (status.status === "PENDING") {
    if (status.canAccept && status.friendshipId != null) {
      return wrap(
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            className={`${btn} bg-rose-500 text-white hover:bg-rose-600`}
            onClick={() => run(async () => acceptFriendRequest(status.friendshipId!))}
          >
            Chấp nhận
          </button>
          <button
            type="button"
            disabled={busy}
            className={`${btn} bg-slate-100 text-slate-700 hover:bg-slate-200`}
            onClick={() => run(async () => rejectFriendRequest(status.friendshipId!))}
          >
            Từ chối
          </button>
          {err && <span className="w-full text-xs text-rose-600">{err}</span>}
        </div>
      );
    }
    if (status.canCancel && status.friendshipId != null) {
      return wrap(
        <>
          <button
            type="button"
            disabled={busy}
            className={`${btn} w-full border border-slate-200 bg-slate-100 text-slate-700`}
            onClick={() => run(async () => cancelFriendRequest(status.friendshipId!))}
          >
            Hủy lời mời
          </button>
          {err && <span className="text-xs text-rose-600">{err}</span>}
        </>
      );
    }
    return wrap(<span className="text-sm font-semibold text-slate-500">Đang chờ phản hồi</span>);
  }

  if (status.status === "ACCEPTED" && status.friendshipId != null) {
    return wrap(
      <>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-700">Bạn bè</span>
          <button
            type="button"
            disabled={busy}
            className={`${btn} bg-slate-100 text-slate-700`}
            onClick={() => run(async () => removeFriend(status.friendshipId!))}
          >
            Hủy kết bạn
          </button>
        </div>
        {err && <span className="text-xs text-rose-600">{err}</span>}
      </>
    );
  }

  if (status.status === "BLOCKED") {
    if (status.canUnblock) {
      return wrap(
        <>
          <button
            type="button"
            disabled={busy}
            className={`${btn} w-full bg-slate-800 text-white hover:bg-slate-900`}
            onClick={() => run(async () => unblockUser(targetUserId))}
          >
            Bỏ chặn
          </button>
          {err && <span className="text-xs text-rose-600">{err}</span>}
        </>
      );
    }
    return wrap(<span className="text-sm font-semibold text-slate-500">Đã chặn</span>);
  }

  return renderNoneActions(true);
}
