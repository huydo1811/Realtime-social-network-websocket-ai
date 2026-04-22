"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import LeftSidebar from "@/components/home/LeftSidebar";
import RightSidebar from "@/components/home/RightSidebar";
import { getAuthTokens } from "@/lib/api/authToken";

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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex justify-center">
      <LeftSidebar />

      <main className="flex-1 flex flex-col items-center md:ml-64 lg:ml-72 lg:mr-80 min-h-screen w-full w-full overflow-hidden px-4 py-8">
        
        <div className="w-full max-w-3xl">
          <div className="md:hidden flex items-center justify-between mb-6 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-rose-500 to-rose-400 p-0.5 shadow-sm">
                <Image src="/hype.png" alt="logo" width={32} height={32} className="h-full w-full rounded-[6px] object-cover bg-white" />
              </div>
              <span className="text-xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-rose-400">Hype</span>
            </Link>
            <Link href="/profile" className="h-8 w-8 rounded-full bg-slate-200 overflow-hidden outline-none">
              <Image src="/hype.png" alt="avatar" width={32} height={32} className="object-cover w-full h-full" />
            </Link>
          </div>

          <div className="w-full">
            {children}
          </div>
        </div>
      </main>

      <RightSidebar />
    </div>
  );
}