"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import LeftSidebar from "@/components/home/LeftSidebar";
import RightSidebar from "@/components/home/RightSidebar";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import FriendshipNotificationHost from "@/components/friendship/FriendshipNotificationHost";
import { clearAuthTokens, getAuthTokens } from "@/lib/api/authToken";

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const verifyAuth = async () => {
      const tokens = getAuthTokens();
      
      if (!tokens || !tokens.accessToken) {
        router.replace("/login");
      } else {
        setIsAuthenticated(true);
      }
    };

    void verifyAuth();
  }, [router]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-rose-200 border-t-rose-500"></div>
        <p className="mt-4 text-sm font-medium text-slate-500">Đang xác thực...</p>
      </div>
    );
  }

  const handleLogout = () => {
    clearAuthTokens();
    router.replace("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex justify-center">
      <FriendshipNotificationHost />
      <LeftSidebar />

      <main className="flex-1 flex flex-col items-center lg:ml-64 xl:ml-72 lg:mr-80 min-h-screen w-full overflow-hidden px-4 py-5 lg:py-8 pb-20 lg:pb-8">
        
        <div className="w-full max-w-3xl">
          <div className="lg:hidden flex items-center justify-between mb-6 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-rose-500 to-rose-400 p-0.5 shadow-sm">
                <Image src="/hype.png" alt="logo" width={32} height={32} className="h-full w-full rounded-[6px] object-cover bg-white" />
              </div>
              <span className="text-xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-rose-400">Hype</span>
            </Link>
            <div className="flex items-center gap-1.5">
              <Link
                href="/settings/chat"
                className="h-8 w-8 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-600"
                title="Cài đặt"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </Link>
              <Link href="/profile" className="h-8 w-8 rounded-full bg-slate-200 overflow-hidden outline-none">
                <Image src="/hype.png" alt="avatar" width={32} height={32} className="object-cover w-full h-full" />
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="h-8 w-8 rounded-full border border-slate-200 bg-white flex items-center justify-center text-rose-500"
                title="Đăng xuất"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>

          <div className="w-full">
            {children}
          </div>
        </div>
      </main>

      <RightSidebar />
      <MobileBottomNav />
    </div>
  );
}