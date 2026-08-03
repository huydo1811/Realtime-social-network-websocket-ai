"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import PostMediaDisplay from "./PostMediaDisplay";
import PostLikersModal from "./PostLikersModal";
import { FeedPost } from "./types";

type Props = {
  post: FeedPost;
  liked: boolean;
  onToggleLike: (postId: string) => void;
  onOpen: (postId: string) => void;
  onOpenAuthorProfile?: (authorId?: number) => void;
  onOpenPetProfile?: (petId?: number) => void;
  onOpenGroup?: (groupId: number) => void;
  onReportPost?: (postId: string) => void;
  canManage?: boolean;
  canAdminHide?: boolean;
  onEdit?: (postId: string) => void;
  onDelete?: (postId: string) => void;
  onAdminHide?: (postId: string) => void;
  onShare?: (postId: string) => void;
  actionBusy?: boolean;
};

export default function PostCard({
  post,
  liked,
  onToggleLike,
  onOpen,
  onOpenAuthorProfile,
  onOpenPetProfile,
  onOpenGroup,
  onReportPost,
  canManage = false,
  canAdminHide = false,
  onEdit,
  onDelete,
  onAdminHide,
  onShare,
  actionBusy = false,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [likersOpen, setLikersOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const numericPostId =
    post.postId ??
    (post.source === "GROUP_POST" ? null : Number(post.id));
  const groupPostId =
    post.source === "GROUP_POST"
      ? Number(String(post.id).replace(/^group-/, ""))
      : null;
  const canOpenLikers =
    (numericPostId != null && Number.isFinite(numericPostId)) ||
    (post.source === "GROUP_POST" &&
      post.groupId != null &&
      groupPostId != null &&
      Number.isFinite(groupPostId));

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", onDocClick);
    }
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [menuOpen]);

  const canShowMenu = canManage || canAdminHide || Boolean(onReportPost);

  const visibilityMeta =
    post.visibility === "PUBLIC"
      ? {
          label: "Công khai",
          icon: (
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.6 9h16.8M3.6 15h16.8M12 3a15.3 15.3 0 010 18m0-18a15.3 15.3 0 000 18" />
            </svg>
          ),
        }
      : post.visibility === "FRIENDS"
        ? {
            label: "Bạn bè",
            icon: (
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.36-1.86M17 20H7m10 0v-2a5 5 0 00-10 0v2M7 20H2v-2a3 3 0 015.36-1.86M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            ),
          }
        : {
            label: "Riêng tư",
            icon: (
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 11V7a4 4 0 10-8 0v4m16 0H4v8h16v-8z" />
              </svg>
            ),
          };

  return (
    <article
      onClick={() => onOpen(post.id)}
      onKeyDown={(e) => { if (e.key === "Enter") onOpen(post.id); }}
      role="button"
      tabIndex={0}
      className="cursor-pointer overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm transition hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3 px-4 pt-4">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenAuthorProfile?.(post.authorId);
            }}
            className="cursor-pointer"
          >
            {post.authorAvatar ? (
              <Image
                src={post.authorAvatar}
                alt={post.authorName ?? "avatar"}
                width={42}
                height={42}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 text-sm font-bold text-rose-600">
                {(post.authorName?.[0] ?? "U").toUpperCase()}
              </div>
            )}
          </button>
          <div className="min-w-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenAuthorProfile?.(post.authorId);
              }}
              className="cursor-pointer truncate text-sm font-semibold text-slate-900 hover:underline"
            >
              {post.authorName ?? "Người dùng"}
            </button>
            {post.petId && post.petName ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenPetProfile?.(post.petId);
                }}
                className="mt-0.5 flex cursor-pointer items-center gap-1.5 text-xs font-medium text-rose-600 hover:underline"
              >
                {post.petAvatar ? (
                  <Image
                    src={post.petAvatar}
                    alt={post.petName}
                    width={16}
                    height={16}
                    className="h-4 w-4 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-rose-100 text-[10px] font-bold">
                    {post.petName[0]?.toUpperCase() ?? "P"}
                  </span>
                )}
                <span>{post.petName}</span>
              </button>
            ) : null}
            {post.source === "GROUP_POST" && post.groupId ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenGroup?.(post.groupId!);
                }}
                className="mt-0.5 flex cursor-pointer items-center gap-1.5 text-xs font-medium text-sky-600 hover:underline"
              >
                {post.groupAvatar ? (
                  <Image
                    src={post.groupAvatar}
                    alt={post.groupName || "Nhóm"}
                    width={16}
                    height={16}
                    className="h-4 w-4 rounded-full object-cover"
                    unoptimized
                  />
                ) : (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-sky-100 text-[10px] font-bold text-sky-700">
                    {(post.groupName?.[0] || "G").toUpperCase()}
                  </span>
                )}
                <span>{post.groupName || `Nhóm #${post.groupId}`}</span>
              </button>
            ) : null}
            <p className="text-xs text-slate-500">{post.createdAt}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {post.visibility ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">
              {visibilityMeta.icon}
              {visibilityMeta.label}
            </span>
          ) : null}
          {canShowMenu ? (
            <div
              ref={menuRef}
              className="relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                className="cursor-pointer rounded-full p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Tùy chọn bài viết"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 12a2 2 0 110-4 2 2 0 010 4zm6 0a2 2 0 110-4 2 2 0 010 4zm6 0a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>
              {menuOpen ? (
                <div className="absolute right-0 z-10 mt-1 w-40 rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
                  {canManage && onEdit ? (
                    <button
                      type="button"
                      disabled={actionBusy}
                      onClick={() => {
                        onEdit(post.id);
                        setMenuOpen(false);
                      }}
                      className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 4h2m-1 0v16m-7-9h14" />
                      </svg>
                      Sửa bài viết
                    </button>
                  ) : null}
                  {canManage && onDelete ? (
                    <button
                      type="button"
                      disabled={actionBusy}
                      onClick={() => {
                        onDelete(post.id);
                        setMenuOpen(false);
                      }}
                      className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12M9 7V5h6v2m-7 0v12m4-12v12m4-12v12" />
                      </svg>
                      Xóa bài viết
                    </button>
                  ) : null}
                  {canAdminHide && onAdminHide ? (
                    <button
                      type="button"
                      disabled={actionBusy}
                      onClick={() => {
                        onAdminHide(post.id);
                        setMenuOpen(false);
                      }}
                      className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-amber-700 hover:bg-amber-50 disabled:opacity-50"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-3.5 0-6.5-1.5-9-4 2.5-2.5 5.5-4 9-4 3.5 0 6.5 1.5 9 4-.6.6-1.2 1.15-1.85 1.64M9.88 9.88a3 3 0 104.24 4.24M3 3l18 18" />
                      </svg>
                      Ẩn bài (Admin)
                    </button>
                  ) : null}
                  {onReportPost ? (
                    <button
                      type="button"
                      disabled={actionBusy}
                      onClick={() => {
                        onReportPost(post.id);
                        setMenuOpen(false);
                      }}
                      className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-orange-700 hover:bg-orange-50 disabled:opacity-50"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      Báo cáo bài viết
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <div className="px-4 pb-3 pt-3">
        <p className="text-[15px] leading-6 text-slate-800">{post.content}</p>
      </div>

      {post.sharedPost ? (
        <div
          className="mx-4 mb-3 rounded-2xl border border-slate-200 bg-white p-3"
          onClick={(e) => {
            e.stopPropagation();
            onOpen(post.sharedPost!.id);
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onOpen(post.sharedPost!.id);
            }
          }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Bài viết gốc được chia sẻ
          </p>
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenAuthorProfile?.(post.sharedPost?.authorId);
              }}
              className="cursor-pointer"
            >
              {post.sharedPost.authorAvatar ? (
                <Image
                  src={post.sharedPost.authorAvatar}
                  alt={post.sharedPost.authorName ?? "avatar"}
                  width={30}
                  height={30}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 text-xs font-bold text-rose-600">
                  {(post.sharedPost.authorName?.[0] ?? "U").toUpperCase()}
                </div>
              )}
            </button>
            <div className="min-w-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenAuthorProfile?.(post.sharedPost?.authorId);
                }}
                className="cursor-pointer truncate text-sm font-semibold text-slate-900 hover:underline"
              >
                {post.sharedPost.authorName ?? "Người dùng"}
              </button>
              <p className="text-xs text-slate-500">{post.sharedPost.createdAt}</p>
            </div>
          </div>
          <p className="mt-2 text-sm text-slate-700">{post.sharedPost.content}</p>
          {post.sharedPost.mediaUrl ? (
            <div className="mt-2 overflow-hidden rounded-xl border border-slate-200">
              <PostMediaDisplay
                mediaUrl={post.sharedPost.mediaUrl}
                alt="shared post media"
                variant="embed"
              />
            </div>
          ) : null}
          <div className="mt-2 text-xs text-slate-500">
            <span>{post.sharedPost.likes} lượt thích</span>
            <span className="mx-1.5">•</span>
            <span>{post.sharedPost.comments} bình luận</span>
            <span className="mx-1.5">•</span>
            <span>{post.sharedPost.shares} chia sẻ</span>
          </div>
        </div>
      ) : null}

      {post.mediaUrl ? (
        <div className="mb-3 w-full overflow-hidden border-y border-slate-200">
          <PostMediaDisplay mediaUrl={post.mediaUrl} alt="post media" variant="feed" />
        </div>
      ) : null}

      <div className="px-4 pb-2 text-xs text-slate-500">
        {canOpenLikers && post.likes > 0 ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setLikersOpen(true);
            }}
            className="font-medium text-slate-600 hover:text-rose-600 hover:underline"
          >
            {post.likes} lượt thích
          </button>
        ) : (
          <span>{post.likes} lượt thích</span>
        )}
        <span className="mx-1.5">•</span>
        <span>{post.comments} bình luận</span>
        <span className="mx-1.5">•</span>
        <span>{post.shares ?? 0} chia sẻ</span>
      </div>

      <div className="grid grid-cols-3 gap-2 border-t border-slate-100 px-3 py-2 text-xs">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onToggleLike(post.id); }}
          className={`inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl px-3 py-2 font-semibold ${
            liked ? "bg-rose-500 text-white" : "text-slate-700 hover:bg-slate-100"
          }`}
        >
          <svg className="h-4 w-4" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.32 6.32a4.5 4.5 0 000 6.36L12 20.36l7.68-7.68a4.5 4.5 0 00-6.36-6.36L12 7.64l-1.32-1.32a4.5 4.5 0 00-6.36 0z" />
          </svg>
          {liked ? "Đã thích" : "Thích"}
        </button>

        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onOpen(post.id); }}
          className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl px-3 py-2 font-semibold text-slate-700 hover:bg-slate-100"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.42-4.03 8-9 8a9.86 9.86 0 01-4.25-.95L3 20l1.39-3.72A7.9 7.9 0 013 12c0-4.42 4.03-8 9-8s9 3.58 9 8z" />
          </svg>
          Bình luận
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onShare?.(post.id);
          }}
          className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl px-3 py-2 font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!onShare}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.7 11.1l6.6-3.3m-6.6 5.1l6.6 3.3M6 12a2.25 2.25 0 110-4.5A2.25 2.25 0 016 12zm12-6a2.25 2.25 0 110-4.5A2.25 2.25 0 0118 6zm0 16a2.25 2.25 0 110-4.5A2.25 2.25 0 0118 22z" />
          </svg>
          Chia sẻ
        </button>
      </div>

      <PostLikersModal
        postId={post.source === "GROUP_POST" ? null : numericPostId}
        groupId={post.source === "GROUP_POST" ? post.groupId ?? null : null}
        groupPostId={post.source === "GROUP_POST" ? groupPostId : null}
        open={likersOpen}
        onClose={() => setLikersOpen(false)}
      />
    </article>
  );
}