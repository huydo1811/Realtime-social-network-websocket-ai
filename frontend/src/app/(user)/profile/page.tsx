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
        <div className="flex h-64 items-center justify-center">Đang tải hồ sơ...</div>
      </UserLayout>
    );
  }

  if (!profile) {
    return (
      <UserLayout>
        <div className="flex h-64 items-center justify-center">Không thể lấy thông tin người dùng.</div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <ProfileInfoCard profile={profile} />
    </UserLayout>
  );
}