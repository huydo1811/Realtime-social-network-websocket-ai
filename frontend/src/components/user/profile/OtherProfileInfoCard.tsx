"use client";

import { useState } from "react";
import Image from "next/image";
import { ProfileInfo, SocialPerson } from "./types";
import ProfileFeedSection from "./ProfileFeedSection";
import FollowListModal from "./FollowListModal";

type Props = {
  profile: ProfileInfo;
};

const defaultFollowers: SocialPerson[] = [
  { id: "u1", name: "Linh Trần", username: "linhtran", avatarUrl: "/hype.png" },
  { id: "u2", name: "Minh Quân", username: "minhquan", avatarUrl: "/hype.png" },
];

const defaultFollowing: SocialPerson[] = [
  { id: "u4", name: "Hà Phạm", username: "hapham", avatarUrl: "/hype.png" },
  { id: "u5", name: "Tuấn Võ", username: "tuanvo", avatarUrl: "/hype.png" },
  { id: "u6", name: "Mai Anh", username: "maianh", avatarUrl: "/hype.png" },
];

export default function OtherProfileInfoCard({ profile }: Props) {
  const stats = profile.stats ?? { posts: 0, followers: 120, following: 45 };
  const coverUrl = profile.coverUrl || "";
  const avatarUrl = profile.avatarUrl || "/hype.png";

  const [followModal, setFollowModal] = useState<"followers" | "following" | null>(null);

  const followerUsers = profile.followersList ?? defaultFollowers;
  const followingUsers = profile.followingList ?? defaultFollowing;

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div
          className="relative h-72 bg-gradient-to-br from-rose-500 via-pink-400 to-orange-300"
          style={
            coverUrl
              ? {
                  backgroundImage: `linear-gradient(120deg, rgba(225,29,72,.65), rgba(249,115,22,.35)), url(${coverUrl})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }
              : undefined
          }
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_20%,rgba(255,255,255,.35),transparent_25%),radial-gradient(circle_at_15%_80%,rgba(255,255,255,.28),transparent_35%)]" />

          <div className="absolute -bottom-14 left-5 right-5 rounded-2xl border border-white/35 bg-white/80 p-4 shadow-lg backdrop-blur-md">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              
              <div className="flex items-end gap-4">
                <div className="relative">
                  <Image
                    src={avatarUrl}
                    alt="avatar"
                    width={96}
                    height={96}
                    className="h-24 w-24 rounded-2xl border-4 border-white object-cover shadow-md bg-white"
                    unoptimized
                  />
                </div>
                <div className="pb-1">
                  <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">{profile.fullName}</h2>
                  <p className="text-sm font-medium text-slate-500">@{profile.username || "hype_user"}</p>
                </div>
              </div>

              <div className="flex items-center justify-start gap-2 pb-1">
                <button className="cursor-pointer flex items-center gap-2 rounded-xl bg-rose-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-rose-200 hover:bg-rose-600 transition-all active:scale-95">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                  Theo dõi
                </button>
                <button className="cursor-pointer flex items-center gap-2 rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-200 transition-all active:scale-95">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                  Nhắn tin
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 pb-6 pt-20 md:px-7">
          <p className="text-base leading-relaxed text-slate-700 font-medium">
            {profile.bio || "Người dùng này chưa có thông tin giới thiệu."}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm">
            <span className="flex items-center gap-1.5 cursor-default text-slate-600">
              <b className="text-slate-900 text-lg">{stats.posts}</b> Bài viết
            </span>
            <button 
              onClick={() => setFollowModal("followers")} 
              className="flex items-center gap-1.5 text-slate-600 hover:text-rose-600 cursor-pointer transition-colors"
            >
              <b className="text-slate-900 text-lg">{stats.followers}</b> Người theo dõi
            </button>
            <button 
              onClick={() => setFollowModal("following")} 
              className="flex items-center gap-1.5 text-slate-600 hover:text-rose-600 cursor-pointer transition-colors"
            >
              <b className="text-slate-900 text-lg">{stats.following}</b> Đang theo dõi
            </button>
          </div>
        </div>
      </section>

      <ProfileFeedSection avatarUrl={avatarUrl} initialPosts={[]} onPostsChanged={() => {}} readonly={true} />

      {/* Hiển thị Modal list Followers/Following */}
      <FollowListModal
        open={followModal === "followers"}
        title="Người theo dõi"
        users={followerUsers}
        onClose={() => setFollowModal(null)}
      />
      <FollowListModal
        open={followModal === "following"}
        title="Đang theo dõi"
        users={followingUsers}
        onClose={() => setFollowModal(null)}
      />
    </div>
  );
}