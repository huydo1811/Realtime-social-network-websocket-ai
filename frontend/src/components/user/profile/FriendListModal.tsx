"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { SocialPerson } from "./types";

type Props = {
  open: boolean;
  title: string;
  users: SocialPerson[];
  loading?: boolean;
  onClose: () => void;
};

export default function FriendListModal({ open, title, users, loading, onClose }: Props) {
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    const k = q.trim().toLowerCase();
    if (!k) return users;
    return users.filter((u) => `${u.name} ${u.username}`.toLowerCase().includes(k));
  }, [q, users]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-[2px]">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-[1px]">
            <div className="h-9 w-9 animate-spin rounded-full border-4 border-rose-200 border-t-rose-500" />
          </div>
        )}
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
          <button type="button" onClick={onClose} className="cursor-pointer rounded-full border border-slate-200 px-3 py-1 text-sm hover:bg-slate-50">
            Đóng
          </button>
        </div>

        <div className="p-4">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm người..."
            className="mb-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-rose-100"
          />

          <div className="max-h-[380px] space-y-2 overflow-y-auto pr-1">
            {rows.length === 0 && !loading && <p className="text-sm text-slate-500">Không có kết quả.</p>}
            {rows.map((u) => (
              <div key={u.id} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2">
                <div className="flex min-w-0 items-center gap-2">
                  <Image src={u.avatarUrl} alt={u.name} width={36} height={36} className="h-9 w-9 shrink-0 rounded-full object-cover" unoptimized />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{u.name}</p>
                    <p className="truncate text-xs text-slate-500">@{u.username}</p>
                  </div>
                </div>
                <Link
                  href={`/profile/${u.id}`}
                  className="shrink-0 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                  onClick={onClose}
                >
                  Xem
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
