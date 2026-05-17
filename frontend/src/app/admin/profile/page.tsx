"use client";

import { useEffect, useState } from "react";
import AdminProfileCard from "../../../components/admin/profile/AdminProfileCard";
import { getMyProfile } from "@/lib/api/userApi";

interface AdminProfileData {
  id: number;
  fullName: string;
  email: string;
  phone?: string;
  role: string;
  active?: boolean; 
  isActive?: boolean;
  bio?: string;
  avatarUrl?: string;
}

export default function AdminProfilePage() {
  const [profile, setProfile] = useState<AdminProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyProfile()
      .then((data) => setProfile(data as unknown as AdminProfileData))
      .catch((err) => console.error("Error fetching admin profile", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="space-y-5">
      <header className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/60 md:p-6">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-rose-500">Admin Console</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Hồ sơ quản trị</h1>
        <p className="mt-1 text-sm text-slate-500">Quản lý thông tin tài khoản và bảo mật quản trị viên.</p>
      </header>

      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-64 w-full rounded-2xl bg-white blur-sm"></div>
        </div>
      ) : profile ? (
        <AdminProfileCard
          name={profile.fullName || "Admin Hype"}
          email={profile.email}
          phone={profile.phone || "Chưa cập nhật"}
          role={profile.role || "ADMIN"}
          active={profile.active ?? profile.isActive ?? true}
          bio={profile.bio || "Quản trị vận hành hệ thống, người dùng và moderation."}
          avatarUrl={profile.avatarUrl || "/hype.png"}
        />
      ) : (
        <p className="text-red-500">Không thể tải hồ sơ. Vui lòng đăng nhập lại.</p>
      )}
    </main>
  );
}