"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardHeader from "../../components/admin/dashboard/DashboardHeader";
import GrowthCard from "../../components/admin/dashboard/GrowthCard";
import ModerationQueueCard from "../../components/admin/dashboard/ModerationQueueCard";
import ReportsTable from "../../components/admin/dashboard/ReportsTable";
import StatsGrid from "../../components/admin/dashboard/StatsGrid";
import type { QueueItem, ReportItem, Stat } from "../../components/admin/dashboard/types";
import { moderationApi } from "@/lib/api/moderationApi";
import { petApi } from "@/lib/api/petApi";
import { postApi } from "@/lib/api/postApi";
import { adminGetUsers } from "@/lib/api/userApi";

export default function AdminDashboardPage() {
  const [query, setQuery] = useState("");
  const [stats, setStats] = useState<Stat[]>([]);
  const [moderationQueue, setModerationQueue] = useState<QueueItem[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [auditSamples, setAuditSamples] = useState<Array<{ score: number; createdAt: string }>>([]);
  const [trendRange, setTrendRange] = useState<"7d" | "30d" | "date" | "range">("7d");
  const [trendDate, setTrendDate] = useState("");
  const [trendFromDate, setTrendFromDate] = useState("");
  const [trendToDate, setTrendToDate] = useState("");
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false);
  const [reportTypeFilter, setReportTypeFilter] = useState<"ALL" | "Post" | "Comment" | "User">("ALL");
  const [reportStatusFilter, setReportStatusFilter] = useState<"ALL" | "New" | "Reviewing" | "Resolved">("ALL");
  const [reportDateFrom, setReportDateFrom] = useState("");
  const [reportDateTo, setReportDateTo] = useState("");
  const [reportPage, setReportPage] = useState(1);
  const [reportPageSize, setReportPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  function formatRelativeTime(input?: string | null): string {
    if (!input) return "N/A";
    const dt = new Date(input);
    if (Number.isNaN(dt.getTime())) return input;

    const diffMs = Date.now() - dt.getTime();
    if (diffMs < 60_000) return "Vừa xong";
    if (diffMs < 3_600_000) return `${Math.floor(diffMs / 60_000)} phút trước`;
    if (diffMs < 86_400_000) return `${Math.floor(diffMs / 3_600_000)} giờ trước`;
    return `${Math.floor(diffMs / 86_400_000)} ngày trước`;
  }

  function mapReportStatus(status: "PENDING" | "RESOLVED" | "REJECTED"): ReportItem["status"] {
    if (status === "PENDING") return "New";
    if (status === "RESOLVED") return "Resolved";
    return "Reviewing";
  }

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      setLoading(true);
      setError(null);
      try {
        const [allUsers, activeUsersPage, pendingReports, reportDataset, queueAudits, chartAudits, petStats] = await Promise.all([
          adminGetUsers(0, 1),
          adminGetUsers(0, 1, "", true),
          postApi.adminListReports({ page: 0, size: 1, status: "PENDING" }),
          postApi.adminListReports({ page: 0, size: 300 }),
          moderationApi.listAudit(0, 4, 0.25, false),
          moderationApi.listAudit(0, 100),
          petApi.adminGetStats(),
        ]);

        if (cancelled) return;
        const reportItems = reportDataset.content ?? [];
        const usersTotal = allUsers.totalElements ?? 0;
        const activeUsers = activeUsersPage.totalElements ?? 0;
        setAuditSamples(
          chartAudits.items
            .filter((item) => Boolean(item.createdAt))
            .map((item) => ({ score: item.score, createdAt: item.createdAt }))
        );

        setStats([
          {
            label: "Tổng người dùng",
            value: String(usersTotal),
            change: `${usersTotal} tài khoản`,
            up: true,
          },
          {
            label: "Người dùng hoạt động",
            value: String(activeUsers),
            change: `${activeUsers} tài khoản`,
            up: true,
          },
          {
            label: "Tổng thú cưng",
            value: String(petStats.totalPets ?? 0),
            change: `Đang hoạt động: ${petStats.totalActivePets ?? 0}`,
            up: true,
          },
          {
            label: "Báo cáo chờ xử lý",
            value: String(pendingReports.totalElements ?? 0),
            change: `Nhắc lịch quá hạn: ${petStats.overdueReminders ?? 0}`,
            up: (pendingReports.totalElements ?? 0) === 0,
          },
        ]);

        setModerationQueue(
          queueAudits.items.map((item) => ({
            id: `M-${item.id}`,
            title: item.contentPreview?.trim()
              ? `${item.targetType === "POST" ? "Bài viết" : "Bình luận"}: ${item.contentPreview}`
              : `${item.targetType === "POST" ? "Bài viết" : "Bình luận"} #${item.targetId}`,
            author: `user_${item.authorUserId}`,
            risk: item.score >= 0.8 ? "High" : item.score >= 0.5 ? "Medium" : "Low",
            createdAt: formatRelativeTime(item.createdAt),
          }))
        );

        setReports(
          reportItems.map((item) => ({
            id: `R-${item.id}`,
            type: item.targetType === "POST" ? "Post" : item.targetType === "COMMENT" ? "Comment" : "User",
            target:
              item.targetType === "POST"
                ? `post_${item.targetId}`
                : item.targetType === "COMMENT"
                  ? `comment_${item.targetId}`
                  : `user_${item.targetAuthorUserId ?? item.targetId}`,
            reason: item.reason,
            status: mapReportStatus(item.status),
            createdAt: formatRelativeTime(item.createdAt),
            createdAtIso: item.createdAt,
            reporterUserId: item.reporterUserId,
            targetAuthorUserId: item.targetAuthorUserId ?? undefined,
          }))
        );
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Không thể tải dashboard admin");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadDashboard();
    return () => {
      cancelled = true;
    };
  }, [reloadTick]);

  const filteredReports = useMemo(() => {
    const q = query.trim().toLowerCase();
    return reports.filter((r) => {
      if (q) {
        const qMatched =
          r.id.toLowerCase().includes(q) ||
          r.type.toLowerCase().includes(q) ||
          r.target.toLowerCase().includes(q) ||
          r.reason.toLowerCase().includes(q);
        if (!qMatched) return false;
      }
      if (reportTypeFilter !== "ALL" && r.type !== reportTypeFilter) return false;
      if (reportStatusFilter !== "ALL" && r.status !== reportStatusFilter) return false;
      if ((reportDateFrom || reportDateTo) && r.createdAtIso) {
        const created = new Date(r.createdAtIso);
        if (!Number.isNaN(created.getTime())) {
          if (reportDateFrom) {
            const from = new Date(reportDateFrom);
            from.setHours(0, 0, 0, 0);
            if (created < from) return false;
          }
          if (reportDateTo) {
            const to = new Date(reportDateTo);
            to.setHours(23, 59, 59, 999);
            if (created > to) return false;
          }
        }
      }
      return true;
    });
  }, [query, reports, reportDateFrom, reportDateTo, reportStatusFilter, reportTypeFilter]);

  useEffect(() => {
    setReportPage(1);
  }, [query, reportDateFrom, reportDateTo, reportStatusFilter, reportTypeFilter]);

  const totalFilteredReports = filteredReports.length;
  const totalReportPages = Math.max(1, Math.ceil(totalFilteredReports / reportPageSize));
  const safeReportPage = Math.min(reportPage, totalReportPages);
  const paginatedReports = useMemo(() => {
    const start = (safeReportPage - 1) * reportPageSize;
    return filteredReports.slice(start, start + reportPageSize);
  }, [filteredReports, reportPageSize, safeReportPage]);

  const chartWindow = useMemo(() => {
    const now = new Date();
    if (trendRange === "7d" || trendRange === "30d") {
      const days = trendRange === "30d" ? 30 : 7;
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      start.setDate(start.getDate() - (days - 1));
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      return { start, end, valid: true };
    }
    if (trendRange === "date") {
      const day = trendDate ? new Date(trendDate) : new Date();
      if (Number.isNaN(day.getTime())) return { start: null, end: null, valid: false };
      const start = new Date(day);
      start.setHours(0, 0, 0, 0);
      const end = new Date(day);
      end.setHours(23, 59, 59, 999);
      return { start, end, valid: true };
    }
    const start = trendFromDate ? new Date(trendFromDate) : null;
    const end = trendToDate ? new Date(trendToDate) : null;
    if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
      return { start: null, end: null, valid: false };
    }
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end, valid: true };
  }, [trendDate, trendFromDate, trendRange, trendToDate]);

  const chartFilteredReports = useMemo(() => {
    if (!chartWindow.valid || !chartWindow.start || !chartWindow.end) return [] as ReportItem[];
    return reports.filter((r) => {
      if (!r.createdAtIso) return false;
      const created = new Date(r.createdAtIso);
      if (Number.isNaN(created.getTime())) return false;
      return created >= chartWindow.start && created <= chartWindow.end;
    });
  }, [chartWindow.end, chartWindow.start, chartWindow.valid, reports]);

  const chartFilteredAudits = useMemo(() => {
    if (!chartWindow.valid || !chartWindow.start || !chartWindow.end) return [] as Array<{ score: number; createdAt: string }>;
    return auditSamples.filter((sample) => {
      const created = new Date(sample.createdAt);
      if (Number.isNaN(created.getTime())) return false;
      return created >= chartWindow.start && created <= chartWindow.end;
    });
  }, [auditSamples, chartWindow.end, chartWindow.start, chartWindow.valid]);

  const trendChart = useMemo(() => {
    if (!chartWindow.valid || !chartWindow.start || !chartWindow.end) {
      return { labels: ["Chọn ngày"], points: [0], subtitle: "Bộ lọc thời gian chưa hợp lệ" };
    }

    if (trendRange === "date") {
      const labels = Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2, "0")}h`);
      const points = Array.from({ length: 24 }, () => 0);
      chartFilteredReports.forEach((r) => {
        if (!r.createdAtIso) return;
        const dt = new Date(r.createdAtIso);
        if (Number.isNaN(dt.getTime())) return;
        points[dt.getHours()] += 1;
      });
      return {
        labels,
        points,
        subtitle: `Theo giờ trong ngày ${chartWindow.start.toLocaleDateString("vi-VN")} (${chartFilteredReports.length} báo cáo)`,
      };
    }

    const dayCount = Math.max(1, Math.floor((chartWindow.end.getTime() - chartWindow.start.getTime()) / 86_400_000) + 1);
    const labels: string[] = [];
    const points: number[] = [];
    for (let i = 0; i < dayCount; i += 1) {
      const date = new Date(chartWindow.start);
      date.setDate(date.getDate() + i);
      const next = new Date(date);
      next.setDate(next.getDate() + 1);
      labels.push(date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }));
      points.push(
        chartFilteredReports.reduce((count, r) => {
          if (!r.createdAtIso) return count;
          const created = new Date(r.createdAtIso);
          if (Number.isNaN(created.getTime())) return count;
          return created >= date && created < next ? count + 1 : count;
        }, 0)
      );
    }
    return {
      labels,
      points,
      subtitle: `${chartWindow.start.toLocaleDateString("vi-VN")} - ${chartWindow.end.toLocaleDateString("vi-VN")} (${chartFilteredReports.length} báo cáo)`,
    };
  }, [chartFilteredReports, chartWindow.end, chartWindow.start, chartWindow.valid, trendRange]);

  const reportTypeChart = useMemo(() => {
    const postCount = chartFilteredReports.filter((r) => r.type === "Post").length;
    const commentCount = chartFilteredReports.filter((r) => r.type === "Comment").length;
    const userCount = chartFilteredReports.filter((r) => r.type === "User").length;
    return { labels: ["Bài viết", "Bình luận", "Người dùng"], points: [postCount, commentCount, userCount] };
  }, [chartFilteredReports]);

  const reportStatusChart = useMemo(() => {
    const newCount = chartFilteredReports.filter((r) => r.status === "New").length;
    const reviewingCount = chartFilteredReports.filter((r) => r.status === "Reviewing").length;
    const resolvedCount = chartFilteredReports.filter((r) => r.status === "Resolved").length;
    return { labels: ["Mới", "Đang xử lý", "Đã xử lý"], points: [newCount, reviewingCount, resolvedCount] };
  }, [chartFilteredReports]);

  const userChart = useMemo(() => {
    const uniqueReporter = new Set(chartFilteredReports.map((r) => r.reporterUserId).filter(Boolean)).size;
    const uniqueTarget = new Set(chartFilteredReports.map((r) => r.targetAuthorUserId).filter(Boolean)).size;
    return { labels: ["Người report", "Người bị report"], points: [uniqueReporter, uniqueTarget] };
  }, [chartFilteredReports]);

  const auditRiskPoints = useMemo(() => {
    return chartFilteredAudits.reduce(
      (acc, item) => {
        if (item.score >= 0.8) acc[0] += 1;
        else if (item.score >= 0.5) acc[1] += 1;
        else acc[2] += 1;
        return acc;
      },
      [0, 0, 0]
    );
  }, [chartFilteredAudits]);

  function csvEscape(input: string): string {
    const value = input.replace(/"/g, "\"\"");
    return `"${value}"`;
  }

  function handleExportCsv() {
    if (filteredReports.length === 0) return;
    const rows = [
      ["Ma", "Loai", "Doi tuong", "Ly do", "Trang thai", "Thoi gian"],
      ...filteredReports.map((r) => [r.id, r.type, r.target, r.reason, r.status, r.createdAt]),
    ];
    const csv = rows.map((row) => row.map((cell) => csvEscape(String(cell))).join(",")).join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `admin-reports-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <section className="space-y-5">
      <DashboardHeader query={query} setQuery={setQuery} onRefresh={() => setReloadTick((v) => v + 1)} />
      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}
      <StatsGrid stats={stats} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.3fr_1fr]">
        <div className="space-y-2">
          <p className="text-xs text-slate-500">Bộ lọc thời gian này áp dụng cho toàn bộ biểu đồ bên dưới.</p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setTrendRange("7d")}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                trendRange === "7d" ? "bg-rose-500 text-white" : "bg-slate-100 text-slate-700"
              }`}
            >
              7 ngày
            </button>
            <button
              type="button"
              onClick={() => setTrendRange("30d")}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                trendRange === "30d" ? "bg-rose-500 text-white" : "bg-slate-100 text-slate-700"
              }`}
            >
              30 ngày
            </button>
            <button
              type="button"
              onClick={() => setTrendRange("date")}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                trendRange === "date" ? "bg-rose-500 text-white" : "bg-slate-100 text-slate-700"
              }`}
            >
              Ngày cụ thể
            </button>
            <button
              type="button"
              onClick={() => setTrendRange("range")}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                trendRange === "range" ? "bg-rose-500 text-white" : "bg-slate-100 text-slate-700"
              }`}
            >
              Từ ngày - đến ngày
            </button>
            {trendRange === "date" ? (
              <input
                type="date"
                value={trendDate}
                onChange={(e) => setTrendDate(e.target.value)}
                className="h-8 rounded-lg border border-slate-200 px-2 text-xs"
              />
            ) : null}
            {trendRange === "range" ? (
              <>
                <input
                  type="date"
                  value={trendFromDate}
                  onChange={(e) => setTrendFromDate(e.target.value)}
                  className="h-8 rounded-lg border border-slate-200 px-2 text-xs"
                />
                <span className="text-xs text-slate-500">đến</span>
                <input
                  type="date"
                  value={trendToDate}
                  onChange={(e) => setTrendToDate(e.target.value)}
                  className="h-8 rounded-lg border border-slate-200 px-2 text-xs"
                />
              </>
            ) : null}
          </div>
          <GrowthCard
            title="Xu hướng báo cáo vi phạm"
            subtitle={trendChart.subtitle}
            points={trendChart.points}
            labels={trendChart.labels}
          />
        </div>
        <ModerationQueueCard items={moderationQueue} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <GrowthCard title="Thống kê người dùng" subtitle="Người tham gia report trong khoảng lọc" points={userChart.points} labels={userChart.labels} />
        <GrowthCard title="Báo cáo theo loại đối tượng" subtitle="Bài viết, bình luận, người dùng" points={reportTypeChart.points} labels={reportTypeChart.labels} />
        <GrowthCard title="Mức độ rủi ro moderation" subtitle="High / Medium / Low" points={auditRiskPoints} labels={["High", "Medium", "Low"]} />
        <GrowthCard title="Tiến độ xử lý báo cáo" subtitle="Mới / Đang xử lý / Đã xử lý" points={reportStatusChart.points} labels={reportStatusChart.labels} />
      </div>

      <ReportsTable
        reports={paginatedReports}
        onExportCsv={handleExportCsv}
        onToggleAdvancedFilters={() => setAdvancedFiltersOpen((v) => !v)}
        advancedFiltersOpen={advancedFiltersOpen}
      >
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-xs text-slate-600">
            Loại
            <select
              value={reportTypeFilter}
              onChange={(e) => setReportTypeFilter(e.target.value as "ALL" | "Post" | "Comment" | "User")}
              className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-2"
            >
              <option value="ALL">Tất cả</option>
              <option value="Post">Bài viết</option>
              <option value="Comment">Bình luận</option>
              <option value="User">Người dùng</option>
            </select>
          </label>
          <label className="text-xs text-slate-600">
            Trạng thái
            <select
              value={reportStatusFilter}
              onChange={(e) => setReportStatusFilter(e.target.value as "ALL" | "New" | "Reviewing" | "Resolved")}
              className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-2"
            >
              <option value="ALL">Tất cả</option>
              <option value="New">Mới</option>
              <option value="Reviewing">Đang xử lý</option>
              <option value="Resolved">Đã xử lý</option>
            </select>
          </label>
          <label className="text-xs text-slate-600">
            Từ ngày
            <input
              type="date"
              value={reportDateFrom}
              onChange={(e) => setReportDateFrom(e.target.value)}
              className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-2"
            />
          </label>
          <label className="text-xs text-slate-600">
            Đến ngày
            <input
              type="date"
              value={reportDateTo}
              onChange={(e) => setReportDateTo(e.target.value)}
              className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-2"
            />
          </label>
        </div>
        <div className="mt-2">
          <button
            type="button"
            onClick={() => {
              setReportTypeFilter("ALL");
              setReportStatusFilter("ALL");
              setReportDateFrom("");
              setReportDateTo("");
            }}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs hover:bg-slate-100"
          >
            Xóa bộ lọc
          </button>
        </div>
      </ReportsTable>
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
        <p className="text-xs text-slate-600">
          Hiển thị {(safeReportPage - 1) * reportPageSize + 1}-{Math.min(safeReportPage * reportPageSize, totalFilteredReports)} / {totalFilteredReports} báo cáo
        </p>
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-600">
            Mỗi trang
            <select
              value={reportPageSize}
              onChange={(e) => {
                setReportPageSize(Number(e.target.value));
                setReportPage(1);
              }}
              className="ml-2 h-8 rounded-lg border border-slate-200 bg-white px-2"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </label>
          <button
            type="button"
            onClick={() => setReportPage((p) => Math.max(1, p - 1))}
            disabled={safeReportPage <= 1}
            className="rounded-lg border border-slate-200 px-3 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-40"
          >
            Trước
          </button>
          <span className="text-xs text-slate-600">
            Trang {safeReportPage}/{totalReportPages}
          </span>
          <button
            type="button"
            onClick={() => setReportPage((p) => Math.min(totalReportPages, p + 1))}
            disabled={safeReportPage >= totalReportPages}
            className="rounded-lg border border-slate-200 px-3 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-40"
          >
            Sau
          </button>
        </div>
      </div>
      {loading ? <p className="text-xs text-slate-500">Đang tải dữ liệu...</p> : null}
    </section>
  );
}