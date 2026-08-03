"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { adminApi } from "@/lib/api/adminApi";
import type { AdminOperationAuditLog } from "@/types/admin";

const DEFAULT_PAGE_SIZE = 25;

function formatDate(value?: string | null): string {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleString("vi-VN");
}

function methodBadgeClass(method?: string | null): string {
  const m = (method || "").toUpperCase();
  if (m === "DELETE") return "bg-rose-50 text-rose-700";
  if (m === "POST") return "bg-emerald-50 text-emerald-700";
  if (m === "PUT" || m === "PATCH") return "bg-amber-50 text-amber-700";
  if (m === "GET") return "bg-sky-50 text-sky-700";
  if (m === "VISIT") return "bg-violet-50 text-violet-700";
  return "bg-slate-100 text-slate-700";
}

function mapHttpMethodLabel(method?: string | null): string {
  const m = (method || "").toUpperCase();
  if (m === "GET") return "Xem";
  if (m === "POST") return "Thêm";
  if (m === "PUT" || m === "PATCH") return "Sửa";
  if (m === "DELETE") return "Xóa";
  if (m === "VISIT") return "Mở trang";
  return method || "--";
}

function mapResourceTypeLabel(resourceType?: string | null): string {
  const key = (resourceType || "").toLowerCase();
  const map: Record<string, string> = {
    users: "Người dùng",
    user: "Người dùng",
    posts: "Bài viết",
    post: "Bài viết",
    reports: "Báo cáo nội dung",
    report: "Báo cáo nội dung",
    pets: "Thú cưng",
    pet: "Thú cưng",
    groups: "Nhóm cộng đồng",
    group: "Nhóm cộng đồng",
    friendships: "Bạn bè",
    friendship: "Bạn bè",
    follows: "Bạn bè",
    chat: "Tin nhắn",
    conversations: "Tin nhắn",
    messages: "Tin nhắn",
    calls: "Cuộc gọi",
    call: "Cuộc gọi",
    moderation: "Quản lý AI",
    audit: "Nhật ký thao tác",
    trang_admin: "Trang quản trị",
  };
  return map[key] || resourceType || "--";
}

function buildPageNumbers(current: number, total: number): number[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i);
  const pages = new Set<number>([0, total - 1, current]);
  if (current > 0) pages.add(current - 1);
  if (current < total - 1) pages.add(current + 1);
  if (current <= 2) {
    pages.add(1);
    pages.add(2);
  }
  if (current >= total - 3) {
    pages.add(total - 2);
    pages.add(total - 3);
  }
  return Array.from(pages).sort((a, b) => a - b);
}

function csvEscape(value: string | number | null | undefined): string {
  const raw = value == null ? "" : String(value);
  return `"${raw.replace(/"/g, '""')}"`;
}

export default function AdminAuditPage() {
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [rows, setRows] = useState<AdminOperationAuditLog[]>([]);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [adminUserIdInput, setAdminUserIdInput] = useState("");
  const [httpMethod, setHttpMethod] = useState("ALL");
  const [appliedFilters, setAppliedFilters] = useState<{
    from?: string;
    to?: string;
    adminUserId?: number;
    httpMethod?: string;
  }>({});

  const buildFiltersFromForm = useCallback(() => {
    const trimmedAdmin = adminUserIdInput.trim();
    const adminUserId = trimmedAdmin ? Number(trimmedAdmin) : undefined;
    return {
      from: fromDate || undefined,
      to: toDate || undefined,
      adminUserId: adminUserId != null && Number.isFinite(adminUserId) ? adminUserId : undefined,
      httpMethod: httpMethod === "ALL" ? undefined : httpMethod,
    };
  }, [fromDate, toDate, adminUserIdInput, httpMethod]);

  const load = useCallback(async (nextPage = 0, size = pageSize) => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.listOperationAuditLogs({
        page: nextPage,
        size,
        ...appliedFilters,
      });
      setRows(data.items ?? []);
      setPage(data.page ?? nextPage);
      setTotalPages(Math.max(1, data.totalPages ?? 1));
      setTotal(data.total ?? 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể tải nhật ký thao tác");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [pageSize, appliedFilters]);

  useEffect(() => {
    void load(0, pageSize);
  }, [load, pageSize]);

  const pageNumbers = useMemo(() => buildPageNumbers(page, totalPages), [page, totalPages]);

  const handleApplyFilters = () => {
    setAppliedFilters(buildFiltersFromForm());
    setPage(0);
  };

  const handleExportCsv = async () => {
    setExporting(true);
    setError(null);
    setNotice(null);
    try {
      const data = await adminApi.listOperationAuditLogs({
        page: 0,
        size: 1000,
        ...appliedFilters,
      });
      const items = data.items ?? [];
      const header = [
        "ID",
        "AdminUserId",
        "PhuongThuc",
        "HanhDong",
        "TaiNguyen",
        "ResourceId",
        "ChiTiet",
        "DuongDan",
        "IP",
        "ThoiGian",
      ];
      const lines = [
        header.join(","),
        ...items.map((row) =>
          [
            row.id,
            row.adminUserId,
            csvEscape(mapHttpMethodLabel(row.httpMethod)),
            csvEscape(row.action),
            csvEscape(mapResourceTypeLabel(row.resourceType)),
            csvEscape(row.resourceId),
            csvEscape(row.detail),
            csvEscape(row.requestPath),
            csvEscape(row.ipAddress),
            csvEscape(formatDate(row.createdAt)),
          ].join(","),
        ),
      ];
      const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `admin-audit-${appliedFilters.from || "all"}-${appliedFilters.to || "all"}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setNotice(`Đã xuất ${items.length.toLocaleString("vi-VN")} bản ghi CSV (theo bộ lọc hiện tại).`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể xuất CSV");
    } finally {
      setExporting(false);
    }
  };

  return (
    <section className="space-y-4">
      <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Nhật ký thao tác quản trị</h1>
        <p className="mt-1 text-sm text-slate-500">
          Ghi lại các thao tác admin trên hệ thống (chỉ thêm mới, không thể xóa hoặc sửa).
        </p>

        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-xs text-slate-600">
            Từ ngày
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-rose-300"
            />
          </label>
          <label className="text-xs text-slate-600">
            Đến ngày
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-rose-300"
            />
          </label>
          <label className="text-xs text-slate-600">
            ID quản trị viên
            <input
              type="number"
              min={1}
              value={adminUserIdInput}
              onChange={(e) => setAdminUserIdInput(e.target.value)}
              placeholder="Ví dụ: 1"
              className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-rose-300"
            />
          </label>
          <label className="text-xs text-slate-600">
            Phương thức
            <select
              value={httpMethod}
              onChange={(e) => setHttpMethod(e.target.value)}
              className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-rose-300"
            >
              <option value="ALL">Tất cả</option>
              <option value="GET">Xem (GET)</option>
              <option value="POST">Thêm (POST)</option>
              <option value="PUT">Sửa (PUT)</option>
              <option value="PATCH">Sửa (PATCH)</option>
              <option value="DELETE">Xóa (DELETE)</option>
              <option value="VISIT">Mở trang (VISIT)</option>
            </select>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleApplyFilters}
            disabled={loading}
            className="rounded-xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-600 disabled:opacity-60"
          >
            {loading ? "Đang tải..." : "Áp dụng bộ lọc"}
          </button>
          <button
            type="button"
            onClick={() => void load(page, pageSize)}
            disabled={loading}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            Tải lại
          </button>
          <button
            type="button"
            onClick={() => void handleExportCsv()}
            disabled={exporting || loading}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            {exporting ? "Đang xuất..." : "Xuất CSV"}
          </button>
          <span className="text-xs text-slate-500">Tổng {total.toLocaleString("vi-VN")} bản ghi</span>
          <label className="text-xs text-slate-600">
            Mỗi trang
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(0);
              }}
              className="ml-2 h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </label>
        </div>
      </header>

      {error || notice ? (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
          {error ? <p className="text-rose-700">{error}</p> : null}
          {notice ? <p className="text-emerald-700">{notice}</p> : null}
        </div>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <span>Trang {page + 1} / {totalPages}</span>
          <div className="flex flex-wrap items-center gap-1">
            <button
              type="button"
              disabled={loading || page <= 0}
              onClick={() => void load(page - 1, pageSize)}
              className="rounded-md border border-slate-200 px-2.5 py-1 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Trước
            </button>
            {pageNumbers.map((p, idx) => {
              const prev = pageNumbers[idx - 1];
              const showEllipsis = prev != null && p - prev > 1;
              return (
                <span key={p} className="flex items-center gap-1">
                  {showEllipsis ? <span className="px-1 text-slate-400">…</span> : null}
                  <button
                    type="button"
                    disabled={loading || p === page}
                    onClick={() => void load(p, pageSize)}
                    className={`min-w-[2rem] rounded-md border px-2 py-1 ${
                      p === page
                        ? "border-rose-300 bg-rose-50 font-semibold text-rose-700"
                        : "border-slate-200 hover:bg-slate-50"
                    } disabled:cursor-not-allowed disabled:opacity-40`}
                  >
                    {p + 1}
                  </button>
                </span>
              );
            })}
            <button
              type="button"
              disabled={loading || page >= totalPages - 1}
              onClick={() => void load(page + 1, pageSize)}
              className="rounded-md border border-slate-200 px-2.5 py-1 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Sau
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead>
              <tr className="border-b text-left text-slate-500">
                <th className="py-2 pr-2">ID</th>
                <th className="py-2 pr-2">Quản trị viên</th>
                <th className="py-2 pr-2">Phương thức</th>
                <th className="py-2 pr-2">Hành động</th>
                <th className="py-2 pr-2">Tài nguyên</th>
                <th className="py-2 pr-2">Chi tiết</th>
                <th className="py-2 pr-2">IP</th>
                <th className="py-2 pr-2">Thời gian</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    {loading ? "Đang tải..." : "Không có nhật ký theo bộ lọc"}
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="border-b border-slate-100 align-top">
                    <td className="py-2 pr-2 font-medium text-slate-700">#{row.id}</td>
                    <td className="py-2 pr-2">Quản trị viên #{row.adminUserId}</td>
                    <td className="py-2 pr-2">
                      <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${methodBadgeClass(row.httpMethod)}`}>
                        {mapHttpMethodLabel(row.httpMethod)}
                      </span>
                    </td>
                    <td className="py-2 pr-2 max-w-[220px] break-all text-slate-800">{row.action}</td>
                    <td className="py-2 pr-2 text-xs text-slate-600">
                      {row.resourceType ? (
                        <>
                          {mapResourceTypeLabel(row.resourceType)}
                          {row.resourceId ? ` #${row.resourceId}` : ""}
                        </>
                      ) : (
                        "--"
                      )}
                    </td>
                    <td className="py-2 pr-2 max-w-[280px] whitespace-pre-wrap text-xs text-slate-600">
                      {row.detail || row.requestPath || "--"}
                    </td>
                    <td className="py-2 pr-2 text-xs text-slate-500">{row.ipAddress || "--"}</td>
                    <td className="py-2 pr-2 text-xs text-slate-500">{formatDate(row.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
