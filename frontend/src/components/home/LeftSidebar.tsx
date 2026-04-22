"use client"; 
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { getAuthTokens, clearAuthTokens } from "@/lib/api/authToken";
import { getMyProfile } from "@/lib/api/authApi";
import { useEffect, useState } from "react";

// Dùng email thay cho username do Backend UserViewDto không có username
type UserProfile = { fullName?: string; username?: string; avatarUrl?: string };

export default function LeftSidebar() {
  const router = useRouter();
  const pathname = usePathname() || "";

  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    const tokens = getAuthTokens();
    if (!tokens?.accessToken) return;
    let mounted = true;

    getMyProfile(tokens.accessToken)
      .then((u) => {
        if (!mounted) return;
        setUser(u as UserProfile);
      })
      .catch((err) => {
        const msg = err instanceof Error ? err.message : String(err || "");
        if (msg.toLowerCase().includes("unauthorized") || msg.includes("401")) {
          clearAuthTokens();
          router.replace("/login");
        }
      });

    return () => {
      mounted = false;
    };
  }, [router]);

  const handleLogout = () => {
    clearAuthTokens();
    router.replace("/login");
  };

  const base = "flex items-center gap-4 px-4 py-3 rounded-xl transition";
  const active = "bg-rose-50 text-rose-600 font-semibold";
  const inactive = "text-slate-600 hover:bg-slate-50 hover:text-rose-500";

  const isActive = (p: string) => {
    if (p === "/") return pathname === "/";
    return pathname === p || pathname.startsWith(p + "/") || pathname.startsWith(p);
  };

  return (
    <aside className="hidden md:flex flex-col w-64 lg:w-72 fixed inset-y-0 left-0 bg-white border-r border-slate-200 px-6 py-8 shadow-sm z-10">
      <Link href="/" className="flex items-center gap-3 mb-10 pl-2">
        <div className="relative h-10 w-10 rounded-xl bg-gradient-to-br from-rose-500 to-rose-300 p-0.5 shadow-md">
          <Image src="/hype.png" alt="Hype logo" width={40} height={40} className="h-full w-full rounded-[10px] object-cover bg-white" />
        </div>
        <span className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-rose-400">
          Hype
        </span>
      </Link>

      <nav className="flex flex-col gap-2 flex-1">
        <Link href="/" className={`${base} ${isActive("/") ? active : inactive}`}>
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M11.47 3.84a.75.75 0 011.06 0l8.99 8.25a.75.75 0 11-1.04 1.1l-1.23-1.13v8.19c0 .97-.78 1.75-1.75 1.75h-5a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-2a.75.75 0 00-.75.75v4.5c0 .41-.34.75-.75.75h-5a.75.75 0 01-1.75-1.75v-8.19l-1.23 1.13a.75.75 0 11-1.04-1.1l8.99-8.25z"/></svg>
          Bảng tin
        </Link>

        <Link href="/messages" className={`${base} ${isActive("/messages") ? active : inactive}`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>
          Tin nhắn
        </Link>

        <Link href="/friends" className={`${base} ${isActive("/friends") ? active : inactive}`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
          Bạn bè
        </Link>

        <Link href="/profile" className={`${base} ${isActive("/profile") ? active : inactive}`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          Hồ sơ
        </Link>
      </nav>

      <div className="mt-auto border-t border-slate-100 pt-4 flex items-center gap-3 p-2 rounded-xl">
        <div className="h-10 w-10 rounded-full overflow-hidden bg-slate-200">
          {user?.avatarUrl ? (
            <Image src={user.avatarUrl} alt={user.fullName || "User"} width={40} height={40} className="w-full h-full object-cover rounded-full" unoptimized/>
          ) : null}
        </div>
        <div className="flex-1 overflow-hidden">
          <p className="text-sm font-bold text-slate-800 truncate">
            {user?.fullName || "Hype User"}
          </p>
          <p className="text-[11px] text-slate-500 truncate">
            {user?.username || "@user_hype"}
          </p>
        </div>
        <button
          onClick={handleLogout}
          title="Đăng xuất"
          className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
        </button>
      </div>
    </aside>
  );
}