"use client";

import { useCallback, useEffect, useState } from "react";
import ProfileFeedSection from "@/components/user/profile/ProfileFeedSection";
import { getMyProfile } from "@/lib/api/authApi";
import { getAuthTokens } from "@/lib/api/authToken";
import { getUserIdFromAccessToken } from "@/lib/auth/jwtSubject";
import {
  PROFILE_UPDATED_EVENT,
  type ProfileUpdatedDetail,
} from "@/lib/profile/profileEvents";

export default function Newsfeed() {
  const token = getAuthTokens()?.accessToken;
  const actorId = token ? getUserIdFromAccessToken(token) : null;
  const [avatarUrl, setAvatarUrl] = useState("/hype.png");
  const [feedRefreshKey, setFeedRefreshKey] = useState(0);

  const loadMyAvatar = useCallback(async () => {
    const accessToken = getAuthTokens()?.accessToken;
    if (!accessToken) return;
    try {
      const profile = (await getMyProfile(accessToken)) as {
        avatarUrl?: string;
      };
      setAvatarUrl(profile.avatarUrl?.trim() || "/hype.png");
    } catch {
      setAvatarUrl("/hype.png");
    }
  }, []);

  useEffect(() => {
    void loadMyAvatar();
  }, [loadMyAvatar]);

  useEffect(() => {
    function onProfileUpdated(e: Event) {
      const detail = (e as CustomEvent<ProfileUpdatedDetail>).detail;
      if (detail?.avatarUrl) setAvatarUrl(detail.avatarUrl);
      setFeedRefreshKey((k) => k + 1);
    }
    window.addEventListener(PROFILE_UPDATED_EVENT, onProfileUpdated);
    return () => window.removeEventListener(PROFILE_UPDATED_EVENT, onProfileUpdated);
  }, []);

  return (
    <section>
      <ProfileFeedSection
        avatarUrl={avatarUrl}
        initialPosts={[]}
        source="feed"
        userId={actorId ?? undefined}
        refreshKey={feedRefreshKey}
      />
    </section>
  );
}
