export const PROFILE_UPDATED_EVENT = "profile-updated";

export type ProfileUpdatedDetail = {
  avatarUrl?: string;
  coverUrl?: string;
  fullName?: string;
  username?: string;
};

export function emitProfileUpdated(detail: ProfileUpdatedDetail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(PROFILE_UPDATED_EVENT, { detail }));
}
