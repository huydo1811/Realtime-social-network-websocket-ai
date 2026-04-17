"use client";

import Link from "next/link";
import { useState } from "react";
import SecuritySettings from "./SecuritySettings";

type Props = {
  name: string;
  email: string;
  phone: string;
  role: string;
  active: boolean;
  bio?: string;
  avatarUrl?: string;
};

export default function AdminProfileCard({
  name,
  email,
  phone,
  role,
  active,
  bio,
  avatarUrl,
}: Props) {
  const [showSecurity, setShowSecurity] = useState(false);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-6">
        <div className="relative">
          <img
            src={avatarUrl || "/hype.png"}
            alt="admin avatar"
            className="h-28 w-28 rounded-2xl object-cover ring-1 ring-slate-200"
          />
          <span className="absolute -bottom-1 -right-1 inline-flex items-center gap-2 rounded-full bg-white px-2 py-1 text-xs font-medium shadow-sm">
            <svg className={`h-2.5 w-2.5 ${active ? "text-emerald-500" : "text-rose-500"}`} viewBox="0 0 8 8" fill="currentColor">
              <circle cx="4" cy="4" r="4" />
            </svg>
            {active ? "Active" : "Inactive"}
          </span>
        </div>

        <div className="flex-1">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{name}</h2>
              <p className="text-sm text-slate-500">{email}</p>
              <p className="mt-1 text-sm text-slate-500">{phone}</p>
            </div>

            <div className="flex flex-col items-end gap-2">
              <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                {role}
              </div>
              <div className="flex gap-2">
                <Link href="/admin" className="rounded-xl border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50">
                  Về dashboard
                </Link>
                <button
                  onClick={() => setShowSecurity((s) => !s)}
                  className="rounded-xl bg-rose-500 px-3 py-2 text-sm font-medium text-white hover:bg-rose-600"
                >
                  Đổi mật khẩu
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 p-3">
              <p className="text-xs text-slate-500">Vai trò</p>
              <p className="font-medium text-slate-800">{role}</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-3">
              <p className="text-xs text-slate-500">Trạng thái</p>
              <p className={active ? "font-medium text-emerald-600" : "font-medium text-rose-600"}>
                {active ? "Active" : "Inactive"}
              </p>
            </div>
          </div>

          <p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">{bio || "Quản trị hệ thống mạng xã hội."}</p>

          {showSecurity && (
            <div className="mt-5">
              <SecuritySettings />
            </div>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link href="/admin/settings" className="rounded-xl border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50">
              Cấu hình khác
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}