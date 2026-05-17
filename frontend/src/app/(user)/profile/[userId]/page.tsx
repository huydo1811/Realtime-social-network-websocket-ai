"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getUserById } from "@/lib/api/userApi";
import type { ProfileInfo } from "@/components/user/profile/types";
import UserLayout from "@/components/layout/UserLayout";
import OtherProfileInfoCard from "@/components/user/profile/OtherProfileInfoCard";

export default function UserProfilePage() {
  const { userId } = useParams();
  const router = useRouter(); 
  const [profile, setProfile] = useState<ProfileInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    getUserById(userId as string)
      .then((data) => setProfile(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return (
      <UserLayout>
        <div className="flex h-64 flex-col items-center justify-center space-y-4 animate-pulse">
           <div className="h-10 w-10 animate-spin rounded-full border-4 border-rose-200 border-t-rose-500"></div>
           <p className="text-slate-500 font-medium">Đang tải hồ sơ...</p>
        </div>
      </UserLayout>
    );
  }

  if (!profile) {
    return (
      <UserLayout>
        <div className="flex h-64 flex-col items-center justify-center space-y-4">
           <svg className="w-16 h-16 text-rose-300" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
           <p className="text-slate-600 font-bold text-xl">Người dùng này không tồn tại</p>
           <button onClick={() => router.back()} className="cursor-pointer text-rose-500 font-semibold hover:underline">Quay lại</button>
        </div>
      </UserLayout> 
    );
  }

  return (
    <UserLayout>
      <div className="relative">
        <div className="mb-5">
          <button 
            onClick={() => router.back()} 
            className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-600 shadow-sm transition hover:border-rose-200 hover:text-rose-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            Quay lại
          </button>
        </div>

        <OtherProfileInfoCard profile={profile} />
        
      </div>
    </UserLayout>
  );
}