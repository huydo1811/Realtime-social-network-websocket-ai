"use client";

import { useState } from "react";
import type { FeedPost, ProfileInfo } from "./types";
import ProfileFeedSection from "./ProfileFeedSection";
import ProfilePetsSection from "./ProfilePetsSection";

type Props = {
  profile: ProfileInfo;
  avatarUrl: string;
  posts: FeedPost[];
  onPostsChanged?: (posts: FeedPost[]) => void;
  feedSource: "feed" | "me" | "user";
  isOwnProfile: boolean;
  isAdmin?: boolean;
  feedRefreshKey?: number;
  petsRefreshKey?: number;
};

type TabId = "posts" | "pets";

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: "posts", label: "Bài viết", icon: "📝" },
  { id: "pets", label: "Thú cưng", icon: "🐾" },
];

export default function ProfileTabs({
  profile,
  avatarUrl,
  posts,
  onPostsChanged,
  feedSource,
  isOwnProfile,
  isAdmin = false,
  feedRefreshKey = 0,
  petsRefreshKey = 0,
}: Props) {
  const [tab, setTab] = useState<TabId>("posts");

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1 rounded-2xl border border-slate-200 bg-slate-50/80 p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
              tab === t.id
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <span>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "posts" ? (
        <ProfileFeedSection
          avatarUrl={avatarUrl}
          composerName={profile.fullName}
          initialPosts={posts}
          onPostsChanged={onPostsChanged}
          source={feedSource}
          userId={profile.id}
          isAdmin={isAdmin}
          refreshKey={feedRefreshKey}
          readonly={feedSource === "user"}
        />
      ) : profile.id != null ? (
        <ProfilePetsSection
          userId={profile.id}
          isOwnProfile={isOwnProfile}
          refreshKey={petsRefreshKey}
        />
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-400">
          Không xác định được người dùng để tải thú cưng.
        </div>
      )}
    </div>
  );
}
