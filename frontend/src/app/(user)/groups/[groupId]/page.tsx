"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import MediaPreview from "@/components/common/MediaPreview";
import UserLayout from "@/components/layout/UserLayout";
import PostMediaDisplay from "@/components/user/profile/PostMediaDisplay";
import { uploadToCloudinary } from "@/lib/cloudinary/upload";
import {
  approveGroupPost,
  createGroupPost,
  createGroupPostComment,
  getGroup,
  joinGroup,
  listGroupMembers,
  listGroupPostComments,
  listGroupPosts,
  listMyGroupMemberships,
  rejectGroupPost,
  toggleGroupPostLike,
} from "@/lib/api/friendshipApi";
import type {
  GroupMembershipResponse,
  GroupPostCommentResponse,
  GroupPostResponse,
  GroupResponse,
} from "@/types/friendship";

function formatDate(iso?: string | null) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("vi-VN");
}

function AuthorAvatar({ name, url }: { name: string; url?: string | null }) {
  if (url) {
    return (
      <Image
        src={url}
        alt={name}
        width={40}
        height={40}
        className="h-10 w-10 rounded-full object-cover"
        unoptimized
      />
    );
  }
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 text-sm font-bold text-sky-700">
      {name[0]?.toUpperCase() || "U"}
    </div>
  );
}

export default function GroupDetailPage() {
  const params = useParams<{ groupId: string }>();
  const groupId = Number(params.groupId);
  const [group, setGroup] = useState<GroupResponse | null>(null);
  const [myMemberships, setMyMemberships] = useState<GroupMembershipResponse[]>([]);
  const [members, setMembers] = useState<GroupMembershipResponse[]>([]);
  const [posts, setPosts] = useState<GroupPostResponse[]>([]);
  const [pendingPosts, setPendingPosts] = useState<GroupPostResponse[]>([]);
  const [commentsByPostId, setCommentsByPostId] = useState<Record<number, GroupPostCommentResponse[]>>({});
  const [commentDraftByPostId, setCommentDraftByPostId] = useState<Record<number, string>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [composerText, setComposerText] = useState("");
  const [composerMediaUrl, setComposerMediaUrl] = useState<string | undefined>(undefined);
  const [composerMediaName, setComposerMediaName] = useState("");
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"posts" | "members">("posts");

  const myMembership = useMemo(() => myMemberships.find((row) => row.groupId === groupId), [myMemberships, groupId]);
  const isOwner = myMembership?.role === "OWNER" && myMembership?.status === "APPROVED";
  const canPost = myMembership?.status === "APPROVED";

  function profileHref(userId: number) {
    return `/profile/${userId}`;
  }

  function displayName(fullName?: string | null, userId?: number) {
    if (fullName?.trim()) return fullName.trim();
    return userId != null ? `Người dùng #${userId}` : "Người dùng";
  }

  const loadCommentsForPosts = useCallback(async (postRows: GroupPostResponse[]) => {
    const entries = await Promise.all(
      postRows.map(async (post) => {
        try {
          const comments = await listGroupPostComments(groupId, post.id);
          return [post.id, comments] as const;
        } catch {
          return [post.id, [] as GroupPostCommentResponse[]] as const;
        }
      })
    );
    setCommentsByPostId(Object.fromEntries(entries));
  }, [groupId]);

  const load = useCallback(async () => {
    if (!Number.isFinite(groupId) || groupId <= 0) return;
    setLoading(true);
    try {
      const [groupRow, mineRows, memberRows, approvedPosts] = await Promise.all([
        getGroup(groupId),
        listMyGroupMemberships(),
        listGroupMembers(groupId, "APPROVED").catch(() => [] as GroupMembershipResponse[]),
        listGroupPosts(groupId, "APPROVED"),
      ]);
      setGroup(groupRow);
      setMyMemberships(mineRows);
      setMembers(memberRows);
      setPosts(approvedPosts);
      void loadCommentsForPosts(approvedPosts);
      const mine = mineRows.find((row) => row.groupId === groupId);
      const canModerate = mine?.role === "OWNER" && mine?.status === "APPROVED";
      if (canModerate) {
        const pendingRows = await listGroupPosts(groupId, "PENDING").catch(() => [] as GroupPostResponse[]);
        setPendingPosts(pendingRows);
      } else {
        setPendingPosts([]);
      }
    } finally {
      setLoading(false);
    }
  }, [groupId, loadCommentsForPosts]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleJoin() {
    setBusyKey("join");
    setNotice(null);
    try {
      const row = await joinGroup(groupId);
      setNotice(row.status === "APPROVED" ? "Bạn đã tham gia nhóm." : "Đã gửi yêu cầu tham gia nhóm.");
      await load();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Không thể tham gia nhóm");
    } finally {
      setBusyKey(null);
    }
  }

  async function handleCreatePost() {
    const content = composerText.trim();
    if (!content && !composerMediaUrl?.trim()) return;
    setBusyKey("create-post");
    setNotice(null);
    try {
      const created = await createGroupPost(groupId, {
        content,
        mediaUrl: composerMediaUrl,
      });
      setComposerText("");
      setComposerMediaUrl(undefined);
      setComposerMediaName("");
      if (created.status === "PENDING") {
        setNotice("Bài viết đã gửi, đang chờ trưởng nhóm duyệt.");
      } else {
        setNotice("Đăng bài trong nhóm thành công.");
        setPosts((prev) => [created, ...prev]);
        setCommentsByPostId((prev) => ({ ...prev, [created.id]: [] }));
      }
      await load();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Không thể đăng bài");
    } finally {
      setBusyKey(null);
    }
  }

  async function handlePickMedia(file?: File) {
    if (!file) return;
    setUploadingMedia(true);
    setNotice(null);
    try {
      const uploaded = await uploadToCloudinary(file);
      setComposerMediaUrl(uploaded.secureUrl);
      setComposerMediaName(file.name);
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Không thể tải ảnh/video lên Cloudinary");
      setComposerMediaUrl(undefined);
      setComposerMediaName("");
    } finally {
      setUploadingMedia(false);
    }
  }

  async function handleApprovePost(postId: number) {
    setBusyKey(`approve-${postId}`);
    try {
      await approveGroupPost(groupId, postId);
      setNotice("Đã duyệt bài viết.");
      await load();
    } finally {
      setBusyKey(null);
    }
  }

  async function handleRejectPost(postId: number) {
    setBusyKey(`reject-${postId}`);
    try {
      await rejectGroupPost(groupId, postId);
      setNotice("Đã từ chối bài viết.");
      await load();
    } finally {
      setBusyKey(null);
    }
  }

  async function handleToggleLike(post: GroupPostResponse) {
    setBusyKey(`like-${post.id}`);
    setNotice(null);
    try {
      const result = await toggleGroupPostLike(groupId, post.id);
      setPosts((prev) =>
        prev.map((row) =>
          row.id === post.id
            ? { ...row, likedByMe: result.liked, likeCount: result.likeCount }
            : row
        )
      );
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Không thể thích bài viết");
    } finally {
      setBusyKey(null);
    }
  }

  async function handleCreateComment(postId: number) {
    const content = (commentDraftByPostId[postId] ?? "").trim();
    if (!content) return;
    setBusyKey(`comment-${postId}`);
    setNotice(null);
    try {
      const created = await createGroupPostComment(groupId, postId, content);
      setCommentsByPostId((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] ?? []), created],
      }));
      setCommentDraftByPostId((prev) => ({ ...prev, [postId]: "" }));
      setPosts((prev) =>
        prev.map((row) =>
          row.id === postId
            ? { ...row, commentCount: (row.commentCount ?? 0) + 1 }
            : row
        )
      );
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Không thể gửi bình luận");
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <UserLayout>
      <section className="w-full animate-in fade-in slide-in-from-bottom-4 pb-20 pt-2 duration-500">
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs text-slate-500">Nhóm</p>
                <h1 className="text-xl font-bold text-slate-900">{group?.name || "Đang tải..."}</h1>
                <p className="mt-1 text-sm text-slate-600">{group?.description || "Chưa có mô tả."}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {group?.visibility === "PUBLIC" ? "Công khai" : "Riêng tư"}
                  {" · "}
                  {group?.requireApproval ? "Duyệt thành viên" : "Vào nhóm ngay"}
                  {" · "}
                  {group?.requirePostApproval !== false ? "Bài viết cần duyệt" : "Bài viết đăng ngay"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link href="/groups" className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                  Quay lại nhóm
                </Link>
                {!canPost ? (
                  <button
                    type="button"
                    onClick={() => void handleJoin()}
                    disabled={busyKey === "join"}
                    className="rounded-xl bg-sky-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-600 disabled:opacity-60"
                  >
                    {busyKey === "join" ? "Đang xử lý..." : "Tham gia nhóm"}
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          {notice ? <div className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-800">{notice}</div> : null}

          <div className="flex gap-2 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
            <button
              type="button"
              onClick={() => setActiveTab("posts")}
              className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                activeTab === "posts" ? "bg-rose-500 text-white" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              Bài viết
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("members")}
              className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                activeTab === "members" ? "bg-rose-500 text-white" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              Thành viên ({members.length})
            </button>
          </div>

          {activeTab === "posts" ? (
            <>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">Đăng bài trong nhóm</p>
            <textarea
              value={composerText}
              onChange={(e) => setComposerText(e.target.value)}
              rows={4}
              placeholder={canPost ? "Chia sẻ điều gì đó cho thành viên nhóm..." : "Tham gia nhóm để đăng bài"}
              disabled={!canPost}
              className="mt-2 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-sky-400 disabled:bg-slate-50"
            />
            <div className="mt-2 rounded-xl border border-slate-200 px-3 py-2">
              <p className="truncate text-xs text-slate-600">
                {composerMediaName || "Chưa chọn ảnh/video"}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <input
                  id="group-post-media"
                  type="file"
                  accept="image/*,video/*"
                  className="hidden"
                  disabled={!canPost || uploadingMedia}
                  onChange={(e) => void handlePickMedia(e.target.files?.[0])}
                />
                <label
                  htmlFor="group-post-media"
                  className="cursor-pointer rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  {uploadingMedia ? "Đang tải..." : "Chọn ảnh/video"}
                </label>
                {composerMediaUrl ? (
                  <button
                    type="button"
                    onClick={() => {
                      setComposerMediaUrl(undefined);
                      setComposerMediaName("");
                    }}
                    className="rounded-full border border-slate-200 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                  >
                    Gỡ media
                  </button>
                ) : null}
              </div>
            </div>
            {composerMediaUrl ? (
              <div className="mt-2">
                <MediaPreview
                  url={composerMediaUrl}
                  name={composerMediaName}
                  onClear={() => {
                    setComposerMediaUrl(undefined);
                    setComposerMediaName("");
                  }}
                />
              </div>
            ) : null}
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-slate-500">
                {!isOwner && group?.requirePostApproval !== false
                  ? "Bài của thành viên sẽ chờ trưởng nhóm duyệt trước khi hiện trong nhóm."
                  : "Bài viết sẽ hiện ngay trong nhóm."}
              </p>
              <button
                type="button"
                onClick={() => void handleCreatePost()}
                disabled={!canPost || uploadingMedia || busyKey === "create-post" || (!composerText.trim() && !composerMediaUrl?.trim())}
                className="rounded-xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-600 disabled:opacity-60"
              >
                {busyKey === "create-post"
                  ? "Đang gửi..."
                  : !isOwner && group?.requirePostApproval !== false
                    ? "Gửi để duyệt"
                    : "Đăng bài"}
              </button>
            </div>
          </div>

          {isOwner ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
              <p className="text-sm font-semibold text-amber-900">Bài viết chờ duyệt ({pendingPosts.length})</p>
              {pendingPosts.length ? (
                <div className="mt-3 space-y-2">
                  {pendingPosts.map((row) => (
                    <article key={row.id} className="rounded-xl border border-amber-200 bg-white p-3">
                      <div className="flex items-center gap-2">
                        <Link href={profileHref(row.authorUserId)} className="shrink-0">
                          <AuthorAvatar
                            name={displayName(row.authorName, row.authorUserId)}
                            url={row.authorAvatarUrl}
                          />
                        </Link>
                        <Link
                          href={profileHref(row.authorUserId)}
                          className="text-xs font-medium text-slate-700 hover:text-rose-600 hover:underline"
                        >
                          {displayName(row.authorName, row.authorUserId)}
                        </Link>
                        <span className="text-xs text-slate-400">· {formatDate(row.createdAt)}</span>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-slate-800">{row.content}</p>
                      {row.mediaUrl ? (
                        <div className="mt-2 overflow-hidden rounded-xl border border-slate-200">
                          <PostMediaDisplay mediaUrl={row.mediaUrl} variant="embed" />
                        </div>
                      ) : null}
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => void handleApprovePost(row.id)}
                          disabled={busyKey === `approve-${row.id}`}
                          className="rounded-md bg-emerald-500 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-600 disabled:opacity-60"
                        >
                          Duyệt
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleRejectPost(row.id)}
                          disabled={busyKey === `reject-${row.id}`}
                          className="rounded-md bg-rose-500 px-2.5 py-1 text-xs font-semibold text-white hover:bg-rose-600 disabled:opacity-60"
                        >
                          Từ chối
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-sm text-amber-800/80">Chưa có bài nào đang chờ duyệt.</p>
              )}
            </div>
          ) : null}

          <div className="w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">Bài viết trong nhóm</p>
              {loading ? (
                <p className="mt-3 text-sm text-slate-500">Đang tải bài viết...</p>
              ) : posts.length ? (
                <div className="mt-3 space-y-4">
                  {posts.map((row) => {
                    const authorLabel = displayName(row.authorName, row.authorUserId);
                    const comments = commentsByPostId[row.id] ?? [];
                    const liked = Boolean(row.likedByMe);
                    return (
                      <article key={row.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex items-start gap-3">
                          <Link href={profileHref(row.authorUserId)} className="shrink-0">
                            <AuthorAvatar name={authorLabel} url={row.authorAvatarUrl} />
                          </Link>
                          <div className="min-w-0 flex-1">
                            <Link
                              href={profileHref(row.authorUserId)}
                              className="text-sm font-semibold text-slate-900 hover:text-rose-600 hover:underline"
                            >
                              {authorLabel}
                            </Link>
                            <p className="text-xs text-slate-500">{formatDate(row.createdAt)}</p>
                          </div>
                        </div>
                        {row.content ? (
                          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-800">{row.content}</p>
                        ) : null}
                        {row.mediaUrl ? (
                          <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
                            <PostMediaDisplay mediaUrl={row.mediaUrl} variant="embed" />
                          </div>
                        ) : null}
                        <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
                          <button
                            type="button"
                            onClick={() => void handleToggleLike(row)}
                            disabled={busyKey === `like-${row.id}` || !canPost}
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition disabled:opacity-60 ${
                              liked
                                ? "bg-rose-500 text-white"
                                : "border border-slate-200 text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            <svg className="h-3.5 w-3.5" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            {liked ? "Đã thích" : "Thích"} ({row.likeCount ?? 0})
                          </button>
                          <span>{row.commentCount ?? comments.length} bình luận</span>
                        </div>
                        <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                          {comments.length ? (
                            comments.map((comment) => (
                              <div key={comment.id} className="flex items-start gap-2">
                                <Link href={profileHref(comment.userId)} className="shrink-0">
                                  <AuthorAvatar
                                    name={displayName(comment.authorName, comment.userId)}
                                    url={comment.authorAvatarUrl}
                                  />
                                </Link>
                                <div className="min-w-0 flex-1 rounded-xl bg-slate-50 px-3 py-2">
                                  <Link
                                    href={profileHref(comment.userId)}
                                    className="text-xs font-semibold text-slate-800 hover:text-rose-600 hover:underline"
                                  >
                                    {displayName(comment.authorName, comment.userId)}
                                  </Link>
                                  <p className="mt-0.5 whitespace-pre-wrap text-sm text-slate-700">{comment.content}</p>
                                  <p className="mt-1 text-[11px] text-slate-400">{formatDate(comment.createdAt)}</p>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-slate-400">Chưa có bình luận.</p>
                          )}
                          {canPost ? (
                            <div className="flex items-center gap-2 pt-1">
                              <input
                                value={commentDraftByPostId[row.id] ?? ""}
                                onChange={(e) =>
                                  setCommentDraftByPostId((prev) => ({ ...prev, [row.id]: e.target.value }))
                                }
                                placeholder="Viết bình luận..."
                                className="h-9 flex-1 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-sky-400"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    void handleCreateComment(row.id);
                                  }
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => void handleCreateComment(row.id)}
                                disabled={
                                  busyKey === `comment-${row.id}` ||
                                  !(commentDraftByPostId[row.id] ?? "").trim()
                                }
                                className="rounded-xl bg-sky-500 px-3 py-2 text-xs font-semibold text-white hover:bg-sky-600 disabled:opacity-60"
                              >
                                {busyKey === `comment-${row.id}` ? "Đang gửi..." : "Gửi"}
                              </button>
                            </div>
                          ) : null}
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-500">Chưa có bài viết nào trong nhóm.</p>
              )}
          </div>
            </>
          ) : (
            <div className="w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">Thành viên nhóm ({members.length})</p>
              {loading ? (
                <p className="mt-3 text-sm text-slate-500">Đang tải thành viên...</p>
              ) : members.length ? (
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {members.map((row) => (
                    <Link
                      key={row.id}
                      href={profileHref(row.userId)}
                      className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 transition hover:border-rose-200 hover:bg-rose-50/50"
                    >
                      <AuthorAvatar name={displayName(row.fullName, row.userId)} url={row.avatarUrl} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-800">
                          {displayName(row.fullName, row.userId)}
                        </p>
                        <p className="text-xs text-slate-500">
                          {row.role === "OWNER" ? "Trưởng nhóm" : "Thành viên"}
                        </p>
                      </div>
                      <span className="text-xs font-medium text-rose-500">Xem hồ sơ</span>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-500">Chưa có thành viên.</p>
              )}
            </div>
          )}
        </div>
      </section>
    </UserLayout>
  );
}
