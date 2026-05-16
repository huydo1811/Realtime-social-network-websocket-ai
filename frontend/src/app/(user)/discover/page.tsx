"use client";

import Link from "next/link";
import UserLayout from "@/components/layout/UserLayout";
import UserDirectory from "@/components/user/search/UserDirectory";

export default function DiscoverPage() {
  return (
    <UserLayout>
      <div className="w-full animate-in fade-in slide-in-from-bottom-4 pb-20 pt-2 duration-500">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4 px-1">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Khám phá</h1>
            <p className="mt-1 font-medium text-slate-500">Tìm người dùng và kết bạn</p>
          </div>
          <Link
            href="/friends"
            className="shrink-0 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-rose-200 hover:text-rose-600"
          >
            Bạn bè &amp; lời mời →
          </Link>
        </div>

        <UserDirectory />
      </div>
    </UserLayout>
  );
}
