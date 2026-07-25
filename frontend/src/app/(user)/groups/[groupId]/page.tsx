"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import UserLayout from "@/components/layout/UserLayout";
import PostMediaDisplay from "@/components/user/profile/PostMediaDisplay";
import { uploadToCloudinary } from "@/lib/cloudinary/upload";
import {
  approveGroupPost,
  createGroupPost,
  getGroup,
  joinGroup,
  listGroupMembers,
  listGroupPosts,
  listMyGroupMemberships,
  rejectGroupPost,
} from "@/lib/api/friendshipApi";
import type { GroupMembershipResponse, GroupPostResponse, GroupResponse } from "@/types/friendship";

function formatDate(iso?: string | null) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("vi-VN");
}

export default function GroupDetailPage() {
  const params = useParams<{ groupId: string }>();
  const groupId = Number(params.groupId);
  const [group, setGroup] = useState<GroupResponse | null>(null);
  const [myMemberships, setMyMemberships] = useState<GroupMembershipResponse[]>([]);
  const [members, setMembers] = useState<GroupMembershipResponse[]>([]);
  const [posts, setPosts] = useState<GroupPostResponse[]>([]);
  const [pendingPosts, setPendingPosts] = useState<GroupPostResponse[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [composerText, setComposerText] = useState("");
  const [composerMediaUrl, setComposerMediaUrl] = useState<string | undefined>(undefined);
  const [composerMediaName, setComposerMediaName] = useState("");
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const myMembership = useMemo(() => myMemberships.find((row) => row.groupId === groupId), [myMemberships, groupId]);
  const isOwner = myMembership?.role === "OWNER" && myMembership?.status === "APPROVED";
  const canPost = myMembership?.status === "APPROVED";

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
  }, [groupId]);

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
                  {group?.visibility === "PUBLIC" ? "Công khai" : "Riêng tư"} · {group?.requireApproval ? "Bài viết có duyệt" : "Bài viết đăng ngay"}
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
            <div className="mt-2 flex justify-end">
              <button
                type="button"
                onClick={() => void handleCreatePost()}
                disabled={!canPost || uploadingMedia || busyKey === "create-post" || (!composerText.trim() && !composerMediaUrl?.trim())}
                className="rounded-xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-600 disabled:opacity-60"
              >
                {busyKey === "create-post" ? "Đang đăng..." : "Đăng bài"}
              </button>
            </div>
          </div>

          {isOwner && pendingPosts.length ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
              <p className="text-sm font-semibold text-amber-900">Bài viết chờ duyệt ({pendingPosts.length})</p>
              <div className="mt-3 space-y-2">
                {pendingPosts.map((row) => (
                  <article key={row.id} className="rounded-xl border border-amber-200 bg-white p-3">
                    <p className="text-xs text-slate-500">{row.authorName || `User #${row.authorUserId}`} · {formatDate(row.createdAt)}</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">{row.content}</p>
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
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-2">
              <p className="text-sm font-semibold text-slate-900">Bài viết trong nhóm</p>
              {loading ? (
                <p className="mt-3 text-sm text-slate-500">Đang tải bài viết...</p>
              ) : posts.length ? (
                <div className="mt-3 space-y-3">
                  {posts.map((row) => (
                    <article key={row.id} className="rounded-xl border border-slate-200 p-3">
                      <p className="text-xs text-slate-500">{row.authorName || `User #${row.authorUserId}`} · {formatDate(row.createdAt)}</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">{row.content}</p>
                      {row.mediaUrl ? (
                        <div className="mt-2 overflow-hidden rounded-xl border border-slate-200">
                          <PostMediaDisplay mediaUrl={row.mediaUrl} variant="embed" />
                        </div>
                      ) : null}
                    </article>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-500">Chưa có bài viết nào trong nhóm.</p>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">Thành viên ({members.length})</p>
              <div className="mt-2 space-y-1.5">
                {members.slice(0, 20).map((row) => (
                  <div key={row.id} className="rounded-lg bg-slate-50 px-2 py-1.5 text-xs text-slate-700">
                    User #{row.userId} {row.role === "OWNER" ? "• Trưởng nhóm" : ""}
                  </div>
                ))}
                {members.length > 20 ? <p className="text-[11px] text-slate-500">+ {members.length - 20} thành viên khác</p> : null}
              </div>
            </div>
          </div>
        </div>
      </section>
    </UserLayout>
  );
}
