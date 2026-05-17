"use client";

import Image from "next/image";
import Link from "next/link";
import NotificationCenter from "@/components/notifications/NotificationCenter";

type Props = {
  onLogout: () => void;
};

/** Chỉ dùng trên mobile — desktop dùng LeftSidebar + chuông cạnh logo */
export default function UserTopBar({ onLogout }: Props) {
  return (
    <header className="mb-5 flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm lg:hidden">
      <Link href="/" className="flex min-w-0 items-center gap-2">
        <div className="h-8 w-8 shrink-0 rounded-lg bg-gradient-to-br from-rose-500 to-rose-400 p-0.5 shadow-sm">
          <Image src="/hype.png" alt="Hype" width={32} height={32} className="h-full w-full rounded-[6px] object-cover bg-white" />
        </div>
        <span className="truncate text-xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-rose-400">
          Hype
        </span>
      </Link>

      <nav className="flex shrink-0 items-center gap-1.5" aria-label="Hành động nhanh">
        <NotificationCenter
          buttonClassName="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:text-rose-500"
        />
        <Link
          href="/profile"
          className="h-8 w-8 overflow-hidden rounded-full bg-slate-200 outline-none"
          title="Hồ sơ"
        >
          <Image src="/hype.png" alt="" width={32} height={32} className="h-full w-full object-cover" />
        </Link>
        <button
          type="button"
          onClick={onLogout}
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white text-rose-500"
          title="Đăng xuất"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </nav>
    </header>
  );
}
