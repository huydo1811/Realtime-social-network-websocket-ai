"use client";

import { useMemo, useRef, useState } from "react";
import FollowListModal from "./FollowListModal";
import ProfileFeedSection from "./ProfileFeedSection";
import ProfileHero from "./ProfileHero";
import EditProfileForm from "./EditProfileForm";
import SecuritySettings from "./SecuritySettings";
import { FeedPost, ProfileInfo, SocialPerson } from "./types";

type Props = {
  profile: ProfileInfo;
};

const defaultPosts: FeedPost[] = [
  { id: "p1", content: "Tụi mình vừa tối ưu lại luồng realtime và giảm độ trễ chat xuống rõ rệt.", likes: 284, comments: 42, createdAt: "2 giờ trước" },
  { id: "p2", content: "Thử vài hướng visual cá tính hơn, ưu tiên dễ đọc và cảm xúc.", likes: 197, comments: 28, createdAt: "Hôm qua" },
  { id: "p3", content: "Các điểm nghẽn phổ biến khi concurrent users tăng cao.", likes: 351, comments: 63, createdAt: "3 ngày trước" },
];

const defaultFollowers: SocialPerson[] = [
  { id: "u1", name: "Linh Trần", username: "linhtran", avatarUrl: "/hype.png" },
  { id: "u2", name: "Minh Quân", username: "minhquan", avatarUrl: "/hype.png" },
  { id: "u3", name: "An Nhiên", username: "annhien", avatarUrl: "/hype.png" },
];

const defaultFollowing: SocialPerson[] = [
  { id: "u4", name: "Hà Phạm", username: "hapham", avatarUrl: "/hype.png" },
  { id: "u5", name: "Tuấn Võ", username: "tuanvo", avatarUrl: "/hype.png" },
  { id: "u6", name: "Mai Anh", username: "maianh", avatarUrl: "/hype.png" },
];

export default function ProfileInfoCard({ profile }: Props) {
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);

  // localProfile allows instant UI updates when editing
  const [localProfile, setLocalProfile] = useState<ProfileInfo>(profile);
  const [avatarPreview, setAvatarPreview] = useState(localProfile.avatarUrl || "/hype.png");
  const [coverPreview, setCoverPreview] = useState(localProfile.coverUrl || "");
  const [posts, setPosts] = useState<FeedPost[]>(localProfile.posts ?? defaultPosts);

  const [followModal, setFollowModal] = useState<"followers" | "following" | null>(null);
  const [editing, setEditing] = useState(false);
  const [showSecurity, setShowSecurity] = useState(false);

  const postCount = useMemo(() => {
    const base = localProfile.stats?.posts ?? posts.length;
    return base + Math.max(0, posts.length - defaultPosts.length);
  }, [localProfile.stats?.posts, posts.length]);

  function onPickImage(file: File | undefined, target: "avatar" | "cover") {
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (target === "avatar") {
      setAvatarPreview(url);
      setLocalProfile({ ...localProfile, avatarUrl: url });
    } else {
      setCoverPreview(url);
      setLocalProfile({ ...localProfile, coverUrl: url });
    }
  }

  const followerUsers = localProfile.followersList ?? defaultFollowers;
  const followingUsers = localProfile.followingList ?? defaultFollowing;

  function handleStartEdit() {
    setEditing(true);
    // close follow modals if open
    setFollowModal(null);
  }

  function handleCancelEdit() {
    setEditing(false);
    // revert previews to current localProfile
    setAvatarPreview(localProfile.avatarUrl || "/hype.png");
    setCoverPreview(localProfile.coverUrl || "");
  }

  function handleSaveEdit(newValues: Partial<ProfileInfo>) {
    const updated = { ...localProfile, ...newValues };
    setLocalProfile(updated);
    setAvatarPreview(updated.avatarUrl || "/hype.png");
    setCoverPreview(updated.coverUrl || "");
    setEditing(false);
  }

  function handleOpenSecurity() {
    setShowSecurity(true);
    setEditing(false);
    setFollowModal(null);
  }

  function handleCloseSecurity() {
    setShowSecurity(false);
  }

  return (
    <div className="space-y-4">
      <ProfileHero
        profile={localProfile}
        avatarPreview={avatarPreview}
        coverPreview={coverPreview}
        postCount={postCount}
        onPickAvatar={() => avatarInputRef.current?.click()}
        onPickCover={() => coverInputRef.current?.click()}
        onOpenFollowers={() => !editing && setFollowModal("followers")}
        onOpenFollowing={() => !editing && setFollowModal("following")}
        onEdit={handleStartEdit}
      />

      <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => onPickImage(e.target.files?.[0], "avatar")} />
      <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => onPickImage(e.target.files?.[0], "cover")} />

      {editing && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <EditProfileForm
            initialValue={{
              email: localProfile.email ?? "",
              phone: localProfile.phone ?? "",
              username: localProfile.username ?? "",
              fullName: localProfile.fullName ?? "",
              bio: localProfile.bio ?? "",
              location: localProfile.location ?? "",
              website: localProfile.website ?? "",
              avatarUrl: localProfile.avatarUrl ?? undefined,
              coverUrl: localProfile.coverUrl ?? undefined,
            }}
            onClose={handleCancelEdit}
            onSaved={(v) =>
              handleSaveEdit({
                email: v.email,
                phone: v.phone,
                username: v.username,
                fullName: v.fullName,
                bio: v.bio,
                location: v.location,
                website: v.website,
                avatarUrl: v.avatarUrl,
                coverUrl: v.coverUrl,
              })
            }
            onOpenSecurity={() => handleOpenSecurity()}
          />
        </div>
      )}
      {showSecurity && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <SecuritySettings
            initialEmail={localProfile.email}
            initialPhone={localProfile.phone}
            onClose={handleCloseSecurity}
            onOpenEdit={handleStartEdit}
            onSaved={(payload: Partial<ProfileInfo>) => {
              handleSaveEdit(payload);
            }}
          />
        </div>
      )}

      {/* Hide feed and follow-modals while editing or showing security */}
      {!editing && !showSecurity && <ProfileFeedSection avatarUrl={avatarPreview} initialPosts={posts} onPostsChanged={setPosts} />}

      <FollowListModal
        open={!editing && !showSecurity && followModal === "followers"}
        title="Followers"
        users={followerUsers}
        onClose={() => setFollowModal(null)}
      />
      <FollowListModal
        open={!editing && !showSecurity && followModal === "following"}
        title="Following"
        users={followingUsers}
        onClose={() => setFollowModal(null)}
      />
    </div>
  );
}