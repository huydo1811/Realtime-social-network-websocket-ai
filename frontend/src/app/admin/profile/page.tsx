"use client";

import AdminProfileCard from "../../../components/admin/profile/AdminProfileCard";

export default function AdminProfilePage() {
  return (
    <main>
      <header className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Hồ sơ admin</h1>
            <p className="text-sm text-slate-500">Thông tin tài khoản quản trị.</p>
          </div>
        </div>
      </header>

      <AdminProfileCard
        name="Admin Hype"
        email="admin@hype.vn"
        phone="0909999999"
        role="ADMIN"
        active={true}
        bio="Quản trị vận hành hệ thống, người dùng và moderation."
        avatarUrl="/hype.png"
      />
    </main>
  );
}