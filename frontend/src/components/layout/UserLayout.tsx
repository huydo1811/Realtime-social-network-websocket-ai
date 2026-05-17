"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import LeftSidebar from "@/components/home/LeftSidebar";
import RightSidebar from "@/components/home/RightSidebar";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import UserTopBar from "@/components/layout/UserTopBar";
import { NavBadgesProvider } from "@/lib/nav/NavBadgesContext";
import { NotificationsProvider } from "@/lib/notifications/NotificationsContext";
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
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-rose-200 border-t-rose-500" />
        <p className="mt-4 text-sm font-medium text-slate-500">Đang xác thực...</p>
      </div>
    );
  }

  const handleLogout = () => {
    clearAuthTokens();
    router.replace("/login");
  };

  return (
    <NotificationsProvider>
      <NavBadgesProvider>
        <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex justify-center">
          <LeftSidebar />

          <main className="flex-1 flex flex-col items-center lg:ml-64 xl:ml-72 lg:mr-80 min-h-screen w-full overflow-hidden px-4 py-5 lg:py-6 pb-20 lg:pb-8">
            <div className="w-full max-w-3xl flex flex-col min-h-0 flex-1">
              <UserTopBar onLogout={handleLogout} />
              <div className="w-full flex-1">{children}</div>
            </div>
          </main>

          <RightSidebar />
          <MobileBottomNav />
        </div>
      </NavBadgesProvider>
    </NotificationsProvider>
  );
}
