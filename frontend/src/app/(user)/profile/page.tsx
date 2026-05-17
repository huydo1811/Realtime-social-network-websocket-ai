"use client";

import ProfileInfoCard from "@/components/user/profile/ProfileInfoCard";
import UserLayout from "@/components/layout/UserLayout";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuthTokens, clearAuthTokens } from "@/lib/api/authToken";
import { getMyProfile } from "@/lib/api/authApi";
import { ProfileInfo } from "@/components/user/profile/types";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      const tokens = getAuthTokens();
      if (!tokens?.accessToken) {
        router.replace("/login");
        if (mounted) setLoading(false);
        return;
      }

      try {
        const data = await getMyProfile(tokens.accessToken);
        if (!mounted) return;
        setProfile(data as ProfileInfo);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err || "");
        if (msg.includes("401") || msg.includes("403") || msg.toLowerCase().includes("unauthorized") || msg.toLowerCase().includes("forbidden")) {
          clearAuthTokens();
          router.replace("/login");
          return;
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadProfile();

    return () => {
      mounted = false;
    };
  }, [router]);

  if (loading) {
    return (
      <UserLayout>
        <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
          <div className="flex flex-col items-center justify-center gap-4 py-12">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-rose-200 border-t-rose-500" />
            <p className="text-sm font-medium text-slate-500">Đang tải hồ sơ...</p>
          </div>
        </div>
      </UserLayout>
    );
  }

  if (!profile) {
    return (
      <UserLayout>
        <div className="rounded-3xl border border-rose-100 bg-white p-10 shadow-sm">
          <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
            <p className="text-lg font-bold text-slate-800">Không thể lấy thông tin người dùng</p>
            <p className="text-sm text-slate-500">Vui lòng thử tải lại trang hoặc đăng nhập lại.</p>
          </div>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <ProfileInfoCard profile={profile} />
    </UserLayout>
  );
}