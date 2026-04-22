"use client";

import Image from "next/image";
import { ProfileInfo } from "./types";

type Props = {
  profile: ProfileInfo;
  avatarPreview: string;
  coverPreview: string;
  postCount: number;
  onPickAvatar: () => void;
  onPickCover: () => void;
  onOpenFollowers: () => void;
  onOpenFollowing: () => void;
  onEdit: () => void;
};

export default function ProfileHero({
  profile,
  avatarPreview,
  coverPreview,
  postCount,
  onPickAvatar,
  onPickCover,
  onOpenFollowers,
  onOpenFollowing,
  onEdit,
}: Props) {
  const stats = profile.stats ?? { posts: 124, followers: 3890, following: 412 };

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div
        className="relative h-72 bg-gradient-to-br from-rose-500 via-pink-400 to-orange-300"
        style={
          coverPreview
            ? {
                backgroundImage: `linear-gradient(120deg, rgba(225,29,72,.65), rgba(249,115,22,.35)), url(${coverPreview})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : undefined
        }
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_20%,rgba(255,255,255,.35),transparent_25%),radial-gradient(circle_at_15%_80%,rgba(255,255,255,.28),transparent_35%)]" />

        <button
          type="button"
          onClick={onPickCover}
          className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow hover:bg-white cursor-pointer"
        >
          Đổi ảnh bìa
        </button>

        <div className="absolute -bottom-14 left-5 right-5 rounded-2xl border border-white/35 bg-white/75 p-3 shadow-lg backdrop-blur-md">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="flex items-end gap-3">
              <button type="button" onClick={onPickAvatar} className="relative rounded-2xl" aria-label="Đổi avatar">
                <Image
                  src={avatarPreview}
                  alt="avatar"
                  width={96}
                  height={96}
                  className="h-24 w-24 rounded-2xl border-4 border-white object-cover shadow-md"
                />
                <span className="absolute -bottom-1 right-0 rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-semibold text-white cursor-pointer hover:bg-rose-600">
                  Đổi
                </span>
              </button>
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">{profile.fullName}</h2>
                <p className="text-sm font-medium text-slate-600">@{profile.username}</p>
              </div>
            </div>

            <button
              onClick={onEdit}
              className="cursor-pointer rounded-full bg-rose-500 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-600"
            >
              Chỉnh sửa hồ sơ
            </button>
          </div>
        </div>
      </div>

      <div className="px-5 pb-6 pt-20 md:px-7">
        <p className="text-sm leading-relaxed text-slate-700">{profile.bio || "Chưa có mô tả."}</p>

        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <span><b className="text-slate-900">{postCount}</b> bài viết</span>

          <button onClick={onOpenFollowers} className="text-left hover:text-rose-600 cursor-pointer">
            <b className="text-slate-900 cursor-pointer">{stats.followers}</b> followers
          </button>

          <button onClick={onOpenFollowing} className="text-left hover:text-rose-600 cursor-pointer">
            <b className="text-slate-900 cursor-pointer">{stats.following}</b> following
          </button>

        </div>
      </div>
    </section>
  );
}