"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import { moderationApi, type ModerationAudit } from "@/lib/api/moderationApi";
import { postApi } from "@/lib/api/postApi";

const ACTION_STYLES: Record<ModerationAudit["action"], string> = {
  ALLOW: "bg-emerald-100 text-emerald-700",
  SOFT_HIDE: "bg-amber-100 text-amber-700",
  HARD_REJECT: "bg-rose-100 text-rose-700",
  FALLBACK: "bg-slate-100 text-slate-600",
};

const ACTION_LABELS: Record<ModerationAudit["action"], string> = {
  ALLOW: "Cho phép",
  SOFT_HIDE: "Chờ duyệt",
  HARD_REJECT: "Từ chối",
  FALLBACK: "Fallback (offline)",
};

function fmtDate(s: string) {
  try { return format(parseISO(s), "dd/MM/yyyy HH:mm:ss", { locale: vi }); } catch { return s; }
}

export default function AdminModerationPage() {
  const [items, setItems] = useState<ModerationAudit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [minScore, setMinScore] = useState<string>("");
  const [handledFilter, setHandledFilter] = useState<"ALL" | "UNHANDLED" | "HANDLED">("ALL");
  const [actionBusyKey, setActionBusyKey] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const queryMinScore = useMemo(() => {
    const parsed = parseFloat(minScore);
    return Number.isFinite(parsed) ? parsed : undefined;
  }, [minScore]);
  const queryHandled = useMemo<boolean | undefined>(() => {
    if (handledFilter === "HANDLED") return true;
    if (handledFilter === "UNHANDLED") return false;
    return undefined;
  }, [handledFilter]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await moderationApi.listAudit(page, size, queryMinScore, queryHandled);
      setItems(data.items);
      setTotalPages(data.totalPages);
      setTotalItems(data.totalItems);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể tải dữ liệu moderation");
    } finally {
      setLoading(false);
    }
  }, [page, queryMinScore, queryHandled, size]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { setPage(0); }, [queryMinScore, queryHandled, size]);

  const counts = useMemo(() => {
    return items.reduce(
      (acc, it) => {
        acc.total++;
        acc[it.action] = (acc[it.action] ?? 0) + 1;
        acc.highestScore = Math.max(acc.highestScore, it.score);
        return acc;
      },
      { total: 0, ALLOW: 0, SOFT_HIDE: 0, HARD_REJECT: 0, FALLBACK: 0, highestScore: 0 } as Record<string, number>
    );
  }, [items]);

  async function handleAdminAction(item: ModerationAudit) {
    const key = `${item.targetType}-${item.targetId}`;
    setActionBusyKey(key);
    setActionMessage(null);
    try {
      if (item.targetType === "POST") {
        await postApi.adminHide(item.targetId);
        setActionMessage(`Đã ẩn bài viết #${item.targetId}`);
      } else {
        await postApi.adminHideComment(item.targetId);
        setActionMessage(`Đã ẩn bình luận #${item.targetId}`);
      }
      await moderationApi.markHandled(item.id);
      setActionMessage((prev) => prev ? `${prev} và đánh dấu đã xử lý.` : "Đã đánh dấu đã xử lý.");
      await load();
    } catch (e) {
      setActionMessage(e instanceof Error ? e.message : "Không thể xử lý nội dung");
    } finally {
      setActionBusyKey(null);
    }
  }

  return (
    <main className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">AI Moderation Audit</h1>
          <p className="text-sm text-slate-500">
            Theo dõi mọi lần model AI phân loại nội dung bài viết & bình luận.
          </p>
        </div>
        <button onClick={() => void load()}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Làm mới
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: "Tổng lượt gọi", value: counts.total ?? 0, color: "text-slate-700" },
          { label: "Cho phép", value: counts.ALLOW ?? 0, color: "text-emerald-600" },
          { label: "Chờ duyệt", value: counts.SOFT_HIDE ?? 0, color: "text-amber-600" },
          { label: "Từ chối", value: counts.HARD_REJECT ?? 0, color: "text-rose-600" },
          { label: "Score cao nhất", value: (counts.highestScore ?? 0).toFixed(2), color: "text-violet-600" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">{s.label}</p>
            <p className={`mt-1 text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <label className="text-sm font-medium text-slate-600">Lọc theo score tối thiểu:</label>
        <input type="number" step="0.05" min="0" max="1" value={minScore}
          onChange={(e) => setMinScore(e.target.value)}
          placeholder="0.0 – 1.0"
          className="h-10 w-32 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-50" />
        <span className="text-xs text-slate-400">Để trống = tất cả. Mặc định production: ≥ 0.5 chờ duyệt, ≥ 0.85 từ chối.</span>
        <select
          value={handledFilter}
          onChange={(e) => setHandledFilter(e.target.value as "ALL" | "UNHANDLED" | "HANDLED")}
          className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-50"
        >
          <option value="ALL">Tất cả</option>
          <option value="UNHANDLED">Chưa xử lý</option>
          <option value="HANDLED">Đã xử lý</option>
        </select>
        <select
          value={size}
          onChange={(e) => setSize(Number(e.target.value))}
          className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-50"
        >
          <option value={10}>10 / trang</option>
          <option value={20}>20 / trang</option>
          <option value={50}>50 / trang</option>
        </select>
        <div className="ml-auto text-sm text-slate-500">
          Tổng: <strong>{totalItems.toLocaleString("vi")}</strong> bản ghi
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}
      {actionMessage ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          {actionMessage}
        </div>
      ) : null}

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3 text-left font-semibold">Thời gian</th>
              <th className="px-4 py-3 text-center font-semibold">Loại</th>
              <th className="px-4 py-3 text-center font-semibold">Target</th>
              <th className="px-4 py-3 text-left font-semibold">Preview</th>
              <th className="px-4 py-3 text-center font-semibold">Score</th>
              <th className="px-4 py-3 text-center font-semibold">Source</th>
              <th className="px-4 py-3 text-center font-semibold">Hành động</th>
              <th className="px-4 py-3 text-center font-semibold">Trạng thái</th>
              <th className="px-4 py-3 text-center font-semibold">Xử lý tay</th>
              <th className="px-4 py-3 text-right font-semibold">Model</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 10 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 w-full animate-pulse rounded bg-slate-100" /></td>
                  ))}
                </tr>
              ))
            ) : items.length === 0 ? (
              <tr><td colSpan={10} className="px-4 py-14 text-center text-sm text-slate-400">Chưa có bản ghi nào.</td></tr>
            ) : (
              items.map((it) => (
                <tr key={it.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{fmtDate(it.createdAt)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600">{it.targetType}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-mono text-xs text-slate-700">#{it.targetId}</span>
                    <p className="text-[10px] text-slate-400">user #{it.authorUserId}</p>
                  </td>
                  <td className="px-4 py-3 max-w-md">
                    <p className="truncate text-xs text-slate-600">{it.contentPreview ?? <em className="text-slate-300">(rỗng)</em>}</p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex flex-col items-center gap-0.5">
                      <span className={`font-mono text-sm font-bold ${it.score >= 0.85 ? "text-rose-600" : it.score >= 0.5 ? "text-amber-600" : "text-emerald-600"}`}>
                        {it.score.toFixed(3)}
                      </span>
                      {it.thresholdReject != null && (
                        <span className="text-[10px] text-slate-400">≥ {it.thresholdReject.toFixed(2)} reject</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      it.source === "AI" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"
                    }`}>{it.source}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${ACTION_STYLES[it.action]}`}>
                      {ACTION_LABELS[it.action]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                      it.handled ? "bg-indigo-100 text-indigo-700" : "bg-amber-100 text-amber-700"
                    }`}>
                      {it.handled ? "Đã xử lý" : "Chưa xử lý"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => void handleAdminAction(it)}
                      disabled={it.handled || actionBusyKey === `${it.targetType}-${it.targetId}`}
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {it.handled
                        ? "Đã xử lý"
                        : actionBusyKey === `${it.targetType}-${it.targetId}`
                        ? "Đang xử lý..."
                        : it.targetType === "POST"
                          ? "Ẩn bài viết"
                          : "Ẩn bình luận"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right text-[10px] text-slate-400 font-mono">
                    {it.modelName}
                    <p className="text-[10px]">{it.inferenceMs}ms</p>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginator */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">Trang {page + 1} / {totalPages}</p>
          <div className="flex gap-1">
            <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40">←</button>
            <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40">→</button>
          </div>
        </div>
      )}
    </main>
  );
}