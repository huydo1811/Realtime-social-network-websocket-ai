"use client";

import { useState } from "react";
import FriendActionButton from "@/components/friendship/FriendActionButton";
import { OpenDmBubbleButton } from "@/components/chat/FloatingDmProvider";
import ProfileFeedSection from "./ProfileFeedSection";
import ProfileHero from "./ProfileHero";
import type { FeedPost, ProfileInfo } from "./types";

type Props = {
  profile: ProfileInfo;
};

export default function OtherProfileInfoCard({ profile }: Props) {
  const coverUrl = profile.coverUrl || "";
  const avatarUrl = profile.avatarUrl || "/hype.png";
  const targetId = profile.id;
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const postCount = posts.length;

  return (
    <div className="space-y-4">
      <ProfileHero
        profile={profile}
        avatarPreview={avatarUrl}
        coverPreview={coverUrl}
        postCount={postCount}
        readOnly
        emptyBioLabel="Người dùng này chưa có thông tin giới thiệu."
        headerActions={
          <>
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
          </>
        }
      />

      <div className="space-y-4">
        <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h4 className="text-sm font-bold text-slate-900">Giới thiệu</h4>
          <p className="mt-2 text-sm text-slate-600">
            {profile.bio || "Người dùng này chưa có thông tin giới thiệu."}
          </p>
        </aside>

        <ProfileFeedSection
          avatarUrl={avatarUrl}
          initialPosts={[]}
          onPostsChanged={setPosts}
          readonly
          source="user"
          userId={profile.id}
        />
      </div>
    </div>
  );
}
