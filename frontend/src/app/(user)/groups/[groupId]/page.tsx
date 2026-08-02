"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import MediaPreview from "@/components/common/MediaPreview";
import UserLayout from "@/components/layout/UserLayout";
import PostMediaDisplay from "@/components/user/profile/PostMediaDisplay";
import { uploadToCloudinary } from "@/lib/cloudinary/upload";
import {
  approveGroupPost,
  createGroupPost,
  createGroupPostComment,
  deleteGroup,
  getGroup,
  joinGroup,
  listGroupMembers,
  listGroupPostComments,
  listGroupPosts,
  listMyGroupMemberships,
  rejectGroupPost,
  removeGroupMember,
  toggleGroupPostLike,
  updateGroup,
} from "@/lib/api/friendshipApi";
import { postApi } from "@/lib/api/postApi";
import type {
  GroupMembershipResponse,
  GroupPostCommentResponse,
  GroupPostResponse,
  GroupResponse,
} from "@/types/friendship";
import ReportContentModal from "@/components/user/profile/ReportContentModal";

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
  const router = useRouter();
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
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", description: "", avatarUrl: "" });
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportBusy, setReportBusy] = useState(false);

  const myMembership = useMemo(() => myMemberships.find((row) => row.groupId === groupId), [myMemberships, groupId]);
  const isOwner = myMembership?.role === "OWNER" && myMembership?.status === "APPROVED";
  const canPost = myMembership?.status === "APPROVED";
  const isPrivateLocked =
    group?.visibility === "PRIVATE" && !canPost;

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
      const [groupRow, mineRows] = await Promise.all([
        getGroup(groupId),
        listMyGroupMemberships(),
      ]);
      setGroup(groupRow);
      setMyMemberships(mineRows);
      const mine = mineRows.find((row) => row.groupId === groupId);
      const approved = mine?.status === "APPROVED";
      const canView = groupRow.visibility === "PUBLIC" || approved;

      if (!canView) {
        setMembers([]);
        setPosts([]);
        setPendingPosts([]);
        setCommentsByPostId({});
        return;
      }

      const [memberRows, approvedPosts] = await Promise.all([
        listGroupMembers(groupId, "APPROVED").catch(() => [] as GroupMembershipResponse[]),
        listGroupPosts(groupId, "APPROVED").catch(() => [] as GroupPostResponse[]),
      ]);
      setMembers(memberRows);
      setPosts(approvedPosts);
      void loadCommentsForPosts(approvedPosts);
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

  async function handleSaveGroupEdit() {
    if (!editForm.name.trim()) return;
    setBusyKey("edit-group");
    setNotice(null);
    try {
      const updated = await updateGroup(groupId, {
        name: editForm.name.trim(),
        description: editForm.description.trim(),
        avatarUrl: editForm.avatarUrl.trim(),
      });
      setGroup(updated);
      setEditing(false);
      setNotice("Đã cập nhật nhóm.");
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Không thể cập nhật nhóm");
    } finally {
      setBusyKey(null);
    }
  }

  async function handleDeleteGroup() {
    if (!group) return;
    if (!window.confirm(`Xóa nhóm "${group.name}"? Toàn bộ bài viết và thành viên sẽ bị xóa.`)) return;
    setBusyKey("delete-group");
    setNotice(null);
    try {
      await deleteGroup(groupId);
      router.push("/groups");
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Không thể xóa nhóm");
      setBusyKey(null);
    }
  }

  async function handlePickAvatar(file?: File) {
    if (!file) return;
    setUploadingAvatar(true);
    setNotice(null);
    try {
      const uploaded = await uploadToCloudinary(file);
      setEditForm((v) => ({ ...v, avatarUrl: uploaded.secureUrl }));
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Không thể tải ảnh nhóm");
    } finally {
      setUploadingAvatar(false);
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

  async function handleKickMember(row: GroupMembershipResponse) {
    const label = displayName(row.fullName, row.userId);
    if (!window.confirm(`Kick "${label}" khỏi nhóm?`)) return;
    setBusyKey(`kick-${row.id}`);
    setNotice(null);
    try {
      await removeGroupMember(groupId, row.id);
      setMembers((prev) => prev.filter((m) => m.id !== row.id));
      setGroup((prev) =>
        prev
          ? { ...prev, memberCount: Math.max(0, (prev.memberCount ?? members.length) - 1) }
          : prev
      );
      setNotice(`Đã kick ${label} khỏi nhóm.`);
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Không thể kick thành viên");
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
              <div className="flex min-w-0 items-start gap-3">
                {group?.avatarUrl ? (
                  <Image
                    src={group.avatarUrl}
                    alt={group.name}
                    width={64}
                    height={64}
                    className="h-16 w-16 rounded-2xl object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-100 text-lg font-bold text-sky-700">
                    {(group?.name?.[0] || "G").toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-xs text-slate-500">Nhóm</p>
                  <h1 className="text-xl font-bold text-slate-900">{group?.name || "Đang tải..."}</h1>
                  <p className="mt-1 text-sm text-slate-600">{group?.description || "Chưa có mô tả."}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {group?.visibility === "PUBLIC" ? "Công khai" : "Riêng tư"}
                    {" · "}
                    {group?.memberCount ?? members.length} thành viên
                    {" · "}
                    {group?.requireApproval || group?.visibility === "PRIVATE" ? "Duyệt thành viên" : "Vào nhóm ngay"}
                    {" · "}
                    {group?.requirePostApproval !== false ? "Bài viết cần duyệt" : "Bài viết đăng ngay"}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Link href="/groups" className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                  Quay lại nhóm
                </Link>
                {isOwner ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        if (!group) return;
                        setEditForm({
                          name: group.name,
                          description: group.description || "",
                          avatarUrl: group.avatarUrl || "",
                        });
                        setEditing(true);
                      }}
                      className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Sửa nhóm
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDeleteGroup()}
                      disabled={busyKey === "delete-group"}
                      className="rounded-xl border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-60"
                    >
                      {busyKey === "delete-group" ? "Đang xóa..." : "Xóa nhóm"}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setReportOpen(true)}
                    className="rounded-xl border border-amber-200 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-50"
                  >
                    Báo cáo nhóm
                  </button>
                )}
                {!canPost ? (
                  <button
                    type="button"
                    onClick={() => void handleJoin()}
                    disabled={busyKey === "join" || myMembership?.status === "PENDING"}
                    className="rounded-xl bg-sky-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-600 disabled:opacity-60"
                  >
                    {busyKey === "join"
                      ? "Đang xử lý..."
                      : myMembership?.status === "PENDING"
                        ? "Chờ duyệt"
                        : "Tham gia nhóm"}
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          {notice ? <div className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-800">{notice}</div> : null}

          {isPrivateLocked ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center shadow-sm">
              <p className="text-sm font-semibold text-amber-900">Đây là nhóm riêng tư</p>
              <p className="mt-2 text-sm text-amber-800/90">
                Bạn cần được trưởng nhóm duyệt tham gia trước khi xem bài viết và thành viên.
              </p>
            </div>
          ) : (
            <>
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
              Thành viên ({group?.memberCount ?? members.length})
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
                    <div
                      key={row.id}
                      className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5"
                    >
                      <Link href={profileHref(row.userId)} className="shrink-0">
                        <AuthorAvatar name={displayName(row.fullName, row.userId)} url={row.avatarUrl} />
                      </Link>
                      <Link href={profileHref(row.userId)} className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-800 hover:text-rose-600 hover:underline">
                          {displayName(row.fullName, row.userId)}
                        </p>
                        <p className="text-xs text-slate-500">
                          {row.role === "OWNER" ? "Trưởng nhóm" : "Thành viên"}
                        </p>
                      </Link>
                      {isOwner && row.role !== "OWNER" ? (
                        <button
                          type="button"
                          onClick={() => void handleKickMember(row)}
                          disabled={busyKey === `kick-${row.id}`}
                          className="shrink-0 rounded-lg border border-rose-200 px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-60"
                        >
                          {busyKey === `kick-${row.id}` ? "..." : "Kick"}
                        </button>
                      ) : (
                        <Link
                          href={profileHref(row.userId)}
                          className="shrink-0 text-xs font-medium text-rose-500 hover:underline"
                        >
                          Xem hồ sơ
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-500">Chưa có thành viên.</p>
              )}
            </div>
          )}
            </>
          )}
        </div>

        {editing ? (
          <div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/45 p-4"
            onClick={() => setEditing(false)}
            role="dialog"
            aria-modal="true"
          >
            <div
              className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-slate-900">Sửa nhóm</h3>
              <div className="mt-3 space-y-3">
                <div className="flex items-center gap-3">
                  {editForm.avatarUrl ? (
                    <Image src={editForm.avatarUrl} alt="" width={56} height={56} className="h-14 w-14 rounded-2xl object-cover" unoptimized />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-100 text-sm font-bold text-sky-700">
                      {(editForm.name[0] || "G").toUpperCase()}
                    </div>
                  )}
                  <div>
                    <input
                      id="detail-edit-avatar"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingAvatar}
                      onChange={(e) => void handlePickAvatar(e.target.files?.[0])}
                    />
                    <label
                      htmlFor="detail-edit-avatar"
                      className="cursor-pointer rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      {uploadingAvatar ? "Đang tải..." : "Đổi ảnh đại diện"}
                    </label>
                  </div>
                </div>
                <input
                  value={editForm.name}
                  onChange={(e) => setEditForm((v) => ({ ...v, name: e.target.value }))}
                  className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                  placeholder="Tên nhóm"
                />
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm((v) => ({ ...v, description: e.target.value }))}
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Mô tả"
                />
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setEditing(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={() => void handleSaveGroupEdit()}
                  disabled={busyKey === "edit-group" || uploadingAvatar || !editForm.name.trim()}
                  className="rounded-xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-600 disabled:opacity-60"
                >
                  {busyKey === "edit-group" ? "Đang lưu..." : "Lưu"}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <ReportContentModal
          open={reportOpen}
          targetType="GROUP"
          submitting={reportBusy}
          onClose={() => setReportOpen(false)}
          onSubmit={async ({ reason }) => {
            setReportBusy(true);
            setNotice(null);
            try {
              await postApi.reportGroup(groupId, reason);
              setNotice("Đã gửi báo cáo nhóm cho quản trị viên.");
              setReportOpen(false);
            } catch (e) {
              setNotice(e instanceof Error ? e.message : "Không thể báo cáo nhóm");
            } finally {
              setReportBusy(false);
            }
          }}
        />
      </section>
    </UserLayout>
  );
}
