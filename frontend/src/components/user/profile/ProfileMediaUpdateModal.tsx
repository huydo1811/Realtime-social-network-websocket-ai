"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export type ProfileMediaVisibility = "PUBLIC" | "FRIENDS" | "PRIVATE";

type Props = {
  open: boolean;
  target: "avatar" | "cover" | null;
  previewUrl: string;
  submitting?: boolean;
  onClose: () => void;
  onConfirm: (payload: {
    visibility: ProfileMediaVisibility;
    applyVisibilityToAllPosts: boolean;
    postContent?: string;
  }) => Promise<void> | void;
};

const labels: Record<ProfileMediaVisibility, string> = {
  PUBLIC: "Công khai",
  FRIENDS: "Bạn bè",
  PRIVATE: "Riêng tư",
};

export default function ProfileMediaUpdateModal({
  open,
  target,
  previewUrl,
  submitting = false,
  onClose,
  onConfirm,
}: Props) {
  const [visibility, setVisibility] = useState<ProfileMediaVisibility>("PUBLIC");
  const [applyToPosts, setApplyToPosts] = useState(true);
  const [postContent, setPostContent] = useState("");

  useEffect(() => {
    if (!open) return;
    const saved = localStorage.getItem("defaultPostVisibility");
    if (saved === "PUBLIC" || saved === "FRIENDS" || saved === "PRIVATE") {
      setVisibility(saved);
    } else {
      setVisibility("PUBLIC");
    }
    setApplyToPosts(true);
    setPostContent("");
  }, [open, target]);

  if (!open || !target) return null;

  const title = target === "avatar" ? "Cập nhật ảnh đại diện" : "Cập nhật ảnh bìa";

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="cursor-pointer rounded-full p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
            aria-label="Đóng"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div
          className={`overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 ${
            target === "cover" ? "h-36" : "mx-auto h-32 w-32"
          }`}
        >
          {target === "cover" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="Xem trước ảnh bìa"
              className="h-full w-full object-cover"
            />
          ) : (
            <Image
              src={previewUrl}
              alt="Xem trước avatar"
              width={128}
              height={128}
              className="h-full w-full object-cover"
            />
          )}
        </div>

        <div className="mt-4">
          <label className="mb-1 block text-sm font-semibold text-slate-700">
            Nội dung bài đăng (tuỳ chọn)
          </label>
          <textarea
            value={postContent}
            onChange={(e) => setPostContent(e.target.value)}
            disabled={submitting}
            placeholder={
              target === "avatar"
                ? "Viết cảm nghĩ khi đổi ảnh đại diện..."
                : "Viết cảm nghĩ khi đổi ảnh bìa..."
            }
            className="min-h-20 w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-rose-100"
          />
          <p className="mt-1 text-xs text-slate-500">
            Ảnh sẽ tự đăng lên bảng tin. Chỉ thêm chú thích nếu bạn muốn.
          </p>
        </div>

        <div className="mt-4">
          <label className="mb-1 block text-sm font-semibold text-slate-700">
            Ai có thể xem?
          </label>
          <select
            value={visibility}
            onChange={(e) =>
              setVisibility(e.target.value as ProfileMediaVisibility)
            }
            disabled={submitting}
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-rose-100"
          >
            <option value="PUBLIC">{labels.PUBLIC}</option>
            <option value="FRIENDS">{labels.FRIENDS}</option>
            <option value="PRIVATE">{labels.PRIVATE}</option>
          </select>
        </div>

        <label className="mt-3 flex cursor-pointer items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
          <input
            type="checkbox"
            checked={applyToPosts}
            onChange={(e) => setApplyToPosts(e.target.checked)}
            disabled={submitting}
            className="mt-0.5"
          />
          <span className="text-sm text-slate-700">
            Áp dụng quyền xem <b>{labels[visibility]}</b> cho tất cả bài viết của bạn
          </span>
        </label>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="cursor-pointer rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() =>
              void onConfirm({
                visibility,
                applyVisibilityToAllPosts: applyToPosts,
                postContent: postContent.trim(),
              })
            }
            className="cursor-pointer rounded-full bg-rose-500 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-600 disabled:opacity-60"
          >
            {submitting ? "Đang lưu..." : "Lưu và đăng bài"}
          </button>
        </div>
      </div>
    </div>
  );
}
