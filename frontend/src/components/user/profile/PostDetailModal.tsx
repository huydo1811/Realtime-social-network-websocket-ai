"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import PostMediaDisplay from "./PostMediaDisplay";
import { FeedPost } from "./types";

type CommentItem = {
  id: string;
  authorId?: number;
  authorName: string;
  authorAvatar?: string;
  text: string;
  createdAt?: string;
  createdAtTs?: number;
  parentCommentId?: string;
  likeCount: number;
  likedByMe: boolean;
};

type Props = {
  post: FeedPost | null;
  actorId?: number | null;
  liked: boolean;
  comments: CommentItem[];
  onOpenAuthorProfile?: (authorId?: number) => void;
  onReportPost?: (postId: string) => void;
  onReportComment?: (postId: string, commentId: string) => void;
  onClose: () => void;
  onToggleLike: (postId: string) => void;
  onAddComment: (postId: string, text: string) => Promise<void> | void;
  onToggleCommentLike: (postId: string, commentId: string) => Promise<void> | void;
  onAddReply: (postId: string, parentCommentId: string, text: string) => Promise<void> | void;
};

export default function PostDetailModal({
  post,
  actorId,
  liked,
  comments,
  onOpenAuthorProfile,
  onReportPost,
  onReportComment,
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
  const [sortMode, setSortMode] = useState<"newest" | "top">("newest");
  const [showAll, setShowAll] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const VISIBLE_LIMIT = 4;

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
  const canReportPost = Boolean(
    onReportPost &&
      (actorId == null || activePost.authorId == null || activePost.authorId !== actorId)
  );
  const repliesMap = comments.reduce<Record<string, CommentItem[]>>((acc, c) => {
    if (!c.parentCommentId) return acc;
    if (!acc[c.parentCommentId]) acc[c.parentCommentId] = [];
    acc[c.parentCommentId].push(c);
    return acc;
  }, {});

  const sortedRootComments = [...rootComments].sort((a, b) => {
    if (sortMode === "top") {
      if (b.likeCount !== a.likeCount) return b.likeCount - a.likeCount;
    }
    const aTime = Number.isFinite(a.createdAtTs) ? Number(a.createdAtTs) : (a.createdAt ? Date.parse(a.createdAt) : 0);
    const bTime = Number.isFinite(b.createdAtTs) ? Number(b.createdAtTs) : (b.createdAt ? Date.parse(b.createdAt) : 0);
    return bTime - aTime;
  });
  const sortedRepliesMap: Record<string, CommentItem[]> = {};
  Object.entries(repliesMap).forEach(([pid, list]) => {
    sortedRepliesMap[pid] = [...list].sort((a, b) => {
      if (sortMode === "top") {
        if (b.likeCount !== a.likeCount) return b.likeCount - a.likeCount;
      }
      const aTime = Number.isFinite(a.createdAtTs) ? Number(a.createdAtTs) : (a.createdAt ? Date.parse(a.createdAt) : 0);
      const bTime = Number.isFinite(b.createdAtTs) ? Number(b.createdAtTs) : (b.createdAt ? Date.parse(b.createdAt) : 0);
      return bTime - aTime;
    });
  });
  const visibleRootComments = showAll
    ? sortedRootComments
    : sortedRootComments.slice(0, VISIBLE_LIMIT);
  const hiddenCount = sortedRootComments.length - visibleRootComments.length;

  async function submitComment() {
    const value = text.trim();
    if (!value) return;
    try {
      setNotice(null);
      await onAddComment(activePost.id, value);
      setText("");
      setTimeout(() => {
        contentRef.current?.scrollTo({
          top: contentRef.current.scrollHeight,
          behavior: "smooth",
        });
      }, 120);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Không thể gửi bình luận";
      setNotice(message);
    }
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

            <div className="flex h-[85vh] max-h-[90vh] min-h-0 flex-col bg-white">
              <div className="border-b border-slate-100 px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => onOpenAuthorProfile?.(activePost.authorId)}
                      className="cursor-pointer"
                    >
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
                    </button>

                    <div>
                      <button
                        type="button"
                        onClick={() => onOpenAuthorProfile?.(activePost.authorId)}
                        className="cursor-pointer text-sm font-semibold text-slate-900 hover:underline"
                      >
                        {activePost.authorName ?? "Người dùng"}
                      </button>
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
                  {canReportPost ? (
                    <>
                      <span>•</span>
                      <button
                        type="button"
                        onClick={() => onReportPost?.(activePost.id)}
                        className="cursor-pointer font-semibold text-amber-700 hover:underline"
                      >
                        Báo cáo bài viết
                      </button>
                    </>
                  ) : null}
                </div>
              </div>

              <div className="border-b border-slate-100 px-5 py-3">
                <div className="flex items-center justify-between gap-3">
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

                  <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 p-0.5">
                    <button
                      type="button"
                      onClick={() => setSortMode("newest")}
                      className={`cursor-pointer rounded-full px-3 py-1 text-[11px] font-semibold transition ${
                        sortMode === "newest"
                          ? "bg-white text-slate-900 shadow-sm"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      Mới nhất
                    </button>
                    <button
                      type="button"
                      onClick={() => setSortMode("top")}
                      className={`cursor-pointer rounded-full px-3 py-1 text-[11px] font-semibold transition ${
                        sortMode === "top"
                          ? "bg-white text-slate-900 shadow-sm"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      Nhiều like
                    </button>
                  </div>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-hidden">
                <div ref={contentRef} className="h-full overflow-y-auto overscroll-contain px-5 py-4">
                  {comments.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
                      Chưa có bình luận. Hãy là người đầu tiên bình luận.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {visibleRootComments.map((c, idx) => {
                        const replies = sortedRepliesMap[c.id] || [];
                        return (
                          <div
                            key={`${c.id}-${idx}`}
                            className="rounded-2xl bg-slate-50/85 p-3 transition-colors hover:bg-slate-100/70"
                          >
                            <div className="flex gap-3">
                              <button
                                type="button"
                                onClick={() => onOpenAuthorProfile?.(c.authorId)}
                                className="cursor-pointer"
                              >
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
                              </button>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  <button
                                    type="button"
                                    onClick={() => onOpenAuthorProfile?.(c.authorId)}
                                    className="cursor-pointer truncate text-sm font-semibold text-slate-900 hover:underline"
                                  >
                                    {c.authorName}
                                  </button>
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
                                  {onReportComment ? (
                                    <button
                                      type="button"
                                      disabled={actorId != null && c.authorId != null && c.authorId === actorId}
                                      onClick={() => onReportComment(activePost.id, c.id)}
                                      className="cursor-pointer text-xs font-semibold text-amber-700 hover:underline disabled:cursor-not-allowed disabled:text-slate-400 disabled:no-underline"
                                      title={actorId != null && c.authorId != null && c.authorId === actorId ? "Không thể báo cáo bình luận của chính bạn" : "Báo cáo bình luận"}
                                    >
                                      Báo cáo
                                    </button>
                                  ) : null}
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
                                      onClick={async () => {
                                        const value = (replyDraft[c.id] ?? "").trim();
                                        if (!value) return;
                                        try {
                                          setNotice(null);
                                          await onAddReply(activePost.id, c.id, value);
                                          setReplyDraft((prev) => ({ ...prev, [c.id]: "" }));
                                        } catch (err) {
                                          const message =
                                            err instanceof Error
                                              ? err.message
                                              : "Không thể gửi phản hồi";
                                          setNotice(message);
                                        }
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
                                          <button
                                            type="button"
                                            onClick={() => onOpenAuthorProfile?.(r.authorId)}
                                            className="cursor-pointer text-xs font-semibold text-slate-800 hover:underline"
                                          >
                                            {r.authorName}
                                          </button>
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
                                        {onReportComment ? (
                                          <button
                                            type="button"
                                            disabled={actorId != null && r.authorId != null && r.authorId === actorId}
                                            onClick={() => onReportComment(activePost.id, r.id)}
                                            className="ml-3 cursor-pointer text-[11px] font-semibold text-amber-700 hover:underline disabled:cursor-not-allowed disabled:text-slate-400 disabled:no-underline"
                                            title={actorId != null && r.authorId != null && r.authorId === actorId ? "Không thể báo cáo bình luận của chính bạn" : "Báo cáo bình luận"}
                                          >
                                            Báo cáo
                                          </button>
                                        ) : null}
                                      </div>
                                    ))}
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {hiddenCount > 0 ? (
                        <button
                          type="button"
                          onClick={() => setShowAll(true)}
                          className="cursor-pointer w-full rounded-full border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Xem thêm {hiddenCount} bình luận
                        </button>
                      ) : null}
                      {showAll && sortedRootComments.length > VISIBLE_LIMIT ? (
                        <button
                          type="button"
                          onClick={() => {
                            setShowAll(false);
                            contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                          className="cursor-pointer w-full rounded-full border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50"
                        >
                          Thu gọn
                        </button>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-100 bg-white px-5 py-4">
                {notice ? (
                  <div className="mb-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    {notice}
                  </div>
                ) : null}
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
                    onClick={() => void submitComment()}
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