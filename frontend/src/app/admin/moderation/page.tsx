"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import {
  moderationApi,
  type AiStatusResponse,
  type ModerationAudit,
  type ModerationModelVersion,
  type ModerationSettings,
} from "@/lib/api/moderationApi";
import { postApi } from "@/lib/api/postApi";

type Tab = "overview" | "settings" | "models" | "audit";

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
  FALLBACK: "Fallback",
};

function fmtDate(s?: string | null) {
  if (!s) return "--";
  try {
    return format(parseISO(s), "dd/MM/yyyy HH:mm:ss", { locale: vi });
  } catch {
    return s;
  }
}

export default function AdminModerationPage() {
  const [tab, setTab] = useState<Tab>("overview");
  const [status, setStatus] = useState<AiStatusResponse | null>(null);
  const [models, setModels] = useState<ModerationModelVersion[]>([]);
  const [settingsDraft, setSettingsDraft] = useState<ModerationSettings | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [items, setItems] = useState<ModerationAudit[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [minScore, setMinScore] = useState("");
  const [handledFilter, setHandledFilter] = useState<"ALL" | "UNHANDLED" | "HANDLED">("ALL");
  const [actionBusyKey, setActionBusyKey] = useState<string | null>(null);

  const queryMinScore = useMemo(() => {
    const parsed = parseFloat(minScore);
    return Number.isFinite(parsed) ? parsed : undefined;
  }, [minScore]);
  const queryHandled = useMemo<boolean | undefined>(() => {
    if (handledFilter === "HANDLED") return true;
    if (handledFilter === "UNHANDLED") return false;
    return undefined;
  }, [handledFilter]);

  const loadStatus = useCallback(async () => {
    setPageError(null);
    try {
      const [statusRes, modelRows] = await Promise.all([
        moderationApi.getStatus(),
        moderationApi.listModels(),
      ]);
      setStatus(statusRes);
      setSettingsDraft(statusRes.settings);
      setModels(modelRows);
    } catch (e) {
      setPageError(e instanceof Error ? e.message : "Không thể tải trạng thái AI");
    }
  }, []);

  const loadAudit = useCallback(async () => {
    setLoadingAudit(true);
    setPageError(null);
    try {
      const data = await moderationApi.listAudit(page, size, queryMinScore, queryHandled);
      setItems(data.items);
      setTotalPages(data.totalPages);
      setTotalItems(data.totalItems);
    } catch (e) {
      setPageError(e instanceof Error ? e.message : "Không thể tải nhật ký moderation");
    } finally {
      setLoadingAudit(false);
    }
  }, [page, queryHandled, queryMinScore, size]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    if (tab === "audit") void loadAudit();
  }, [tab, loadAudit]);

  useEffect(() => {
    setPage(0);
  }, [queryMinScore, queryHandled, size]);

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

  async function saveSettings() {
    if (!settingsDraft) return;
    setBusy(true);
    setNotice(null);
    setPageError(null);
    try {
      const saved = await moderationApi.updateSettings(settingsDraft);
      setSettingsDraft(saved);
      setNotice("Đã lưu cấu hình AI. Thay đổi áp dụng ngay cho bài/bình luận mới.");
      await loadStatus();
    } catch (e) {
      setPageError(e instanceof Error ? e.message : "Không thể lưu cấu hình");
    } finally {
      setBusy(false);
    }
  }

  async function activateModel(modelId: number) {
    if (!confirm("Kích hoạt phiên bản này? Ngưỡng runtime sẽ được đồng bộ theo model.")) return;
    setBusy(true);
    setNotice(null);
    setPageError(null);
    try {
      await moderationApi.activateModel(modelId);
      setNotice("Đã kích hoạt phiên bản mô hình và cập nhật ngưỡng runtime.");
      await loadStatus();
    } catch (e) {
      setPageError(e instanceof Error ? e.message : "Không thể kích hoạt mô hình");
    } finally {
      setBusy(false);
    }
  }

  async function handleAdminAction(item: ModerationAudit) {
    const key = `${item.targetType}-${item.targetId}`;
    setActionBusyKey(key);
    setNotice(null);
    try {
      if (item.targetType === "POST") {
        await postApi.adminHide(item.targetId);
        setNotice(`Đã ẩn bài viết #${item.targetId}`);
      } else {
        await postApi.adminHideComment(item.targetId);
        setNotice(`Đã ẩn bình luận #${item.targetId}`);
      }
      await moderationApi.markHandled(item.id);
      setNotice((prev) => (prev ? `${prev} và đánh dấu đã xử lý.` : "Đã đánh dấu đã xử lý."));
      await loadAudit();
    } catch (e) {
      setPageError(e instanceof Error ? e.message : "Không thể xử lý nội dung");
    } finally {
      setActionBusyKey(null);
    }
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Tổng quan" },
    { id: "settings", label: "Cấu hình" },
    { id: "models", label: "Phiên bản model" },
    { id: "audit", label: "Nhật ký kiểm duyệt" },
  ];

  return (
    <main className="space-y-5">
      <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Quản lý AI</h1>
            <p className="mt-1 text-sm text-slate-500">
              Bật/tắt filter, chỉnh ngưỡng, chọn phiên bản model đang active, và theo dõi nhật ký kiểm duyệt.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              void loadStatus();
              if (tab === "audit") void loadAudit();
            }}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Làm mới
          </button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                tab === item.id ? "bg-rose-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      {pageError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{pageError}</div>
      ) : null}
      {notice ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</div>
      ) : null}

      {tab === "overview" ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">AI service</p>
            <p className={`mt-2 text-xl font-bold ${status?.aiService.reachable ? "text-emerald-600" : "text-rose-600"}`}>
              {status?.aiService.reachable ? status.aiService.status : "Offline"}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Text loaded: {status?.aiService.textModelLoaded ? "yes" : "no"} · Image loaded:{" "}
              {status?.aiService.imageModelLoaded ? "yes" : "no"}
            </p>
            {status?.aiService.detail ? <p className="mt-2 text-[11px] text-rose-500">{status.aiService.detail}</p> : null}
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">Filter chữ</p>
            <p className={`mt-2 text-xl font-bold ${status?.settings.textEnabled ? "text-emerald-600" : "text-slate-500"}`}>
              {status?.settings.textEnabled ? "Đang bật" : "Đang tắt"}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Soft ≥ {status?.settings.textAllowThreshold.toFixed(2)} · Hard ≥ {status?.settings.textRejectThreshold.toFixed(2)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">Filter ảnh thú cưng</p>
            <p className={`mt-2 text-xl font-bold ${status?.settings.imageEnabled ? "text-emerald-600" : "text-slate-500"}`}>
              {status?.settings.imageEnabled ? "Đang bật" : "Đang tắt"}
            </p>
            <p className="mt-1 text-xs text-slate-500">Reject non-pet ≥ {status?.settings.imageThreshold.toFixed(2)}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">Model đang active</p>
            <p className="mt-2 text-sm font-semibold text-slate-800">
              Text: {status?.activeTextModel?.modelName || "--"} ({status?.activeTextModel?.version || "--"})
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-800">
              Ảnh: {status?.activeImageModel?.modelName || "--"} ({status?.activeImageModel?.version || "--"})
            </p>
          </div>
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 md:col-span-2 xl:col-span-4">
            <p className="text-sm font-semibold text-slate-800">Phạm vi quản lý hiện tại</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
              <li>Bật/tắt filter chữ & ảnh, chỉnh ngưỡng quyết định — có hiệu lực ngay.</li>
              <li>Chọn phiên bản model active trong registry (đồng bộ ngưỡng runtime).</li>
              <li>File weights thật vẫn nằm trên máy chạy `ai-service`; đổi file model cần deploy/restart service.</li>
              <li>Nhật ký kiểm duyệt dùng để review quyết định AI và xử lý tay.</li>
            </ul>
          </div>
        </section>
      ) : null}

      {tab === "settings" && settingsDraft ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
              <span className="text-sm font-medium text-slate-700">Bật kiểm duyệt chữ</span>
              <input
                type="checkbox"
                checked={settingsDraft.textEnabled}
                onChange={(e) => setSettingsDraft((s) => (s ? { ...s, textEnabled: e.target.checked } : s))}
              />
            </label>
            <label className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
              <span className="text-sm font-medium text-slate-700">Bật kiểm duyệt ảnh thú cưng</span>
              <input
                type="checkbox"
                checked={settingsDraft.imageEnabled}
                onChange={(e) => setSettingsDraft((s) => (s ? { ...s, imageEnabled: e.target.checked } : s))}
              />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="text-sm text-slate-600">
              Soft-hide (chữ) ≥
              <input
                type="number"
                min={0}
                max={1}
                step={0.01}
                value={settingsDraft.textAllowThreshold}
                onChange={(e) =>
                  setSettingsDraft((s) => (s ? { ...s, textAllowThreshold: Number(e.target.value) } : s))
                }
                className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3"
              />
            </label>
            <label className="text-sm text-slate-600">
              Hard-reject (chữ) ≥
              <input
                type="number"
                min={0}
                max={1}
                step={0.01}
                value={settingsDraft.textRejectThreshold}
                onChange={(e) =>
                  setSettingsDraft((s) => (s ? { ...s, textRejectThreshold: Number(e.target.value) } : s))
                }
                className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3"
              />
            </label>
            <label className="text-sm text-slate-600">
              Reject ảnh non-pet ≥
              <input
                type="number"
                min={0}
                max={1}
                step={0.01}
                value={settingsDraft.imageThreshold}
                onChange={(e) =>
                  setSettingsDraft((s) => (s ? { ...s, imageThreshold: Number(e.target.value) } : s))
                }
                className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3"
              />
            </label>
          </div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-slate-500">Cập nhật gần nhất: {fmtDate(settingsDraft.updatedAt)}</p>
            <button
              type="button"
              disabled={busy}
              onClick={() => void saveSettings()}
              className="rounded-xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-600 disabled:opacity-60"
            >
              {busy ? "Đang lưu..." : "Lưu cấu hình"}
            </button>
          </div>
        </section>
      ) : null}

      {tab === "models" ? (
        <section className="space-y-3">
          {models.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-400">
              Chưa có phiên bản model trong registry.
            </div>
          ) : (
            models.map((model) => (
              <article
                key={model.id}
                className={`rounded-2xl border bg-white p-4 shadow-sm ${
                  model.active ? "border-rose-300 ring-1 ring-rose-100" : "border-slate-200"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-slate-900">{model.modelName}</h3>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                        {model.modelType}
                      </span>
                      <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">
                        {model.version}
                      </span>
                      {model.active ? (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                          ACTIVE
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 break-all text-xs text-slate-500">{model.filePath}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Threshold allow/reject: {model.thresholdAllow.toFixed(2)} / {model.thresholdReject.toFixed(2)}
                      {" · "}Tạo: {fmtDate(model.createdAt)}
                      {model.activatedAt ? ` · Active từ: ${fmtDate(model.activatedAt)}` : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={busy || model.active}
                    onClick={() => void activateModel(model.id)}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    {model.active ? "Đang dùng" : "Kích hoạt"}
                  </button>
                </div>
              </article>
            ))
          )}
          <p className="text-xs text-slate-500">
            Lưu ý: kích hoạt đổi registry + ngưỡng runtime. Để AI service load file weights khác, cần cập nhật artifact
            trên server/`MODEL_DIR` rồi restart `ai-service`.
          </p>
        </section>
      ) : null}

      {tab === "audit" ? (
        <section className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {[
              { label: "Tổng (trang)", value: counts.total ?? 0, color: "text-slate-700" },
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

          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <label className="text-sm font-medium text-slate-600">Score tối thiểu</label>
            <input
              type="number"
              step="0.05"
              min="0"
              max="1"
              value={minScore}
              onChange={(e) => setMinScore(e.target.value)}
              className="h-10 w-28 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm"
            />
            <select
              value={handledFilter}
              onChange={(e) => setHandledFilter(e.target.value as "ALL" | "UNHANDLED" | "HANDLED")}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm"
            >
              <option value="ALL">Tất cả</option>
              <option value="UNHANDLED">Chưa xử lý</option>
              <option value="HANDLED">Đã xử lý</option>
            </select>
            <select
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm"
            >
              <option value={10}>10 / trang</option>
              <option value={20}>20 / trang</option>
              <option value={50}>50 / trang</option>
            </select>
            <div className="ml-auto text-sm text-slate-500">
              Tổng: <strong>{totalItems.toLocaleString("vi")}</strong>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full min-w-[960px] text-sm">
              <thead>
                <tr className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3 text-left">Thời gian</th>
                  <th className="px-4 py-3 text-center">Loại</th>
                  <th className="px-4 py-3 text-left">Preview</th>
                  <th className="px-4 py-3 text-center">Score</th>
                  <th className="px-4 py-3 text-center">Hành động</th>
                  <th className="px-4 py-3 text-center">Xử lý</th>
                  <th className="px-4 py-3 text-right">Model</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingAudit ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                      Đang tải...
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                      Chưa có bản ghi.
                    </td>
                  </tr>
                ) : (
                  items.map((it) => (
                    <tr key={it.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{fmtDate(it.createdAt)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600">
                          {it.targetType} #{it.targetId}
                        </span>
                      </td>
                      <td className="px-4 py-3 max-w-sm">
                        <p className="truncate text-xs text-slate-600">{it.contentPreview || "(rỗng)"}</p>
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-sm font-bold">{it.score.toFixed(3)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${ACTION_STYLES[it.action]}`}>
                          {ACTION_LABELS[it.action]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => void handleAdminAction(it)}
                          disabled={it.handled || actionBusyKey === `${it.targetType}-${it.targetId}`}
                          className="rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-semibold disabled:opacity-60"
                        >
                          {it.handled
                            ? "Đã xử lý"
                            : actionBusyKey === `${it.targetType}-${it.targetId}`
                              ? "..."
                              : it.targetType === "POST"
                                ? "Ẩn bài"
                                : "Ẩn comment"}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right text-[10px] font-mono text-slate-400">
                        {it.modelName}
                        <p>{it.inferenceMs}ms</p>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 ? (
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">
                Trang {page + 1} / {totalPages}
              </p>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm disabled:opacity-40"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                  disabled={page >= totalPages - 1}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm disabled:opacity-40"
                >
                  →
                </button>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}
    </main>
  );
}
