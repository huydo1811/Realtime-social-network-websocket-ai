"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  approveGroupMembership,
  createGroup,
  deleteGroup,
  discoverGroups,
  getGroup,
  joinGroup,
  listGroupMembers,
  listMyGroupMemberships,
  listMyOwnedGroups,
  rejectGroupMembership,
  updateGroup,
} from "@/lib/api/friendshipApi";
import { postApi } from "@/lib/api/postApi";
import { uploadToCloudinary } from "@/lib/cloudinary/upload";
import type { GroupMembershipResponse, GroupResponse, GroupVisibility } from "@/types/friendship";
import UserLayout from "@/components/layout/UserLayout";
import ReportContentModal from "@/components/user/profile/ReportContentModal";

function GroupAvatar({ name, url, size = 48 }: { name: string; url?: string | null; size?: number }) {
  if (url) {
    return (
      <Image
        src={url}
        alt={name}
        width={size}
        height={size}
        className="rounded-xl object-cover"
        style={{ width: size, height: size }}
        unoptimized
      />
    );
  }
  return (
    <div
      className="flex items-center justify-center rounded-xl bg-sky-100 text-sm font-bold text-sky-700"
      style={{ width: size, height: size }}
    >
      {name[0]?.toUpperCase() || "G"}
    </div>
  );
}

export default function GroupsPage() {
  const [query, setQuery] = useState("");
  const [visibility, setVisibility] = useState<"ALL" | GroupVisibility>("ALL");
  const [groups, setGroups] = useState<GroupResponse[]>([]);
  const [ownedGroups, setOwnedGroups] = useState<GroupResponse[]>([]);
  const [myMemberships, setMyMemberships] = useState<GroupMembershipResponse[]>([]);
  const [pendingByGroup, setPendingByGroup] = useState<Record<number, GroupMembershipResponse[]>>({});
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [editingGroup, setEditingGroup] = useState<GroupResponse | null>(null);
  const [editForm, setEditForm] = useState({ name: "", description: "", avatarUrl: "" });
  const [uploadingEditAvatar, setUploadingEditAvatar] = useState(false);
  const [reportGroupId, setReportGroupId] = useState<number | null>(null);
  const [reportBusy, setReportBusy] = useState(false);
  const [myGroupsTab, setMyGroupsTab] = useState<"owned" | "joined">("owned");
  const [joinedGroups, setJoinedGroups] = useState<GroupResponse[]>([]);
  const [createForm, setCreateForm] = useState({
    name: "",
    description: "",
    avatarUrl: "",
    visibility: "PUBLIC" as GroupVisibility,
    requireApproval: false,
    requirePostApproval: true,
  });

  async function load() {
    setLoading(true);
    try {
      const [discoverRows, membershipRows, ownedRows] = await Promise.all([
        discoverGroups({ query: query.trim() || undefined, visibility: visibility === "ALL" ? undefined : visibility }),
        listMyGroupMemberships(),
        listMyOwnedGroups().catch(() => [] as GroupResponse[]),
      ]);
      setGroups(discoverRows);
      setMyMemberships(membershipRows);
      setOwnedGroups(ownedRows);
      const groupMap = new Map<number, GroupResponse>();
      discoverRows.forEach((g) => groupMap.set(g.id, g));
      ownedRows.forEach((g) => groupMap.set(g.id, g));
      const joinedMemberships = membershipRows.filter(
        (m) => m.status === "APPROVED" && m.role !== "OWNER"
      );
      const joinedResolved = await Promise.all(
        joinedMemberships.map(async (m) => {
          if (groupMap.has(m.groupId)) return groupMap.get(m.groupId)!;
          try {
            return await getGroup(m.groupId);
          } catch {
            return null;
          }
        })
      );
      setJoinedGroups(joinedResolved.filter((g): g is GroupResponse => g != null));
      const ownerGroupIds = membershipRows
        .filter((m) => m.role === "OWNER")
        .map((m) => m.groupId);
      const pendingEntries = await Promise.all(
        ownerGroupIds.map(async (groupId) => ({
          groupId,
          pending: await listGroupMembers(groupId, "PENDING").catch(() => [] as GroupMembershipResponse[]),
        }))
      );
      setPendingByGroup(Object.fromEntries(pendingEntries.map((x) => [x.groupId, x.pending])));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const membershipByGroup = useMemo(() => {
    const map = new Map<number, GroupMembershipResponse>();
    myMemberships.forEach((m) => map.set(m.groupId, m));
    return map;
  }, [myMemberships]);

  async function handlePickAvatar(file?: File) {
    if (!file) return;
    setUploadingAvatar(true);
    setNotice(null);
    try {
      const uploaded = await uploadToCloudinary(file);
      setCreateForm((v) => ({ ...v, avatarUrl: uploaded.secureUrl }));
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Không thể tải ảnh nhóm");
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleCreateGroup() {
    if (!createForm.name.trim()) return;
    setBusyKey("create");
    setNotice(null);
    try {
      await createGroup({
        name: createForm.name.trim(),
        description: createForm.description.trim() || undefined,
        avatarUrl: createForm.avatarUrl.trim() || undefined,
        visibility: createForm.visibility,
        requireApproval: createForm.visibility === "PRIVATE" ? true : createForm.requireApproval,
        requirePostApproval: createForm.requirePostApproval,
      });
      setNotice("Đã tạo nhóm mới.");
      setCreateForm({
        name: "",
        description: "",
        avatarUrl: "",
        visibility: "PUBLIC",
        requireApproval: false,
        requirePostApproval: true,
      });
      await load();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Không thể tạo nhóm");
    } finally {
      setBusyKey(null);
    }
  }

  async function handleJoin(groupId: number) {
    setBusyKey(`join-${groupId}`);
    setNotice(null);
    try {
      const res = await joinGroup(groupId);
      setNotice(res.status === "APPROVED" ? "Bạn đã tham gia nhóm." : "Đã gửi yêu cầu tham gia nhóm.");
      await load();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Không thể tham gia nhóm");
    } finally {
      setBusyKey(null);
    }
  }

  async function handleApprove(groupId: number, membershipId: number) {
    setBusyKey(`approve-${membershipId}`);
    try {
      await approveGroupMembership(groupId, membershipId);
      await load();
    } finally {
      setBusyKey(null);
    }
  }

  async function handleReject(groupId: number, membershipId: number) {
    setBusyKey(`reject-${membershipId}`);
    try {
      await rejectGroupMembership(groupId, membershipId);
      await load();
    } finally {
      setBusyKey(null);
    }
  }

  function openEditGroup(group: GroupResponse) {
    setEditingGroup(group);
    setEditForm({
      name: group.name,
      description: group.description || "",
      avatarUrl: group.avatarUrl || "",
    });
  }

  async function handlePickEditAvatar(file?: File) {
    if (!file) return;
    setUploadingEditAvatar(true);
    setNotice(null);
    try {
      const uploaded = await uploadToCloudinary(file);
      setEditForm((v) => ({ ...v, avatarUrl: uploaded.secureUrl }));
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Không thể tải ảnh nhóm");
    } finally {
      setUploadingEditAvatar(false);
    }
  }

  async function handleSaveEditGroup() {
    if (!editingGroup || !editForm.name.trim()) return;
    setBusyKey(`edit-${editingGroup.id}`);
    setNotice(null);
    try {
      await updateGroup(editingGroup.id, {
        name: editForm.name.trim(),
        description: editForm.description.trim(),
        avatarUrl: editForm.avatarUrl.trim(),
      });
      setNotice("Đã cập nhật nhóm.");
      setEditingGroup(null);
      await load();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Không thể cập nhật nhóm");
    } finally {
      setBusyKey(null);
    }
  }

  async function handleDeleteGroup(groupId: number, groupName: string) {
    if (!window.confirm(`Xóa nhóm "${groupName}"? Toàn bộ bài viết và thành viên sẽ bị xóa.`)) return;
    setBusyKey(`delete-${groupId}`);
    setNotice(null);
    try {
      await deleteGroup(groupId);
      setNotice("Đã xóa nhóm.");
      if (editingGroup?.id === groupId) setEditingGroup(null);
      await load();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Không thể xóa nhóm");
    } finally {
      setBusyKey(null);
    }
  }

  function renderGroupMeta(group: GroupResponse) {
    const members = group.memberCount ?? 0;
    return (
      <p className="mt-1 text-[11px] text-slate-500">
        {group.visibility === "PUBLIC" ? "Công khai" : "Riêng tư"}
        {" · "}
        {members} thành viên
        {" · "}
        {group.requireApproval || group.visibility === "PRIVATE" ? "Duyệt thành viên" : "Vào nhóm ngay"}
        {" · "}
        {group.requirePostApproval !== false ? "Duyệt bài viết" : "Đăng bài ngay"}
      </p>
    );
  }

  function renderGroupCard(group: GroupResponse, options?: { showOwnerActions?: boolean }) {
    const showOwnerActions = options?.showOwnerActions ?? false;
    const membership = membershipByGroup.get(group.id);
    return (
      <article
        key={group.id}
        className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md"
      >
        <div className="flex items-start gap-3">
          <GroupAvatar name={group.name} url={group.avatarUrl} size={52} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900">{group.name}</p>
            <p className="mt-1 line-clamp-2 text-xs text-slate-600">{group.description || "Chưa có mô tả."}</p>
            {renderGroupMeta(group)}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {showOwnerActions ? (
            <>
              <button
                type="button"
                onClick={() => openEditGroup(group)}
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Sửa
              </button>
              <button
                type="button"
                onClick={() => void handleDeleteGroup(group.id, group.name)}
                disabled={busyKey === `delete-${group.id}`}
                className="rounded-xl border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-60"
              >
                {busyKey === `delete-${group.id}` ? "Đang xóa..." : "Xóa"}
              </button>
            </>
          ) : null}
          <Link
            href={`/groups/${group.id}`}
            className="rounded-xl bg-sky-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-600"
          >
            Vào nhóm
          </Link>
          {!showOwnerActions && membership?.role !== "OWNER" ? (
            <button
              type="button"
              onClick={() => setReportGroupId(group.id)}
              className="rounded-xl border border-amber-200 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-50"
            >
              Báo cáo
            </button>
          ) : null}
        </div>
        {showOwnerActions && pendingByGroup[group.id]?.length ? (
          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
            <p className="text-xs font-semibold text-amber-800">
              Yêu cầu chờ duyệt ({pendingByGroup[group.id].length})
            </p>
            <div className="mt-2 space-y-1">
              {pendingByGroup[group.id].map((row) => (
                <div key={row.id} className="flex items-center justify-between gap-2 rounded-lg bg-white px-2 py-1.5 text-xs">
                  <span className="font-medium text-slate-800">{row.fullName || `User #${row.userId}`}</span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => void handleApprove(group.id, row.id)}
                      disabled={busyKey === `approve-${row.id}`}
                      className="rounded-md bg-emerald-500 px-2 py-1 text-white hover:bg-emerald-600 disabled:opacity-60"
                    >
                      Duyệt
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleReject(group.id, row.id)}
                      disabled={busyKey === `reject-${row.id}`}
                      className="rounded-md bg-rose-500 px-2 py-1 text-white hover:bg-rose-600 disabled:opacity-60"
                    >
                      Từ chối
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </article>
    );
  }

  return (
    <UserLayout>
      <section className="w-full animate-in fade-in slide-in-from-bottom-4 pb-20 pt-2 duration-500">
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h1 className="text-xl font-bold text-slate-900">Nhóm cộng đồng thú cưng</h1>
            <p className="mt-1 text-sm text-slate-600">Tạo nhóm public/private, gửi yêu cầu tham gia và duyệt thành viên nếu bạn là trưởng nhóm.</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">Tạo nhóm mới</p>
            <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
              <input
                value={createForm.name}
                onChange={(e) => setCreateForm((v) => ({ ...v, name: e.target.value }))}
                placeholder="Tên nhóm"
                className="h-10 rounded-xl border border-slate-200 px-3 text-sm"
              />
              <input
                value={createForm.description}
                onChange={(e) => setCreateForm((v) => ({ ...v, description: e.target.value }))}
                placeholder="Mô tả ngắn"
                className="h-10 rounded-xl border border-slate-200 px-3 text-sm"
              />
              <label className="text-xs text-slate-600">
                Quyền riêng tư
                <select
                  value={createForm.visibility}
                  onChange={(e) => {
                    const next = e.target.value as GroupVisibility;
                    setCreateForm((v) => ({
                      ...v,
                      visibility: next,
                      requireApproval: next === "PRIVATE" ? true : v.requireApproval,
                    }));
                  }}
                  className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-2 text-sm"
                >
                  <option value="PUBLIC">Công khai</option>
                  <option value="PRIVATE">Riêng tư</option>
                </select>
              </label>
              <div className="flex items-center gap-3">
                <GroupAvatar name={createForm.name || "G"} url={createForm.avatarUrl || null} size={44} />
                <div>
                  <input
                    id="group-avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadingAvatar}
                    onChange={(e) => void handlePickAvatar(e.target.files?.[0])}
                  />
                  <label
                    htmlFor="group-avatar-upload"
                    className="cursor-pointer rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    {uploadingAvatar ? "Đang tải..." : "Ảnh đại diện nhóm"}
                  </label>
                  {createForm.avatarUrl ? (
                    <button
                      type="button"
                      onClick={() => setCreateForm((v) => ({ ...v, avatarUrl: "" }))}
                      className="ml-2 text-xs text-slate-500 hover:text-rose-600"
                    >
                      Gỡ
                    </button>
                  ) : null}
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={createForm.visibility === "PRIVATE" ? true : createForm.requireApproval}
                  disabled={createForm.visibility === "PRIVATE"}
                  onChange={(e) => setCreateForm((v) => ({ ...v, requireApproval: e.target.checked }))}
                />
                Trưởng nhóm duyệt thành viên khi tham gia
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={createForm.requirePostApproval}
                  onChange={(e) => setCreateForm((v) => ({ ...v, requirePostApproval: e.target.checked }))}
                />
                Trưởng nhóm duyệt bài viết trước khi hiện
              </label>
            </div>
            <button
              type="button"
              onClick={() => void handleCreateGroup()}
              disabled={busyKey === "create" || uploadingAvatar}
              className="mt-3 rounded-xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-600 disabled:opacity-60"
            >
              {busyKey === "create" ? "Đang tạo..." : "Tạo nhóm"}
            </button>
          </div>

          {!loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-1 rounded-2xl border border-slate-200 bg-slate-50/80 p-1">
                <button
                  type="button"
                  onClick={() => setMyGroupsTab("owned")}
                  className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    myGroupsTab === "owned"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Nhóm của tôi ({ownedGroups.length})
                </button>
                <button
                  type="button"
                  onClick={() => setMyGroupsTab("joined")}
                  className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    myGroupsTab === "joined"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Nhóm đã tham gia ({joinedGroups.length})
                </button>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {myGroupsTab === "owned" ? (
                  ownedGroups.length ? (
                    ownedGroups.map((group) => renderGroupCard(group, { showOwnerActions: true }))
                  ) : (
                    <div className="col-span-full rounded-xl border border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-500">
                      Bạn chưa sở hữu nhóm nào. Tạo nhóm mới ở form phía trên.
                    </div>
                  )
                ) : joinedGroups.length ? (
                  joinedGroups.map((group) => renderGroupCard(group))
                ) : (
                  <div className="col-span-full rounded-xl border border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-500">
                    Bạn chưa tham gia nhóm nào (ngoài nhóm bạn sở hữu).
                  </div>
                )}
              </div>
            </div>
          ) : null}

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-end gap-2">
              <label className="text-xs text-slate-600">
                Tìm nhóm
                <input value={query} onChange={(e) => setQuery(e.target.value)} className="mt-1 h-9 rounded-xl border border-slate-200 px-3 text-sm" />
              </label>
              <label className="text-xs text-slate-600">
                Hiển thị
                <select value={visibility} onChange={(e) => setVisibility(e.target.value as "ALL" | GroupVisibility)} className="mt-1 h-9 rounded-xl border border-slate-200 px-3 text-sm">
                  <option value="ALL">Tất cả</option>
                  <option value="PUBLIC">Công khai</option>
                  <option value="PRIVATE">Riêng tư</option>
                </select>
              </label>
              <button type="button" onClick={() => void load()} className="h-9 rounded-xl border border-slate-200 px-3 text-sm hover:bg-slate-50">
                Lọc
              </button>
            </div>
          </div>

          {notice ? <div className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-800">{notice}</div> : null}

          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">Đang tải nhóm...</div>
          ) : (
            <div className="space-y-3">
              {groups.map((group) => {
                const membership = membershipByGroup.get(group.id);
                const approved = membership?.status === "APPROVED";
                const pending = membership?.status === "PENDING";
                return (
                  <article key={group.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <GroupAvatar name={group.name} url={group.avatarUrl} size={52} />
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{group.name}</p>
                          <p className="mt-1 text-xs text-slate-600">{group.description || "Chưa có mô tả."}</p>
                          {renderGroupMeta(group)}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => void handleJoin(group.id)}
                          disabled={approved || pending || busyKey === `join-${group.id}`}
                          className="rounded-xl bg-sky-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-600 disabled:opacity-60"
                        >
                          {approved
                            ? "Đã tham gia"
                            : pending
                              ? "Chờ duyệt"
                              : busyKey === `join-${group.id}`
                                ? "Đang gửi..."
                                : "Tham gia"}
                        </button>
                        {approved || group.visibility === "PUBLIC" ? (
                          <Link
                            href={`/groups/${group.id}`}
                            className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            Xem nhóm
                          </Link>
                        ) : null}
                        {membership?.role !== "OWNER" ? (
                          <button
                            type="button"
                            onClick={() => setReportGroupId(group.id)}
                            className="rounded-xl border border-amber-200 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-50"
                          >
                            Báo cáo
                          </button>
                        ) : null}
                      </div>
                    </div>

                    {pendingByGroup[group.id]?.length ? (
                      <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
                        <p className="text-xs font-semibold text-amber-800">Yêu cầu chờ duyệt ({pendingByGroup[group.id].length})</p>
                        <div className="mt-2 space-y-1">
                          {pendingByGroup[group.id].map((row) => (
                            <div key={row.id} className="flex items-center justify-between gap-2 rounded-lg bg-white px-2 py-1.5 text-xs">
                              <span className="font-medium text-slate-800">{row.fullName || `User #${row.userId}`}</span>
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  onClick={() => void handleApprove(group.id, row.id)}
                                  disabled={busyKey === `approve-${row.id}`}
                                  className="rounded-md bg-emerald-500 px-2 py-1 text-white hover:bg-emerald-600 disabled:opacity-60"
                                >
                                  Duyệt
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void handleReject(group.id, row.id)}
                                  disabled={busyKey === `reject-${row.id}`}
                                  className="rounded-md bg-rose-500 px-2 py-1 text-white hover:bg-rose-600 disabled:opacity-60"
                                >
                                  Từ chối
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {editingGroup ? (
          <div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/45 p-4"
            onClick={() => setEditingGroup(null)}
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
                  <GroupAvatar name={editForm.name || "G"} url={editForm.avatarUrl || null} size={56} />
                  <div>
                    <input
                      id="edit-group-avatar"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingEditAvatar}
                      onChange={(e) => void handlePickEditAvatar(e.target.files?.[0])}
                    />
                    <label
                      htmlFor="edit-group-avatar"
                      className="cursor-pointer rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      {uploadingEditAvatar ? "Đang tải..." : "Đổi ảnh đại diện"}
                    </label>
                  </div>
                </div>
                <input
                  value={editForm.name}
                  onChange={(e) => setEditForm((v) => ({ ...v, name: e.target.value }))}
                  placeholder="Tên nhóm"
                  className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                />
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm((v) => ({ ...v, description: e.target.value }))}
                  placeholder="Mô tả"
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingGroup(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={() => void handleSaveEditGroup()}
                  disabled={busyKey === `edit-${editingGroup.id}` || uploadingEditAvatar || !editForm.name.trim()}
                  className="rounded-xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-600 disabled:opacity-60"
                >
                  {busyKey === `edit-${editingGroup.id}` ? "Đang lưu..." : "Lưu"}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <ReportContentModal
          open={reportGroupId != null}
          targetType="GROUP"
          submitting={reportBusy}
          onClose={() => setReportGroupId(null)}
          onSubmit={async ({ reason }) => {
            if (reportGroupId == null) return;
            setReportBusy(true);
            setNotice(null);
            try {
              await postApi.reportGroup(reportGroupId, reason);
              setNotice("Đã gửi báo cáo nhóm cho quản trị viên.");
              setReportGroupId(null);
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
