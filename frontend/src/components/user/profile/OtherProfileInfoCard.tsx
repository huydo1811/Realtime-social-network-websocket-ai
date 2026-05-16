"use client";

import Image from "next/image";
import FriendActionButton from "@/components/friendship/FriendActionButton";
import { OpenDmBubbleButton } from "@/components/chat/FloatingDmProvider";
import ProfileFeedSection from "./ProfileFeedSection";
import { ProfileInfo } from "./types";

type Props = {
  profile: ProfileInfo;
};

export default function OtherProfileInfoCard({ profile }: Props) {
  const stats = profile.stats ?? { posts: 0 };
  const coverUrl = profile.coverUrl || "";
  const avatarUrl = profile.avatarUrl || "/hype.png";
  const targetId = profile.id;

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
                    className="h-24 w-24 rounded-2xl border-4 border-white bg-white object-cover shadow-md"
                    unoptimized
                  />
                </div>
                <div className="pb-1">
                  <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">{profile.fullName}</h2>
                  <p className="text-sm font-medium text-slate-500">@{profile.username || "hype_user"}</p>
                </div>
              </div>

              <div className="flex flex-col items-stretch gap-2 pb-1 sm:flex-row sm:items-center">
                {targetId != null ? (
                  <div className="min-w-0">
                    <FriendActionButton targetUserId={targetId} />
                  </div>
                ) : (
                  <span className="text-sm text-slate-500">Không xác định được người dùng.</span>
                )}
                {targetId != null ? (
                  <OpenDmBubbleButton
                    peerUserId={targetId}
                    className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-bold text-slate-700 transition-all hover:bg-slate-200 active:scale-95"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Nhắn tin
                  </OpenDmBubbleButton>
                ) : (
                  <span className="rounded-xl bg-slate-50 px-5 py-2.5 text-sm text-slate-400">Nhắn tin</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 pb-6 pt-20 md:px-7">
          <p className="text-base font-medium leading-relaxed text-slate-700">
            {profile.bio || "Người dùng này chưa có thông tin giới thiệu."}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-slate-600">
            <span className="flex cursor-default items-center gap-1.5">
              <b className="text-lg text-slate-900">{stats.posts}</b> bài viết
            </span>
          </div>
        </div>
      </section>

      <ProfileFeedSection avatarUrl={avatarUrl} initialPosts={[]} onPostsChanged={() => {}} readonly={true} />
    </div>
  );
}
