"use client";

import { useMemo, useState } from "react";
import { adminApi } from "@/lib/api/adminApi";
import type { AdminFriendshipItem } from "@/types/admin";

function formatDate(value?: string | null): string {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleString("vi-VN");
}

function getOtherUserId(item: AdminFriendshipItem, selectedUserId: number): number {
  return item.userId1 === selectedUserId ? item.userId2 : item.userId1;
}

export default function AdminFriendshipPage() {
  const [userIdInput, setUserIdInput] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<AdminFriendshipItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const filteredItems = useMemo(() => {
    if (statusFilter === "ALL") return items;
    return items.filter((item) => item.status === statusFilter);
  }, [items, statusFilter]);

  const loadByUser = async () => {
    const parsed = Number(userIdInput);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError("Nhập userId hợp lệ");
      return;
    }
    setSelectedUserId(parsed);
    setError(null);
    setNotice(null);
    setLoading(true);
    try {
      const data = await adminApi.listUserFriendships(parsed);
      setItems(data);
      if (data.length === 0) {
        setNotice("User này chưa có quan hệ bạn bè nào.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể tải dữ liệu");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const forceBlock = async (friendshipId: number, blockerUserId: number) => {
    if (!confirm(`Force block friendship #${friendshipId} bởi user ${blockerUserId}?`)) return;
    setError(null);
    setNotice(null);
    try {
      const updated = await adminApi.forceBlockFriendship(friendshipId, blockerUserId);
      setItems((prev) => prev.map((item) => (item.friendshipId === friendshipId ? updated : item)));
      setNotice("Đã force block thành công.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể force block");
    }
  };

  const forceRemove = async (friendshipId: number) => {
    if (!confirm(`Xóa hẳn quan hệ #${friendshipId}? Thao tác này dùng cho xử lý abuse.`)) return;
    setError(null);
    setNotice(null);
    try {
      await adminApi.forceRemoveFriendship(friendshipId);
      setItems((prev) => prev.filter((item) => item.friendshipId !== friendshipId));
      setNotice("Đã gỡ quan hệ bạn bè.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể gỡ quan hệ");
    }
  };

  return (
    <section className="space-y-4">
      <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Quản lý quan hệ bạn bè</h1>
        <p className="mt-1 text-sm text-slate-500">
          Trang điều tra và can thiệp: xem trạng thái friendship, force block, force remove khi cần xử lý vi phạm.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <input
            value={userIdInput}
            onChange={(e) => setUserIdInput(e.target.value)}
            placeholder="Nhập userId..."
            className="h-10 min-w-[220px] rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-rose-300"
          />
          <button
            type="button"
            onClick={() => void loadByUser()}
            disabled={loading}
            className="rounded-xl bg-rose-500 px-4 text-sm font-semibold text-white hover:bg-rose-600 disabled:opacity-60"
          >
            {loading ? "Đang tải..." : "Tải quan hệ"}
          </button>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-rose-300"
          >
            <option value="ALL">Mọi trạng thái</option>
            <option value="PENDING">PENDING</option>
            <option value="ACCEPTED">ACCEPTED</option>
            <option value="BLOCKED">BLOCKED</option>
            <option value="REJECTED">REJECTED</option>
          </select>
        </div>
      </header>

      {(error || notice) && (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm">
          {error ? <p className="text-rose-600">{error}</p> : null}
          {notice ? <p className="text-emerald-600">{notice}</p> : null}
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-2 text-xs text-slate-500">
          {selectedUserId ? `Kết quả cho userId ${selectedUserId}` : "Nhập userId để bắt đầu"}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="border-b text-left text-slate-500">
                <th className="py-2 pr-2">ID</th>
                <th className="py-2 pr-2">Trạng thái</th>
                <th className="py-2 pr-2">User A</th>
                <th className="py-2 pr-2">User B</th>
                <th className="py-2 pr-2">Requested By</th>
                <th className="py-2 pr-2">Cập nhật</th>
                <th className="py-2 pr-2">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Không có dữ liệu
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const selected = selectedUserId ?? item.userId1;
                  const otherUserId = getOtherUserId(item, selected);
                  return (
                    <tr key={item.friendshipId} className="border-b border-slate-100">
                      <td className="py-2 pr-2 font-medium text-slate-700">#{item.friendshipId}</td>
                      <td className="py-2 pr-2">{item.status}</td>
                      <td className="py-2 pr-2">{item.userId1}</td>
                      <td className="py-2 pr-2">{item.userId2}</td>
                      <td className="py-2 pr-2">{item.requestedBy}</td>
                      <td className="py-2 pr-2">{formatDate(item.updatedAt)}</td>
                      <td className="py-2 pr-2">
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            onClick={() => void forceBlock(item.friendshipId, selected)}
                            className="rounded-md bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-100"
                          >
                            Block bởi {selected}
                          </button>
                          <button
                            type="button"
                            onClick={() => void forceBlock(item.friendshipId, otherUserId)}
                            className="rounded-md bg-orange-50 px-2 py-1 text-xs font-semibold text-orange-700 hover:bg-orange-100"
                          >
                            Block bởi {otherUserId}
                          </button>
                          <button
                            type="button"
                            onClick={() => void forceRemove(item.friendshipId)}
                            className="rounded-md bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                          >
                            Force remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
