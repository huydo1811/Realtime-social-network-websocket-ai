"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import PostMediaDisplay from "./PostMediaDisplay";
import { FeedPost } from "./types";

type CommentItem = {
  id: string;
  authorName: string;
  authorAvatar?: string;
  text: string;
  createdAt?: string;
  parentCommentId?: string;
  likeCount: number;
  likedByMe: boolean;
};

type Props = {
  post: FeedPost | null;
  liked: boolean;
  comments: CommentItem[];
  onClose: () => void;
  onToggleLike: (postId: string) => void;
  onAddComment: (postId: string, text: string) => void;
  onToggleCommentLike: (postId: string, commentId: string) => Promise<void> | void;
  onAddReply: (postId: string, parentCommentId: string, text: string) => Promise<void> | void;
};

export default function PostDetailModal({
  post,
  liked,
  comments,
  onClose,
  onToggleLike,
  onAddComment,
  onToggleCommentLike,
  onAddReply,
}: Props) {
  const [text, setText] = useState("");
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [replyDraft, setReplyDraft] = useState<Record<string, string>>({});
  const [openReplyFor, setOpenReplyFor] = useState<string | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!post) return null;
  const activePost = post;
  const hasMedia = Boolean(activePost.mediaUrl);
  const rootComments = comments.filter((c) => !c.parentCommentId);
  const repliesMap = comments.reduce<Record<string, CommentItem[]>>((acc, c) => {
    if (!c.parentCommentId) return acc;
    if (!acc[c.parentCommentId]) acc[c.parentCommentId] = [];
    acc[c.parentCommentId].push(c);
    return acc;
  }, {});

  function submitComment() {
    const value = text.trim();
    if (!value) return;
    onAddComment(activePost.id, value);
    setText("");
    setTimeout(() => {
      contentRef.current?.scrollTo({
        top: contentRef.current.scrollHeight,
        behavior: "smooth",
      });
    }, 120);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[radial-gradient(1200px_500px_at_15%_10%,rgba(244,63,94,0.12),transparent_45%),radial-gradient(900px_500px_at_85%_0%,rgba(59,130,246,0.1),transparent_40%),rgba(15,23,42,0.46)] p-2 backdrop-blur-[3px] md:p-6"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full ${hasMedia ? "max-w-6xl" : "max-w-4xl"} px-1 sm:px-2`}
      >
        <div className="rounded-[28px] bg-gradient-to-br from-white/70 via-white/30 to-slate-200/20 p-[1px] shadow-[0_20px_55px_rgba(15,23,42,0.25)]">
          <div
            className={`overflow-hidden rounded-[27px] bg-white/98 ${
              hasMedia ? "grid max-h-[90vh] lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]" : ""
            }`}
          >
            {hasMedia && (
              <div className="flex min-h-[220px] items-center justify-center border-b border-slate-200 bg-white p-3 lg:max-h-[90vh] lg:border-b-0 lg:border-r">
                <PostMediaDisplay
                  mediaUrl={activePost.mediaUrl as string}
                  alt="post media"
                  variant="modal"
                  className="!bg-transparent"
                />
              </div>
            )}

            <div className="flex max-h-[84vh] flex-col bg-white lg:max-h-[90vh]">
              <div className="border-b border-slate-100 px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {activePost.authorAvatar ? (
                      <Image
                        src={activePost.authorAvatar}
                        alt="avatar"
                        width={46}
                        height={46}
                        className="h-11 w-11 rounded-full object-cover ring-2 ring-white shadow"
                      />
                    ) : (
                      <div className="h-11 w-11 rounded-full bg-slate-200" />
                    )}

                    <div>
                      <p className="text-sm font-semibold text-slate-900">{activePost.authorName ?? "Người dùng"}</p>
                      <p className="text-xs text-slate-500">{activePost.createdAt}</p>
                    </div>
                  </div>

                  <button
                    onClick={onClose}
                    className="cursor-pointer rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    Đóng
                  </button>
                </div>

                <div className="mt-3 rounded-2xl bg-slate-50/80 px-4 py-3">
                  <p className="text-sm leading-6 text-slate-800">{activePost.content}</p>
                </div>

                <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                  <span>{activePost.likes} lượt thích</span>
                  <span>•</span>
                  <span>{comments.length} bình luận</span>
                </div>
              </div>

              <div className="border-b border-slate-100 px-5 py-3">
                <button
                  onClick={() => onToggleLike(activePost.id)}
                  className={`cursor-pointer rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    liked
                      ? "bg-rose-500 text-white shadow-sm"
                      : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {liked ? "Đã thích bài" : "Thích bài"}
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-hidden">
                <div ref={contentRef} className="h-full overflow-y-auto px-5 py-4">
                  {comments.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
                      Chưa có bình luận. Hãy là người đầu tiên bình luận.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {rootComments.map((c, idx) => {
                        const replies = repliesMap[c.id] || [];
                        return (
                          <div
                            key={`${c.id}-${idx}`}
                            className="rounded-2xl bg-slate-50/85 p-3 transition-colors hover:bg-slate-100/70"
                          >
                            <div className="flex gap-3">
                              {c.authorAvatar ? (
                                <Image
                                  src={c.authorAvatar}
                                  alt={c.authorName}
                                  width={38}
                                  height={38}
                                  className="h-9 w-9 rounded-full object-cover"
                                />
                              ) : (
                                <div className="h-9 w-9 rounded-full bg-slate-200" />
                              )}

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="truncate text-sm font-semibold text-slate-900">{c.authorName}</p>
                                  <p className="text-[11px] text-slate-400">{c.createdAt ?? "Vua xong"}</p>
                                </div>

                                <p className="mt-1 break-words text-sm text-slate-700">{c.text}</p>
                                <div className="mt-2 flex items-center gap-4">
                                  <button
                                    type="button"
                                    onClick={() => void onToggleCommentLike(activePost.id, c.id)}
                                    className={`cursor-pointer text-xs font-semibold ${
                                      c.likedByMe ? "text-rose-600" : "text-slate-500 hover:text-slate-700"
                                    }`}
                                  >
                                    {c.likedByMe ? "Đã thích" : "Thích"} ({c.likeCount})
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setOpenReplyFor((prev) => (prev === c.id ? null : c.id))
                                    }
                                    className="cursor-pointer text-xs font-semibold text-slate-500 hover:text-slate-700"
                                  >
                                    Trả lời
                                  </button>
                                </div>

                                {openReplyFor === c.id ? (
                                  <div className="mt-2 flex items-center gap-2 rounded-xl bg-white p-2 shadow-sm">
                                    <input
                                      value={replyDraft[c.id] ?? ""}
                                      onChange={(e) =>
                                        setReplyDraft((prev) => ({ ...prev, [c.id]: e.target.value }))
                                      }
                                      placeholder="Viết phản hồi..."
                                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-rose-100"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const value = (replyDraft[c.id] ?? "").trim();
                                        if (!value) return;
                                        void onAddReply(activePost.id, c.id, value);
                                        setReplyDraft((prev) => ({ ...prev, [c.id]: "" }));
                                      }}
                                      className="cursor-pointer rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                                    >
                                      Gửi
                                    </button>
                                  </div>
                                ) : null}

                                {replies.length > 0 ? (
                                  <div className="mt-3 space-y-2 border-l-2 border-slate-200/70 pl-3">
                                    {replies.map((r) => (
                                      <div key={r.id} className="rounded-xl bg-slate-50 px-3 py-2">
                                        <div className="flex items-center justify-between gap-2">
                                          <p className="text-xs font-semibold text-slate-800">{r.authorName}</p>
                                          <p className="text-[10px] text-slate-400">{r.createdAt}</p>
                                        </div>
                                        <p className="text-sm text-slate-700">{r.text}</p>
                                        <button
                                          type="button"
                                          onClick={() => void onToggleCommentLike(activePost.id, r.id)}
                                          className={`mt-1 cursor-pointer text-[11px] font-semibold ${
                                            r.likedByMe ? "text-rose-600" : "text-slate-500 hover:text-slate-700"
                                          }`}
                                        >
                                          {r.likedByMe ? "Đã thích" : "Thích"} ({r.likeCount})
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-100 bg-white px-5 py-4">
                <div className="flex items-center gap-3">
                  {activePost.authorAvatar ? (
                    <Image
                      src={activePost.authorAvatar}
                      alt="me"
                      width={36}
                      height={36}
                      className="h-9 w-9 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-9 w-9 rounded-full bg-slate-200" />
                  )}

                  <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Viết bình luận..."
                    className="flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-rose-100"
                  />

                  <button
                    type="button"
                    onClick={submitComment}
                    className="cursor-pointer rounded-full bg-gradient-to-r from-rose-500 to-pink-500 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:from-rose-600 hover:to-pink-600"
                  >
                    Gửi
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}