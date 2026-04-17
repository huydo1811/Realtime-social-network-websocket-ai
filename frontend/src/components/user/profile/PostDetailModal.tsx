"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { FeedPost } from "./types";

type CommentReply = {
  id: string;
  authorName: string;
  authorAvatar?: string;
  text: string;
  createdAt?: string;
};

type CommentItem = {
  id: string;
  authorName: string;
  authorAvatar?: string;
  text: string;
  createdAt?: string;
  likes?: number;
  replies?: CommentReply[];
};

type Props = {
  post: FeedPost | null;
  liked: boolean;
  comments: CommentItem[];
  onClose: () => void;
  onToggleLike: (postId: string) => void;
  onAddComment: (postId: string, text: string) => void;
};

export default function PostDetailModal({
  post,
  liked,
  comments,
  onClose,
  onToggleLike,
  onAddComment,
}: Props) {
  const [text, setText] = useState("");
  const [likedCommentMap, setLikedCommentMap] = useState<Record<string, boolean>>({});
  const [commentLikeDeltaMap, setCommentLikeDeltaMap] = useState<Record<string, number>>({});
  const [openReplyFor, setOpenReplyFor] = useState<string | null>(null);
  const [replyDraftMap, setReplyDraftMap] = useState<Record<string, string>>({});
  const [replyAdditionsMap, setReplyAdditionsMap] = useState<Record<string, CommentReply[]>>({});
  const contentRef = useRef<HTMLDivElement | null>(null);

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

  function makeKey(commentId: string) {
    return `${activePost.id}:${commentId}`;
  }

  function getReplies(comment: CommentItem) {
    const k = makeKey(comment.id);
    return [...(comment.replies ?? []), ...(replyAdditionsMap[k] ?? [])];
  }

  function getCommentLikeCount(comment: CommentItem) {
    const k = makeKey(comment.id);
    return Math.max(0, (comment.likes ?? 0) + (commentLikeDeltaMap[k] ?? 0));
  }

  const totalReplies = comments.reduce((sum, c) => sum + getReplies(c).length, 0);

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

  function toggleCommentLike(commentId: string) {
    const k = makeKey(commentId);
    const isLiked = Boolean(likedCommentMap[k]);
    setLikedCommentMap((prev) => ({ ...prev, [k]: !isLiked }));
    setCommentLikeDeltaMap((prev) => ({
      ...prev,
      [k]: (prev[k] ?? 0) + (isLiked ? -1 : 1),
    }));
  }

  function submitReply(comment: CommentItem) {
    const k = makeKey(comment.id);
    const value = (replyDraftMap[k] || "").trim();
    if (!value) return;

    const reply: CommentReply = {
      id: `reply-${Date.now()}-${comment.id}`,
      authorName: "Bạn",
      authorAvatar: activePost.authorAvatar,
      text: value,
      createdAt: "Vừa xong",
    };

    setReplyAdditionsMap((prev) => ({
      ...prev,
      [k]: [...(prev[k] || []), reply],
    }));
    setReplyDraftMap((prev) => ({ ...prev, [k]: "" }));
    setOpenReplyFor(null);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[radial-gradient(1200px_500px_at_15%_10%,rgba(244,63,94,0.18),transparent_45%),radial-gradient(900px_500px_at_85%_0%,rgba(59,130,246,0.14),transparent_40%),rgba(2,6,23,0.66)] p-2 backdrop-blur-sm md:p-6"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full ${hasMedia ? "max-w-7xl" : "max-w-4xl"} px-1 sm:px-2`}
      >
        <div className="rounded-[30px] bg-gradient-to-br from-white/70 via-white/30 to-slate-200/20 p-[1px] shadow-[0_28px_90px_rgba(15,23,42,0.45)]">
          <div className="overflow-hidden rounded-[29px] bg-white/95 backdrop-blur-xl">
            {hasMedia && (
              <div className="relative min-h-[360px] bg-slate-100 lg:min-h-[84vh]">
                <Image
                  src={activePost.mediaUrl as string}
                  alt="post media"
                  fill
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  className="object-cover"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/45 via-transparent to-transparent" />
              </div>
            )}

            <div className="flex max-h-[84vh] flex-col bg-gradient-to-b from-white via-slate-50/55 to-white">
              <div className="border-b border-slate-200/80 px-5 py-4">
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

                <div className="mt-3 rounded-2xl border border-slate-200/70 bg-white px-4 py-3 shadow-sm">
                  <p className="text-sm leading-6 text-slate-800">{activePost.content}</p>
                </div>

                <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                  <span>{activePost.likes} lượt thích</span>
                  <span>•</span>
                  <span>{comments.length} bình luận</span>
                  <span>•</span>
                  <span>{totalReplies} trả lời</span>
                </div>
              </div>

              <div className="border-b border-slate-200/80 px-5 py-3">
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
                      {comments.map((c, idx) => {
                        const k = makeKey(c.id);
                        const replies = getReplies(c);
                        const isReplyOpen = openReplyFor === c.id;

                        return (
                          <div
                            key={`${k}-${idx}`}
                            className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition hover:-translate-y-[1px] hover:shadow-md"
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

                                <div className="mt-2 flex items-center gap-5">
                                  <button
                                    onClick={() => toggleCommentLike(c.id)}
                                    className={`cursor-pointer text-xs font-medium ${
                                      likedCommentMap[k] ? "text-rose-600" : "text-slate-500 hover:text-slate-700"
                                    }`}
                                  >
                                    {likedCommentMap[k] ? "Đã thích" : "Thích"} ({getCommentLikeCount(c)})
                                  </button>

                                  <button
                                    onClick={() => setOpenReplyFor((prev) => (prev === c.id ? null : c.id))}
                                    className="cursor-pointer text-xs font-medium text-slate-500 hover:text-slate-700"
                                  >
                                    Trả lời
                                  </button>
                                </div>

                                {isReplyOpen && (
                                  <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-2">
                                    <div className="flex gap-2">
                                      <input
                                        value={replyDraftMap[k] || ""}
                                        onChange={(e) =>
                                          setReplyDraftMap((prev) => ({ ...prev, [k]: e.target.value }))
                                        }
                                        placeholder={`Trả lời ${c.authorName}...`}
                                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-rose-100"
                                      />
                                      <button
                                        onClick={() => submitReply(c)}
                                        className="cursor-pointer rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                                      >
                                        Gửi
                                      </button>
                                    </div>
                                  </div>
                                )}

                                {replies.length > 0 && (
                                  <div className="mt-3 space-y-2 border-l-2 border-slate-100 pl-3">
                                    {replies.map((r, rIdx) => (
                                      <div key={`${r.id}-${rIdx}`} className="rounded-xl bg-slate-50 p-2.5">
                                        <div className="flex items-center justify-between gap-2">
                                          <p className="text-xs font-semibold text-slate-800">{r.authorName}</p>
                                          <p className="text-[10px] text-slate-400">{r.createdAt ?? "Vua xong"}</p>
                                        </div>
                                        <p className="mt-1 text-xs text-slate-700">{r.text}</p>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-200/80 bg-white px-5 py-4">
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