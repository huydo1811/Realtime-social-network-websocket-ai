"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";

export default function AdminSidebar() {
  const pathname = usePathname();

  // Hàm helper để check active route.
  const isActive = (path: string) => {
    if (path === "/admin") return pathname === "/admin";
    return pathname.startsWith(path);
  };

  return (
    <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-5 lg:h-[calc(100vh-2.5rem)]">
      <div className="mb-6 flex items-center gap-3">
        <div className="relative h-10 w-10 rounded-xl bg-rose-100 p-1 overflow-hidden">
          <Image src="/hype.png" alt="Hype" fill className="rounded-lg object-cover" unoptimized />
        </div>
        <div>
          <p className="text-sm text-slate-500">Admin Panel</p>
          <h2 className="text-lg font-semibold leading-tight">Hype</h2>
        </div>
      </div>

      <nav className="space-y-1 text-sm text-slate-600">
        <Link 
          href="/admin" 
          className={`block w-full rounded-xl px-3 py-2 text-left font-medium transition-colors ${
            isActive("/admin") ? "bg-rose-50 text-rose-700 font-semibold" : "hover:bg-slate-100"
          }`}
        >
          Tổng quan
        </Link>
        <Link 
          href="/admin/user" 
          className={`block w-full rounded-xl px-3 py-2 text-left font-medium transition-colors ${
            isActive("/admin/user") ? "bg-rose-50 text-rose-700 font-semibold" : "hover:bg-slate-100"
          }`}
        >
          Người dùng
        </Link>
        <Link
          href="/admin/chat"
          className={`block w-full rounded-xl px-3 py-2 text-left font-medium transition-colors ${
            pathname === "/admin/chat" ? "bg-rose-50 text-rose-700 font-semibold" : "hover:bg-slate-100"
          }`}
        >
          Nội dung chat
        </Link>
        <Link
          href="/admin/chat-appearance"
          className={`block w-full rounded-xl px-3 py-2 text-left font-medium transition-colors ${
            pathname.startsWith("/admin/chat-appearance") ? "bg-rose-50 text-rose-700 font-semibold" : "hover:bg-slate-100"
          }`}
        >
          Giao diện chat
        </Link>
        <Link
          href="/admin/friendship"
          className={`block w-full rounded-xl px-3 py-2 text-left font-medium transition-colors ${
            pathname.startsWith("/admin/friendship") ? "bg-rose-50 text-rose-700 font-semibold" : "hover:bg-slate-100"
          }`}
        >
          Quan hệ bạn bè
        </Link>
        <Link
          href="/admin/call"
          className={`block w-full rounded-xl px-3 py-2 text-left font-medium transition-colors ${
            pathname.startsWith("/admin/call") ? "bg-rose-50 text-rose-700 font-semibold" : "hover:bg-slate-100"
          }`}
        >
          Cuộc gọi
        </Link>
        <Link
          href="/admin/post"
          className={`block w-full rounded-xl px-3 py-2 text-left font-medium transition-colors ${
            pathname.startsWith("/admin/post") ? "bg-rose-50 text-rose-700 font-semibold" : "hover:bg-slate-100"
          }`}
        >
          Bài viết
        </Link>
        <Link
          href="/admin/reports"
          className={`block w-full rounded-xl px-3 py-2 text-left font-medium transition-colors ${
            pathname.startsWith("/admin/reports") ? "bg-rose-50 text-rose-700 font-semibold" : "hover:bg-slate-100"
          }`}
        >
          Báo cáo nội dung
        </Link>
        <Link
          href="/admin/pet"
          className={`block w-full rounded-xl px-3 py-2 text-left font-medium transition-colors ${
            pathname.startsWith("/admin/pet") ? "bg-rose-50 text-rose-700 font-semibold" : "hover:bg-slate-100"
          }`}
        >
          Thú cưng
        </Link>
        <Link
          href="/admin/moderation"
          className={`block w-full rounded-xl px-3 py-2 text-left font-medium transition-colors ${
            pathname.startsWith("/admin/moderation") ? "bg-rose-50 text-rose-700 font-semibold" : "hover:bg-slate-100"
          }`}
        >
          Nhật ký kiểm duyệt AI
        </Link>
      </nav>

      <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
        <p className="font-medium text-slate-700">Tình trạng hệ thống</p>
        <p className="mt-1">API: Online</p>
        <p>Queue moderation: 12 tác vụ</p>
        <p>DB: 28ms</p>
      </div>
    </aside>
  );
}