"use client";

import { useCallback, useEffect, useState } from "react";
import { followUser, getFollowStatus, unfollowUser } from "@/lib/api/friendshipApi";

type Props = {
  targetUserId: number;
  className?: string;
  onMutate?: () => void;
};

export default function FollowActionButton({ targetUserId, className = "", onMutate }: Props) {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [following, setFollowing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!Number.isFinite(targetUserId) || targetUserId <= 0) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await getFollowStatus(targetUserId);
      setFollowing(Boolean(res.following));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tải được trạng thái theo dõi");
    } finally {
      setLoading(false);
    }
  }, [targetUserId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function toggle() {
    setBusy(true);
    setError(null);
    try {
      if (following) {
        await unfollowUser(targetUserId);
      } else {
        await followUser(targetUserId);
      }
      setFollowing((v) => !v);
      onMutate?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể cập nhật theo dõi");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`flex flex-col gap-1 ${className}`.trim()}>
      <button
        type="button"
        disabled={loading || busy}
        onClick={() => void toggle()}
        className={`cursor-pointer rounded-xl px-4 py-2.5 text-sm font-bold transition ${
          following
            ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
            : "bg-sky-500 text-white hover:bg-sky-600"
        } disabled:opacity-60`}
      >
        {loading ? "Đang tải..." : busy ? "Đang xử lý..." : following ? "Đang theo dõi" : "Theo dõi"}
      </button>
      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}
