"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { ProfileInfo } from "@/components/user/profile/types";
import {
  acceptFriendRequest,
  cancelFriendRequest,
  listBlockedUsers,
  listFriends,
  listIncomingRequests,
  listOutgoingRequests,
  rejectFriendRequest,
  removeFriend,
  unblockUser,
} from "@/lib/api/friendshipApi";
import { getAuthTokens } from "@/lib/api/authToken";
import { getUserIdFromAccessToken } from "@/lib/auth/jwtSubject";
import { loadProfilesByIds } from "@/lib/friendship/loadProfiles";
import { peerUserId } from "@/lib/friendship/peerUserId";
import { OpenDmBubbleButton } from "@/components/chat/FloatingDmProvider";
import type { FriendshipResponse } from "@/types/friendship";

export type DiscoverFriendshipTab = "incoming" | "outgoing" | "friends" | "blocked";

function toSocialPreview(id: number, map: Map<number, ProfileInfo>) {
  const p = map.get(id);
  return {
    id,
    name: p?.fullName ?? `Người dùng #${id}`,
    username: p?.username ?? "user",
    avatarUrl: p?.avatarUrl ?? "/hype.png",
  };
}

export default function DiscoverFriendshipPanels({ tab }: { tab: DiscoverFriendshipTab }) {
  const [myId, setMyId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [rows, setRows] = useState<FriendshipResponse[]>([]);
  const [profiles, setProfiles] = useState<Map<number, ProfileInfo>>(new Map());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = getAuthTokens()?.accessToken;
    setMyId(t ? getUserIdFromAccessToken(t) : null);
  }, []);

  const load = useCallback(async () => {
    if (myId == null) return;
    setLoading(true);
    setError(null);
    try {
      let data: FriendshipResponse[] = [];
      if (tab === "incoming") data = await listIncomingRequests();
      else if (tab === "outgoing") data = await listOutgoingRequests();
      else if (tab === "friends") data = await listFriends();
      else data = await listBlockedUsers();

      setRows(data);
      const peerIds = data.map((r) => peerUserId(r, myId));
      const map = await loadProfilesByIds(peerIds);
      setProfiles(map);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tải được danh sách");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [myId, tab]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const h = () => void load();
    window.addEventListener("friendship-changed", h);
    return () => window.removeEventListener("friendship-changed", h);
  }, [load]);

  async function runAction(requestId: number, fn: () => Promise<unknown>) {
    setBusyId(requestId);
    try {
      await fn();
      await load();
      window.dispatchEvent(new CustomEvent("friendship-changed"));
    } finally {
      setBusyId(null);
    }
  }

  if (myId == null) {
    return <p className="text-center text-sm text-slate-500">Đang xác định tài khoản...</p>;
  }

  if (loading) {
    return (
      <div className="space-y-3 py-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-2xl border border-slate-100 bg-white shadow-sm" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-100 bg-rose-50/80 px-4 py-6 text-center">
        <p className="text-sm font-semibold text-rose-700">{error}</p>
        <button
          type="button"
          onClick={() => void load()}
          className="mt-3 cursor-pointer text-sm font-bold text-rose-600 underline"
        >
          Thử lại
        </button>
      </div>
    );
  }

  if (rows.length === 0) {
    const empty: Record<DiscoverFriendshipTab, string> = {
      incoming: "Không có lời mời đến.",
      outgoing: "Bạn chưa gửi lời mời nào.",
      friends: "Chưa có bạn bè trong danh sách.",
      blocked: "Danh sách chặn trống.",
    };
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-white/60 py-16 text-center">
        <p className="font-medium text-slate-500">{empty[tab]}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((row) => {
        const pid = peerUserId(row, myId);
        const u = toSocialPreview(pid, profiles);
        const fid = row.friendshipId;
        const busy = busyId === fid;

        return (
          <div
            key={`${tab}-${fid}`}
            className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
          >
            <Link href={`/profile/${pid}`} className="flex min-w-0 flex-1 items-center gap-3">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
                <Image src={u.avatarUrl} alt="" fill className="object-cover" sizes="56px" unoptimized />
              </div>
              <div className="min-w-0">
                <p className="truncate font-bold text-slate-900">{u.name}</p>
                <p className="truncate text-sm text-slate-500">@{u.username}</p>
              </div>
            </Link>

            <div className="flex flex-wrap gap-2">
              {tab === "incoming" && (
                <>
                  <button
                    type="button"
                    disabled={busy}
                    className="cursor-pointer rounded-xl bg-rose-500 px-4 py-2 text-xs font-bold text-white hover:bg-rose-600 disabled:opacity-50"
                    onClick={() => runAction(fid, () => acceptFriendRequest(fid))}
                  >
                    Chấp nhận
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    className="cursor-pointer rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 disabled:opacity-50"
                    onClick={() => runAction(fid, () => rejectFriendRequest(fid))}
                  >
                    Từ chối
                  </button>
                </>
              )}
              {tab === "outgoing" && (
                <button
                  type="button"
                  disabled={busy}
                  className="cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  onClick={() => runAction(fid, () => cancelFriendRequest(fid))}
                >
                  Hủy lời mời
                </button>
              )}
              {tab === "friends" && (
                <button
                  type="button"
                  disabled={busy}
                  className="cursor-pointer rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 disabled:opacity-50"
                  onClick={() => runAction(fid, () => removeFriend(fid))}
                >
                  Hủy kết bạn
                </button>
              )}
              {tab === "blocked" && (
                <button
                  type="button"
                  disabled={busy}
                  className="cursor-pointer rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-white hover:bg-slate-900 disabled:opacity-50"
                  onClick={() => runAction(fid, () => unblockUser(pid))}
                >
                  Bỏ chặn
                </button>
              )}
              {tab !== "blocked" && (
                <OpenDmBubbleButton
                  peerUserId={pid}
                  className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Nhắn tin
                </OpenDmBubbleButton>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
