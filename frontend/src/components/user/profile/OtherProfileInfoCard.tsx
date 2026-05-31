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
      <section className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-sm shadow-slate-200/60">
        <div className="relative h-56 overflow-hidden bg-slate-200 sm:h-64 md:h-72">
          {coverUrl ? (
            <Image
              src={coverUrl}
              alt="Ảnh bìa"
              fill
              sizes="(max-width: 768px) 100vw, 1200px"
              className="object-cover"
              unoptimized
            />
          ) : null}
        </div>

        <div className="relative px-5 pb-6 md:px-7">
          <div className="-mt-14 flex flex-col gap-4 sm:-mt-16 md:flex-row md:items-end md:justify-between">
            <div className="flex items-end gap-4">
              <div className="relative z-10 shrink-0">
                <Image
                  src={avatarUrl}
                  alt="avatar"
                  width={96}
                  height={96}
                  className="h-24 w-24 rounded-2xl border-4 border-white bg-white object-cover shadow-md"
                  unoptimized
                />
              </div>
              <div className="min-w-0 pb-1">
                <h2 className="truncate text-2xl font-black tracking-tight text-slate-900 md:text-[1.75rem]">
                  {profile.fullName}
                </h2>
                <p className="truncate text-sm font-medium text-slate-500">
                  @{profile.username || "hype_user"}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center md:shrink-0">
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
                  className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-200"
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

          <p className="mt-4 text-base font-medium leading-relaxed text-slate-700">
            {profile.bio || "Người dùng này chưa có thông tin giới thiệu."}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-slate-600">
            <span className="flex cursor-default items-center gap-1.5">
              <b className="text-lg text-slate-900">{stats.posts}</b> bài viết
            </span>
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm h-fit lg:sticky lg:top-6">
          <h4 className="text-sm font-bold text-slate-900">Giới thiệu</h4>
          <p className="mt-2 text-sm text-slate-600">
            {profile.bio || "Người dùng này chưa có thông tin giới thiệu."}
          </p>
          <div className="mt-4 space-y-2 text-sm text-slate-600">
            <p><span className="font-semibold text-slate-800">Username:</span> @{profile.username || "hype_user"}</p>
            <p><span className="font-semibold text-slate-800">Bài viết:</span> {stats.posts ?? 0}</p>
          </div>
        </aside>
        <div>
          <ProfileFeedSection
            avatarUrl={avatarUrl}
            initialPosts={[]}
            onPostsChanged={() => {}}
            readonly={true}
            source="user"
            userId={profile.id}
          />
        </div>
      </div>
    </div>
  );
}
