"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import FriendListModal from "./FriendListModal";
import ProfileFeedSection from "./ProfileFeedSection";
import ProfileHero from "./ProfileHero";
import EditProfileForm from "./EditProfileForm";
import SecuritySettings from "./SecuritySettings";
import { FeedPost, ProfileInfo, SocialPerson } from "./types";
import { listFriends } from "@/lib/api/friendshipApi";
import { getAuthTokens } from "@/lib/api/authToken";
import { getUserIdFromAccessToken } from "@/lib/auth/jwtSubject";
import { loadProfilesByIds } from "@/lib/friendship/loadProfiles";
import { peerUserId } from "@/lib/friendship/peerUserId";

type Props = {
  profile: ProfileInfo;
};

const defaultPosts: FeedPost[] = [
  { id: "p1", content: "Tụi mình vừa tối ưu lại luồng realtime và giảm độ trễ chat xuống rõ rệt.", likes: 284, comments: 42, createdAt: "2 giờ trước" },
  { id: "p2", content: "Thử vài hướng visual cá tính hơn, ưu tiên dễ đọc và cảm xúc.", likes: 197, comments: 28, createdAt: "Hôm qua" },
  { id: "p3", content: "Các điểm nghẽn phổ biến khi concurrent users tăng cao.", likes: 351, comments: 63, createdAt: "3 ngày trước" },
];

export default function ProfileInfoCard({ profile }: Props) {
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);

  const [localProfile, setLocalProfile] = useState<ProfileInfo>(profile);
  const [avatarPreview, setAvatarPreview] = useState(localProfile.avatarUrl || "/hype.png");
  const [coverPreview, setCoverPreview] = useState(localProfile.coverUrl || "");
  const [posts, setPosts] = useState<FeedPost[]>(localProfile.posts ?? defaultPosts);

  const [friendsModalOpen, setFriendsModalOpen] = useState(false);
  const [friendModalUsers, setFriendModalUsers] = useState<SocialPerson[]>([]);
  const [friendsModalLoading, setFriendsModalLoading] = useState(false);
  const [friendsCount, setFriendsCount] = useState(0);

  const [editing, setEditing] = useState(false);
  const [showSecurity, setShowSecurity] = useState(false);

  const postCount = useMemo(() => {
    const base = localProfile.stats?.posts ?? posts.length;
    return base + Math.max(0, posts.length - defaultPosts.length);
  }, [localProfile.stats?.posts, posts.length]);

  const refreshFriendsCount = useCallback(async () => {
    try {
      const list = await listFriends();
      setFriendsCount(list.length);
    } catch {
      setFriendsCount(0);
    }
  }, []);

  useEffect(() => {
    void refreshFriendsCount();
    const h = () => void refreshFriendsCount();
    window.addEventListener("friendship-changed", h);
    return () => window.removeEventListener("friendship-changed", h);
  }, [refreshFriendsCount]);

  async function handleOpenFriendsModal() {
    if (editing || showSecurity) return;
    setFriendsModalOpen(true);
    setFriendsModalLoading(true);
    try {
      const token = getAuthTokens()?.accessToken;
      const me = token ? getUserIdFromAccessToken(token) : null;
      if (me == null) {
        setFriendModalUsers([]);
        return;
      }
      const rows = await listFriends();
      const peers = rows.map((r) => peerUserId(r, me));
      const map = await loadProfilesByIds(peers);
      setFriendModalUsers(
        peers.map((id) => {
          const p = map.get(id);
          return {
            id: String(id),
            name: p?.fullName ?? `Người dùng #${id}`,
            username: p?.username ?? "user",
            avatarUrl: p?.avatarUrl ?? "/hype.png",
          };
        })
      );
    } catch {
      setFriendModalUsers([]);
    } finally {
      setFriendsModalLoading(false);
    }
  }

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

  function handleStartEdit() {
    setEditing(true);
    setFriendsModalOpen(false);
  }

  function handleCancelEdit() {
    setEditing(false);
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
    setFriendsModalOpen(false);
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
        friendsCount={friendsCount}
        onPickAvatar={() => avatarInputRef.current?.click()}
        onPickCover={() => coverInputRef.current?.click()}
        onOpenFriends={() => void handleOpenFriendsModal()}
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

      {!editing && !showSecurity && <ProfileFeedSection avatarUrl={avatarPreview} initialPosts={posts} onPostsChanged={setPosts} />}

      <FriendListModal
        open={!editing && !showSecurity && friendsModalOpen}
        title="Bạn bè"
        users={friendModalUsers}
        loading={friendsModalLoading}
        onClose={() => setFriendsModalOpen(false)}
      />
    </div>
  );
}
