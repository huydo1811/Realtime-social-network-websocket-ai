"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { SocialPerson } from "./types";

type Props = {
  open: boolean;
  title: string;
  users: SocialPerson[];
  onClose: () => void;
};

export default function FollowListModal({ open, title, users, onClose }: Props) {
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    const k = q.trim().toLowerCase();
    if (!k) return users;
    return users.filter((u) => `${u.name} ${u.username}`.toLowerCase().includes(k));
  }, [q, users]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
          <button onClick={onClose} className="rounded-full border border-slate-200 px-3 py-1 text-sm hover:bg-slate-50 cursor-pointer">
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
            {rows.length === 0 && <p className="text-sm text-slate-500">Không có kết quả.</p>}
            {rows.map((u) => (
              <div key={u.id} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2">
                <div className="flex items-center gap-2">
                  <Image src={u.avatarUrl} alt={u.name} width={36} height={36} className="h-9 w-9 rounded-full object-cover" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{u.name}</p>
                    <p className="text-xs text-slate-500">@{u.username}</p>
                  </div>
                </div>
                <button className="rounded-full border border-slate-200 px-3 py-1 text-xs hover:bg-slate-50">Xem</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}