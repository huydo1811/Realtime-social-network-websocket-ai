"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { listGroupPostLikers } from "@/lib/api/friendshipApi";
import { postApi } from "@/lib/api/postApi";

type Liker = {
  userId: number;
  fullName?: string;
  username?: string;
  avatarUrl?: string | null;
  likedAt?: string;
};

type Props = {
  postId: number | null;
  groupId?: number | null;
  groupPostId?: number | null;
  open: boolean;
  onClose: () => void;
};

function labelOf(row: Liker) {
  if (row.fullName?.trim()) return row.fullName.trim();
  if (row.username?.trim()) return row.username.trim();
  return `Người dùng #${row.userId}`;
}

export default function PostLikersModal({
  postId,
  groupId,
  groupPostId,
  open,
  onClose,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<Liker[]>([]);

  useEffect(() => {
    if (!open) return;
    const isGroup =
      groupId != null &&
      groupPostId != null &&
      Number.isFinite(groupId) &&
      Number.isFinite(groupPostId);
    const isPersonal = postId != null && Number.isFinite(postId);
    if (!isGroup && !isPersonal) return;

    let cancelled = false;
    setLoading(true);
    setError(null);
    const loader = isGroup
      ? listGroupPostLikers(groupId!, groupPostId!)
      : postApi.listLikers(postId!);

    void loader
      .then((data) => {
        if (!cancelled) setRows(data);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Không thể tải danh sách");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, postId, groupId, groupPostId]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/45 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Người đã thích"
    >
      <div
        className="flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h3 className="text-base font-bold text-slate-900">Người đã thích</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm font-semibold text-slate-500 hover:bg-slate-100"
          >
            Đóng
          </button>
        </div>
        <div className="overflow-y-auto px-4 py-3">
          {loading ? (
            <p className="text-sm text-slate-500">Đang tải...</p>
          ) : error ? (
            <p className="text-sm text-rose-600">{error}</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-slate-500">Chưa có ai thích bài viết này.</p>
          ) : (
            <ul className="space-y-2">
              {rows.map((row) => {
                const name = labelOf(row);
                return (
                  <li key={row.userId}>
                    <Link
                      href={`/profile/${row.userId}`}
                      onClick={onClose}
                      className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-slate-50"
                    >
                      {row.avatarUrl ? (
                        <Image
                          src={row.avatarUrl}
                          alt={name}
                          width={40}
                          height={40}
                          className="h-10 w-10 rounded-full object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 text-sm font-bold text-rose-600">
                          {name[0]?.toUpperCase() || "U"}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-800">{name}</p>
                        {row.username ? (
                          <p className="truncate text-xs text-slate-500">@{row.username}</p>
                        ) : null}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
