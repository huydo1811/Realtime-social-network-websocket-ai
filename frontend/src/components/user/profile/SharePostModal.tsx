"use client";

import { useMemo, useState } from "react";

import type { FeedPost } from "./types";

type Props = {
  open: boolean;
  post: FeedPost | null;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    postId: string;
    content?: string;
    visibility: "PUBLIC" | "FRIENDS" | "PRIVATE";
  }) => Promise<void> | void;
};

export default function SharePostModal({
  open,
  post,
  submitting = false,
  onClose,
  onSubmit,
}: Props) {
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState<"PUBLIC" | "FRIENDS" | "PRIVATE">(
    "PUBLIC"
  );

  const canSubmit = useMemo(() => Boolean(post?.id), [post?.id]);

  if (!open || !post) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-[2px]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">Chia sẻ bài viết</h3>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-full p-1.5 text-slate-500 hover:bg-slate-100"
            aria-label="Đóng"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Nội dung bài gốc</p>
          <p className="mt-1 text-sm text-slate-700">{post.sharedPost?.content || post.content}</p>
        </div>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Viết cảm nghĩ khi chia sẻ (tuỳ chọn)"
          className="mt-4 h-24 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-rose-100"
        />

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-700">Chế độ chia sẻ:</span>
            <select
              value={visibility}
              onChange={(e) =>
                setVisibility(e.target.value as "PUBLIC" | "FRIENDS" | "PRIVATE")
              }
              className="rounded-full border border-slate-200 px-3 py-1.5 text-sm"
            >
              <option value="PUBLIC">Công khai</option>
              <option value="FRIENDS">Bạn bè</option>
              <option value="PRIVATE">Riêng tư</option>
            </select>
          </div>

          <button
            type="button"
            disabled={!canSubmit || submitting}
            onClick={() =>
              void onSubmit({
                postId: post.id,
                content: content.trim() || undefined,
                visibility,
              })
            }
            className="cursor-pointer rounded-full bg-rose-500 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-rose-600 disabled:opacity-60"
          >
            {submitting ? "Đang chia sẻ..." : "Chia sẻ ngay"}
          </button>
        </div>
      </div>
    </div>
  );
}
