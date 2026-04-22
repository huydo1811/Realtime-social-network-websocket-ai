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
    <main>
      <header className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
        <h1 className="text-2xl font-bold text-slate-900">Hồ sơ admin</h1>
        <p className="text-sm text-slate-500">Thông tin tài khoản quản trị.</p>
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