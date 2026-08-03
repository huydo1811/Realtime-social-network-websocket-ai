"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { ProfileInfo } from "@/components/user/profile/types";
import { listFollowing, unfollowUser } from "@/lib/api/friendshipApi";
import { loadProfilesByIds } from "@/lib/friendship/loadProfiles";
import type { FollowResponse } from "@/types/friendship";
import { showAppToast } from "@/components/common/AppToastHost";

export default function FollowingListPanel() {
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [rows, setRows] = useState<FollowResponse[]>([]);
  const [profiles, setProfiles] = useState<Map<number, ProfileInfo>>(new Map());
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listFollowing();
      setRows(data);
      const ids = data.map((r) => r.followeeUserId);
      setProfiles(await loadProfilesByIds(ids));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tải được danh sách đang theo dõi");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleUnfollow(userId: number) {
    if (!window.confirm("Bỏ theo dõi người này?")) return;
    setBusyId(userId);
    try {
      await unfollowUser(userId);
      showAppToast("Đã bỏ theo dõi", "success");
      await load();
    } catch (e) {
      showAppToast(e instanceof Error ? e.message : "Không thể bỏ theo dõi", "error");
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-3 py-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-100" />
        ))}
      </div>
    );
  }

  if (error) {
    return <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>;
  }

  if (!rows.length) {
    return <p className="py-10 text-center text-sm text-slate-500">Bạn chưa theo dõi ai.</p>;
  }

  return (
    <div className="space-y-2">
      {rows.map((row) => {
        const p = profiles.get(row.followeeUserId);
        const name = p?.fullName || `Người dùng #${row.followeeUserId}`;
        const username = p?.username || "user";
        const avatar = p?.avatarUrl || "/hype.png";
        return (
          <article
            key={row.id}
            className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-sm"
          >
            <Link href={`/profile/${row.followeeUserId}`} className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full">
              <Image src={avatar} alt={name} fill className="object-cover" unoptimized />
            </Link>
            <div className="min-w-0 flex-1">
              <Link href={`/profile/${row.followeeUserId}`} className="truncate text-sm font-bold text-slate-900 hover:text-rose-600 hover:underline">
                {name}
              </Link>
              <p className="truncate text-xs text-slate-500">@{username}</p>
            </div>
            <button
              type="button"
              disabled={busyId === row.followeeUserId}
              onClick={() => void handleUnfollow(row.followeeUserId)}
              className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              {busyId === row.followeeUserId ? "Đang xử lý..." : "Bỏ theo dõi"}
            </button>
          </article>
        );
      })}
    </div>
  );
}
