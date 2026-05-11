"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import UserLayout from "@/components/layout/UserLayout";
import { chatApi } from "@/lib/api/chatApi";
import { getUserById } from "@/lib/api/userApi";

export default function ChatSettingsPage() {
  const [blockedIds, setBlockedIds] = useState<number[]>([]);
  const [names, setNames] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = async () => {
    setLoading(true);
    setError(null);
    try {
      const ids = await chatApi.listMyBlocks();
      setBlockedIds(ids);
      const pairs = await Promise.all(
        ids.map(async (id) => {
          try {
            const u = await getUserById(String(id));
            return [id, u.fullName || `Người dùng #${id}`] as const;
          } catch {
            return [id, `Người dùng #${id}`] as const;
          }
        })
      );
      setNames(Object.fromEntries(pairs));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tải được dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  const unblock = async (id: number) => {
    setBusyId(id);
    setError(null);
    try {
      await chatApi.unblockUser(id);
      setBlockedIds((prev) => prev.filter((x) => x !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không bỏ chặn được");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <UserLayout>
      <div className="w-full max-w-xl pb-16 animate-in fade-in duration-300">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Cài đặt tin nhắn</h1>
        <p className="text-slate-500 text-sm mt-1">
          Quản lý chặn và mở nhanh tùy chỉnh giao diện từng cuộc trò chuyện.
        </p>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold text-slate-800">Người đã chặn</h2>
          <p className="text-xs text-slate-500 mt-1">
            Bỏ chặn tại đây hoặc trong mỗi cuộc chat (⚙ → Quyền riêng tư).
          </p>
          {error && <p className="mt-3 text-xs text-rose-600">{error}</p>}
          {loading ? (
            <p className="mt-4 text-sm text-slate-400">Đang tải...</p>
          ) : blockedIds.length === 0 ? (
            <p className="mt-4 text-sm text-slate-400">Bạn chưa chặn ai.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {blockedIds.map((id) => (
                <li
                  key={id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
                >
                  <span className="text-sm font-medium text-slate-800 truncate">{names[id] || `User #${id}`}</span>
                  <button
                    type="button"
                    disabled={busyId === id}
                    onClick={() => void unblock(id)}
                    className="cursor-pointer shrink-0 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                  >
                    {busyId === id ? "..." : "Bỏ chặn"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold text-slate-800">Giao diện &amp; phím tắt</h2>
          <ul className="mt-3 text-sm text-slate-600 space-y-2 list-disc pl-5">
            <li>
              Mở <Link className="text-rose-600 font-semibold hover:underline" href="/messages">Tin nhắn</Link>, bấm{" "}
              <kbd className="px-1.5 py-0.5 rounded bg-slate-100 text-xs">Ctrl</kbd>+
              <kbd className="px-1.5 py-0.5 rounded bg-slate-100 text-xs">K</kbd> để tìm nhanh hội thoại.
            </li>
            <li>Trong mỗi chat, ⚙ Tùy chỉnh: theme, nền, preset ảnh, chặn.</li>
          </ul>
        </section>
      </div>
    </UserLayout>
  );
}
