"use client";

import ProfileInfoCard from "../../../components/user/profile/ProfileInfoCard";

const mockProfile = {
  fullName: "Do Quang Huy",
  username: "quanghuy",
  email: "huy@example.com",
  phone: "0901234567",
  bio: "Xây dựng trải nghiệm mạng xã hội realtime, nơi mọi tương tác đều nhanh và sống động. Mình thích sản phẩm gọn, đẹp và có chiều sâu cộng đồng.",
  avatarUrl: "/hype.png",
  coverUrl: "",
  role: "USER",
  active: true,
  createdAt: "2026-03-01",
  updatedAt: "2026-04-13",
  location: "Ho Chi Minh City",
  website: "https://hype.vn/@quanghuy",
  stats: { posts: 124, followers: 3890, following: 412 },
};

export default function ProfilePage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-800">
      <div className="mx-auto max-w-6xl px-4 py-4 md:px-6 md:py-6">
        <ProfileInfoCard profile={mockProfile} />
      </div>
    </main>
  );
}