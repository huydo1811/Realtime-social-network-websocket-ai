"use client";

import { useCallback, useEffect, useState } from "react";
import { adminApi } from "@/lib/api/adminApi";
import type { AdminGroupDetail, AdminGroupMembership, AdminGroupPost } from "@/types/admin";
import type {
  GroupMembershipStatus,
  GroupPostStatus,
  GroupResponse,
  GroupVisibility,
} from "@/types/friendship";

function formatDate(value?: string | null): string {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleString("vi-VN");
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    PENDING: "bg-amber-50 text-amber-700",
    APPROVED: "bg-emerald-50 text-emerald-700",
    REJECTED: "bg-rose-50 text-rose-700",
    OWNER: "bg-indigo-50 text-indigo-700",
    MEMBER: "bg-slate-100 text-slate-700",
    PUBLIC: "bg-sky-50 text-sky-700",
    PRIVATE: "bg-violet-50 text-violet-700",
  };
  return map[status] ?? "bg-slate-100 text-slate-600";
}

export default function AdminGroupsPage() {
  const [q, setQ] = useState("");
  const [visibility, setVisibility] = useState<GroupVisibility | "">("");
  const [ownerUserIdInput, setOwnerUserIdInput] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [groups, setGroups] = useState<GroupResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<AdminGroupDetail | null>(null);
  const [members, setMembers] = useState<AdminGroupMembership[]>([]);
  const [posts, setPosts] = useState<AdminGroupPost[]>([]);
  const [memberStatus, setMemberStatus] = useState<GroupMembershipStatus | "">("");
  const [postStatus, setPostStatus] = useState<GroupPostStatus | "">("");
  const [detailLoading, setDetailLoading] = useState(false);
  const [tab, setTab] = useState<"members" | "posts">("members");

  const loadGroups = useCallback(async (targetPage = page) => {
    setLoading(true);
    setError(null);
    try {
      const ownerRaw = ownerUserIdInput.trim();
      const ownerUserId = ownerRaw ? Number(ownerRaw) : undefined;
      if (ownerRaw && (!Number.isFinite(ownerUserId) || (ownerUserId ?? 0) <= 0)) {
        throw new Error("ownerUserId không hợp lệ");
      }
      const data = await adminApi.listGroups({
        q,
        visibility,
        ownerUserId,
        page: targetPage,
        size: 15,
      });
      setGroups(data.content ?? []);
      setTotalPages(data.totalPages ?? 0);
      setPage(data.number ?? targetPage);
    } catch (e) {
      setGroups([]);
      setError(e instanceof Error ? e.message : "Không thể tải danh sách nhóm");
    } finally {
      setLoading(false);
    }
  }, [ownerUserIdInput, page, q, visibility]);

  const loadDetail = useCallback(async (groupId: number) => {
    setDetailLoading(true);
    setError(null);
    try {
      const [groupDetail, memberRows, postRows] = await Promise.all([
        adminApi.getGroupDetail(groupId),
        adminApi.listGroupMembers(groupId, memberStatus),
        adminApi.listGroupPosts(groupId, postStatus),
      ]);
      setSelectedId(groupId);
      setDetail(groupDetail);
      setMembers(memberRows);
      setPosts(postRows);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể tải chi tiết nhóm");
    } finally {
      setDetailLoading(false);
    }
  }, [memberStatus, postStatus]);

  useEffect(() => {
    void loadGroups(0);
    // initial load only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedId == null) return;
    void loadDetail(selectedId);
  }, [memberStatus, postStatus, selectedId, loadDetail]);

  const runAction = async (action: () => Promise<void>, success: string) => {
    setError(null);
    setNotice(null);
    try {
      await action();
      setNotice(success);
      if (selectedId != null) await loadDetail(selectedId);
      await loadGroups(page);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Thao tác thất bại");
    }
  };

  return (
    <section className="min-w-0 space-y-4">
      <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Quản lý nhóm cộng đồng</h1>
        <p className="mt-1 text-sm text-slate-500">
          Xem toàn bộ nhóm, duyệt thành viên/bài viết vượt quyền trưởng nhóm, và xóa nhóm vi phạm.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm theo tên nhóm..."
            className="h-10 min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-rose-300 sm:min-w-[220px]"
          />
          <input
            value={ownerUserIdInput}
            onChange={(e) => setOwnerUserIdInput(e.target.value)}
            placeholder="Lọc ownerUserId..."
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-rose-300 sm:w-40"
          />
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as GroupVisibility | "")}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-rose-300"
          >
            <option value="">Mọi visibility</option>
            <option value="PUBLIC">PUBLIC</option>
            <option value="PRIVATE">PRIVATE</option>
          </select>
          <button
            type="button"
            onClick={() => void loadGroups(0)}
            disabled={loading}
            className="rounded-xl bg-rose-500 px-4 text-sm font-semibold text-white hover:bg-rose-600 disabled:opacity-60"
          >
            {loading ? "Đang tải..." : "Tìm nhóm"}
          </button>
        </div>
      </header>

      {(error || notice) && (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm">
          {error ? <p className="text-rose-600">{error}</p> : null}
          {notice ? <p className="text-emerald-600">{notice}</p> : null}
        </div>
      )}

      <div className="flex min-w-0 flex-col gap-4">
        <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-800">Danh sách nhóm</h2>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <button
                type="button"
                disabled={page <= 0 || loading}
                onClick={() => void loadGroups(page - 1)}
                className="rounded-lg border border-slate-200 px-2 py-1 disabled:opacity-40"
              >
                Trước
              </button>
              <span>
                Trang {totalPages === 0 ? 0 : page + 1}/{totalPages}
              </span>
              <button
                type="button"
                disabled={page + 1 >= totalPages || loading}
                onClick={() => void loadGroups(page + 1)}
                className="rounded-lg border border-slate-200 px-2 py-1 disabled:opacity-40"
              >
                Sau
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {groups.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">{loading ? "Đang tải..." : "Không có nhóm"}</p>
            ) : (
              groups.map((group) => (
                <article
                  key={group.id}
                  className={`rounded-xl border px-3 py-3 ${
                    selectedId === group.id ? "border-rose-200 bg-rose-50/40" : "border-slate-100 bg-white"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900">{group.name}</p>
                        <span className="text-xs text-slate-400">#{group.id}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusBadge(group.visibility)}`}>
                          {group.visibility}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs text-slate-500">{group.description || "Không có mô tả"}</p>
                      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                        <span>Trưởng nhóm: {group.ownerFullName || `User #${group.ownerUserId}`}</span>
                        <span>
                          Duyệt thành viên:{" "}
                          <span className="font-medium text-slate-700">{group.requireApproval ? "Có" : "Không"}</span>
                        </span>
                        <span>
                          Duyệt bài viết:{" "}
                          <span className="font-medium text-slate-700">
                            {group.requirePostApproval !== false ? "Có" : "Không"}
                          </span>
                        </span>
                        <span>Tạo: {formatDate(group.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => void loadDetail(group.id)}
                        className="rounded-md bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                      >
                        Chi tiết
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!confirm(`Xóa hẳn nhóm #${group.id} "${group.name}"?`)) return;
                          void (async () => {
                            setError(null);
                            setNotice(null);
                            try {
                              await adminApi.deleteGroup(group.id);
                              if (selectedId === group.id) {
                                setSelectedId(null);
                                setDetail(null);
                                setMembers([]);
                                setPosts([]);
                              }
                              setNotice("Đã xóa nhóm.");
                              await loadGroups(page);
                            } catch (e) {
                              setError(e instanceof Error ? e.message : "Không thể xóa nhóm");
                            }
                          })();
                        }}
                        className="rounded-md bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          {!detail ? (
            <div className="flex min-h-[200px] items-center justify-center text-sm text-slate-400">
              Chọn một nhóm để xem thành viên và bài viết.
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold text-slate-900">{detail.name}</h2>
                    <p className="mt-1 text-sm text-slate-500">{detail.description || "Không có mô tả"}</p>
                  </div>
                  {detailLoading ? <span className="text-xs text-slate-400">Đang cập nhật...</span> : null}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                  <div className="rounded-xl bg-slate-50 px-3 py-2">
                    <p className="text-slate-500">Thành viên</p>
                    <p className="mt-1 text-base font-semibold text-slate-800">{detail.memberCount}</p>
                  </div>
                  <div className="rounded-xl bg-amber-50 px-3 py-2">
                    <p className="text-amber-700">Chờ duyệt TV</p>
                    <p className="mt-1 text-base font-semibold text-amber-800">{detail.pendingMemberCount}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 px-3 py-2">
                    <p className="text-slate-500">Bài viết</p>
                    <p className="mt-1 text-base font-semibold text-slate-800">{detail.postCount}</p>
                  </div>
                  <div className="rounded-xl bg-amber-50 px-3 py-2">
                    <p className="text-amber-700">Chờ duyệt bài</p>
                    <p className="mt-1 text-base font-semibold text-amber-800">{detail.pendingPostCount}</p>
                  </div>
                </div>
                <div className="mt-3 space-y-1 text-xs text-slate-500">
                  <p>
                    Trưởng nhóm:{" "}
                    <span className="font-medium text-slate-700">
                      {detail.ownerFullName || `User #${detail.ownerUserId}`}
                    </span>
                    {" · "}
                    {detail.visibility === "PUBLIC" ? "Công khai" : "Riêng tư"}
                  </p>
                  <p>
                    Duyệt thành viên:{" "}
                    <span className="font-medium text-slate-700">{detail.requireApproval ? "Có" : "Không"}</span>
                    {" · "}
                    Duyệt bài viết:{" "}
                    <span className="font-medium text-slate-700">
                      {detail.requirePostApproval !== false ? "Có" : "Không"}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTab("members")}
                  className={`rounded-xl px-3 py-1.5 text-sm font-semibold ${
                    tab === "members" ? "bg-rose-500 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  Thành viên
                </button>
                <button
                  type="button"
                  onClick={() => setTab("posts")}
                  className={`rounded-xl px-3 py-1.5 text-sm font-semibold ${
                    tab === "posts" ? "bg-rose-500 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  Bài viết
                </button>
                {tab === "members" ? (
                  <select
                    value={memberStatus}
                    onChange={(e) => setMemberStatus(e.target.value as GroupMembershipStatus | "")}
                    className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm sm:ml-auto sm:w-auto"
                  >
                    <option value="">Mọi trạng thái</option>
                    <option value="PENDING">PENDING</option>
                    <option value="APPROVED">APPROVED</option>
                    <option value="REJECTED">REJECTED</option>
                  </select>
                ) : (
                  <select
                    value={postStatus}
                    onChange={(e) => setPostStatus(e.target.value as GroupPostStatus | "")}
                    className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm sm:ml-auto sm:w-auto"
                  >
                    <option value="">Mọi trạng thái</option>
                    <option value="PENDING">PENDING</option>
                    <option value="APPROVED">APPROVED</option>
                    <option value="REJECTED">REJECTED</option>
                  </select>
                )}
              </div>

              {tab === "members" ? (
                <div className="max-h-[520px] space-y-2 overflow-y-auto">
                  {members.length === 0 ? (
                    <p className="py-8 text-center text-sm text-slate-400">Không có thành viên</p>
                  ) : (
                    members.map((row) => (
                      <div key={row.id} className="rounded-xl border border-slate-100 px-3 py-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-800">
                              {row.fullName || `User #${row.userId}`}{" "}
                              <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusBadge(row.role)}`}>
                                {row.role}
                              </span>{" "}
                              <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusBadge(row.status)}`}>
                                {row.status}
                              </span>
                            </p>
                            <p className="mt-1 text-xs text-slate-400">Yêu cầu: {formatDate(row.requestedAt)}</p>
                          </div>
                          {row.role !== "OWNER" ? (
                            <div className="flex flex-wrap gap-1.5">
                              {row.status === "PENDING" ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      void runAction(
                                        async () => {
                                          await adminApi.approveGroupMember(detail.id, row.id);
                                        },
                                        "Đã duyệt thành viên."
                                      )
                                    }
                                    className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                                  >
                                    Duyệt
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      void runAction(
                                        async () => {
                                          await adminApi.rejectGroupMember(detail.id, row.id);
                                        },
                                        "Đã từ chối thành viên."
                                      )
                                    }
                                    className="rounded-md bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-100"
                                  >
                                    Từ chối
                                  </button>
                                </>
                              ) : null}
                              <button
                                type="button"
                                onClick={() => {
                                  if (!confirm(`Gỡ ${row.fullName || `user #${row.userId}`} khỏi nhóm?`)) return;
                                  void runAction(
                                    async () => {
                                      await adminApi.removeGroupMember(detail.id, row.id);
                                    },
                                    "Đã gỡ thành viên."
                                  );
                                }}
                                className="rounded-md bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                              >
                                Gỡ
                              </button>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="max-h-[520px] space-y-2 overflow-y-auto">
                  {posts.length === 0 ? (
                    <p className="py-8 text-center text-sm text-slate-400">Không có bài viết</p>
                  ) : (
                    posts.map((row) => (
                      <div key={row.id} className="rounded-xl border border-slate-100 px-3 py-2">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-slate-800">
                              #{row.id} · {row.authorName || `User #${row.authorUserId}`}{" "}
                              <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusBadge(row.status)}`}>
                                {row.status}
                              </span>
                            </p>
                            <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-600">
                              {row.content || "(không có chữ)"}
                            </p>
                            {row.mediaUrl ? (
                              <a
                                href={row.mediaUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-1 inline-block text-xs font-medium text-rose-600 hover:underline"
                              >
                                Xem media
                              </a>
                            ) : null}
                            <p className="mt-1 text-xs text-slate-400">{formatDate(row.createdAt)}</p>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {row.status !== "APPROVED" ? (
                              <button
                                type="button"
                                onClick={() =>
                                  void runAction(
                                    async () => {
                                      await adminApi.approveGroupPost(detail.id, row.id);
                                    },
                                    "Đã duyệt bài viết."
                                  )
                                }
                                className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                              >
                                Duyệt
                              </button>
                            ) : null}
                            {row.status !== "REJECTED" ? (
                              <button
                                type="button"
                                onClick={() =>
                                  void runAction(
                                    async () => {
                                      await adminApi.rejectGroupPost(detail.id, row.id);
                                    },
                                    "Đã từ chối bài viết."
                                  )
                                }
                                className="rounded-md bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                              >
                                Từ chối
                              </button>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
