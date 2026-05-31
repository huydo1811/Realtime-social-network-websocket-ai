"use client";

import Image from "next/image";
import { ProfileInfo } from "./types";

type Props = {
  profile: ProfileInfo;
  avatarPreview: string;
  coverPreview: string;
  postCount: number;
  friendsCount?: number;
  onPickAvatar: () => void;
  onPickCover: () => void;
  onOpenFriends: () => void;
  onEdit: () => void;
  uploadingAvatar?: boolean;
  uploadingCover?: boolean;
};

export default function ProfileHero({
  profile,
  avatarPreview,
  coverPreview,
  postCount,
  friendsCount,
  onPickAvatar,
  onPickCover,
  onOpenFriends,
  onEdit,
  uploadingAvatar = false,
  uploadingCover = false,
}: Props) {
  const friends = friendsCount ?? 0;

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="relative h-56 overflow-hidden bg-slate-200 sm:h-64 md:h-72">
        {coverPreview ? (
          <Image
            src={coverPreview}
            alt="Ảnh bìa"
            fill
            priority
            sizes="(max-width: 768px) 100vw, 1200px"
            className="object-cover"
          />
        ) : null}

        <button
          type="button"
          onClick={onPickCover}
          disabled={uploadingCover}
          className="absolute right-4 top-4 z-10 cursor-pointer rounded-full border border-white/50 bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-white"
        >
          {uploadingCover ? "Đang tải ảnh bìa..." : "Đổi ảnh bìa"}
        </button>
      </div>

      <div className="relative px-5 pb-6 md:px-7">
        <div className="-mt-14 flex flex-col gap-4 sm:-mt-16 md:flex-row md:items-end md:justify-between">
          <div className="flex items-end gap-4">
            <button
              type="button"
              onClick={onPickAvatar}
              disabled={uploadingAvatar}
              className="relative z-10 shrink-0 cursor-pointer rounded-2xl disabled:cursor-not-allowed"
              aria-label="Đổi avatar"
            >
              <Image
                src={avatarPreview}
                alt="avatar"
                width={96}
                height={96}
                className="h-24 w-24 rounded-2xl border-4 border-white bg-white object-cover shadow-md shadow-slate-300/50"
              />
              <span className="absolute -bottom-1 right-0 cursor-pointer rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-semibold text-white hover:bg-rose-600">
                {uploadingAvatar ? "Đang tải..." : "Đổi"}
              </span>
            </button>
            <div className="min-w-0 pb-1">
              <h2 className="truncate text-2xl font-bold tracking-tight text-slate-900">
                {profile.fullName}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onEdit}
            className="shrink-0 cursor-pointer self-start rounded-full bg-rose-500 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-600 md:self-end"
          >
            Chỉnh sửa hồ sơ
          </button>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-slate-700">
          {profile.bio || "Chưa có mô tả."}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <span>
            <b className="text-slate-900">{postCount}</b> bài viết
          </span>

          <button
            type="button"
            onClick={onOpenFriends}
            className="cursor-pointer text-left hover:text-rose-600"
          >
            <b className="text-slate-900">{friends}</b> bạn bè
          </button>
        </div>
      </div>
    </section>
  );
}
