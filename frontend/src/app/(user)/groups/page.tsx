"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  approveGroupMembership,
  createGroup,
  discoverGroups,
  joinGroup,
  listGroupMembers,
  listMyGroupMemberships,
  rejectGroupMembership,
} from "@/lib/api/friendshipApi";
import type { GroupMembershipResponse, GroupResponse, GroupVisibility } from "@/types/friendship";
import UserLayout from "@/components/layout/UserLayout";

export default function GroupsPage() {
  const [query, setQuery] = useState("");
  const [visibility, setVisibility] = useState<"ALL" | GroupVisibility>("ALL");
  const [groups, setGroups] = useState<GroupResponse[]>([]);
  const [myMemberships, setMyMemberships] = useState<GroupMembershipResponse[]>([]);
  const [pendingByGroup, setPendingByGroup] = useState<Record<number, GroupMembershipResponse[]>>({});
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState({
    name: "",
    description: "",
    visibility: "PUBLIC" as GroupVisibility,
    requireApproval: false,
  });

  async function load() {
    setLoading(true);
    try {
      const [discoverRows, membershipRows] = await Promise.all([
        discoverGroups({ query: query.trim() || undefined, visibility: visibility === "ALL" ? undefined : visibility }),
        listMyGroupMemberships(),
      ]);
      setGroups(discoverRows);
      setMyMemberships(membershipRows);
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

  const myGroupIds = useMemo(() => new Set(myMemberships.map((m) => m.groupId)), [myMemberships]);

  async function handleCreateGroup() {
    if (!createForm.name.trim()) return;
    setBusyKey("create");
    setNotice(null);
    try {
      await createGroup({
        name: createForm.name.trim(),
        description: createForm.description.trim() || undefined,
        visibility: createForm.visibility,
        requireApproval: createForm.requireApproval,
      });
      setNotice("Đã tạo nhóm mới.");
      setCreateForm({ name: "", description: "", visibility: "PUBLIC", requireApproval: false });
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
                  onChange={(e) => setCreateForm((v) => ({ ...v, visibility: e.target.value as GroupVisibility }))}
                  className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-2 text-sm"
                >
                  <option value="PUBLIC">Công khai</option>
                  <option value="PRIVATE">Riêng tư</option>
                </select>
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={createForm.requireApproval}
                  onChange={(e) => setCreateForm((v) => ({ ...v, requireApproval: e.target.checked }))}
                />
                Trưởng nhóm duyệt thành viên
              </label>
            </div>
            <button
              type="button"
              onClick={() => void handleCreateGroup()}
              disabled={busyKey === "create"}
              className="mt-3 rounded-xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-600 disabled:opacity-60"
            >
              {busyKey === "create" ? "Đang tạo..." : "Tạo nhóm"}
            </button>
          </div>

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
                const joined = myGroupIds.has(group.id);
                return (
                  <article key={group.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{group.name}</p>
                        <p className="mt-1 text-xs text-slate-600">{group.description || "Chưa có mô tả."}</p>
                        <p className="mt-1 text-[11px] text-slate-500">
                          {group.visibility === "PUBLIC" ? "Công khai" : "Riêng tư"} · {group.requireApproval ? "Có duyệt thành viên" : "Vào nhóm ngay"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleJoin(group.id)}
                        disabled={joined || busyKey === `join-${group.id}`}
                        className="rounded-xl bg-sky-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-600 disabled:opacity-60"
                      >
                        {joined ? "Đã tham gia" : busyKey === `join-${group.id}` ? "Đang gửi..." : "Tham gia"}
                      </button>
                      {joined ? (
                        <Link
                          href={`/groups/${group.id}`}
                          className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Vào nhóm
                        </Link>
                      ) : null}
                    </div>

                    {pendingByGroup[group.id]?.length ? (
                      <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
                        <p className="text-xs font-semibold text-amber-800">Yêu cầu chờ duyệt ({pendingByGroup[group.id].length})</p>
                        <div className="mt-2 space-y-1">
                          {pendingByGroup[group.id].map((row) => (
                            <div key={row.id} className="flex items-center justify-between gap-2 rounded-lg bg-white px-2 py-1.5 text-xs">
                              <span>User #{row.userId}</span>
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
      </section>
    </UserLayout>
  );
}
