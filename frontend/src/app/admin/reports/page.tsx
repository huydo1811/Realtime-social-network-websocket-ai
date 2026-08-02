"use client";

import { useEffect, useState } from "react";
import { postApi } from "@/lib/api/postApi";
import type { ContentReportDto, ContentReportStatus } from "@/types/post";
import ReportRejectModal from "@/components/user/profile/ReportRejectModal";

const PAGE_SIZE = 20;

function formatDate(value?: string | null): string {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleString("vi-VN");
}

export default function AdminReportsPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [reports, setReports] = useState<ContentReportDto[]>([]);
  const [statusFilter, setStatusFilter] = useState<"ALL" | ContentReportStatus>("PENDING");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [resolveModal, setResolveModal] = useState<{
    open: boolean;
    reportId?: number;
    accept?: boolean;
  }>({ open: false });
  const [resolveBusy, setResolveBusy] = useState(false);

  async function load(nextPage = 0) {
    setLoading(true);
    setError(null);
    try {
      const data = await postApi.adminListReports({
        page: nextPage,
        size: PAGE_SIZE,
        status: statusFilter,
      });
      setReports(data.content ?? []);
      setPage(data.number ?? nextPage);
      setTotalPages(Math.max(1, data.totalPages ?? 1));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể tải danh sách báo cáo");
      setReports([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  async function resolve(reportId: number, accept: boolean, note?: string) {
    setResolveBusy(true);
    setError(null);
    setNotice(null);
    try {
      const updated = accept
        ? await postApi.adminResolveReport(reportId, note || undefined)
        : await postApi.adminRejectReport(reportId, note || undefined);
      setReports((prev) => prev.map((item) => (item.id === reportId ? updated : item)));
      setNotice(
        accept
          ? updated.targetType === "GROUP"
            ? "Duyệt báo cáo: nhóm vi phạm đã được xóa."
            : "Duyệt báo cáo: nội dung đã được xử lý ẩn bởi quản trị viên."
          : "Từ chối báo cáo: nội dung được giữ nguyên, log vẫn được lưu."
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể cập nhật báo cáo");
    } finally {
      setResolveBusy(false);
    }
  }

  return (
    <section className="space-y-4">
      <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Báo cáo nội dung thủ công</h1>
        <p className="mt-1 text-sm text-slate-500">
          Quản trị viên duyệt báo cáo bài viết, bình luận và nhóm. Duyệt báo cáo nhóm sẽ xóa nhóm vi phạm.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as "ALL" | ContentReportStatus)
            }
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-rose-300"
          >
            <option value="PENDING">PENDING</option>
            <option value="ALL">ALL</option>
            <option value="RESOLVED">RESOLVED</option>
            <option value="REJECTED">REJECTED</option>
          </select>
          <button
            type="button"
            onClick={() => void load(0)}
            className="rounded-xl bg-rose-500 px-4 text-sm font-semibold text-white hover:bg-rose-600"
          >
            Tải lại
          </button>
        </div>
      </header>

      {(error || notice) && (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm">
          {error ? <p className="text-rose-600">{error}</p> : null}
          {notice ? <p className="text-emerald-600">{notice}</p> : null}
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
          <span>Trang {page + 1}/{totalPages}</span>
          <div className="flex gap-1">
            <button
              type="button"
              disabled={loading || page <= 0}
              onClick={() => void load(page - 1)}
              className="rounded-md border border-slate-200 px-2 py-0.5 disabled:opacity-50"
            >
              ←
            </button>
            <button
              type="button"
              disabled={loading || page >= totalPages - 1}
              onClick={() => void load(page + 1)}
              className="rounded-md border border-slate-200 px-2 py-0.5 disabled:opacity-50"
            >
              →
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead>
              <tr className="border-b text-left text-slate-500">
                <th className="py-2 pr-2">ID</th>
                <th className="py-2 pr-2">Loại</th>
                <th className="py-2 pr-2">Target</th>
                <th className="py-2 pr-2">Reporter</th>
                <th className="py-2 pr-2">Lý do</th>
                <th className="py-2 pr-2">Nội dung bị báo cáo</th>
                <th className="py-2 pr-2">Trạng thái</th>
                <th className="py-2 pr-2">Tạo lúc</th>
                <th className="py-2 pr-2">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {reports.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    {loading ? "Đang tải..." : "Không có dữ liệu"}
                  </td>
                </tr>
              ) : (
                reports.map((report) => (
                  <tr key={report.id} className="border-b border-slate-100 align-top">
                    <td className="py-2 pr-2 font-medium text-slate-700">#{report.id}</td>
                    <td className="py-2 pr-2">
                      <span
                        className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                          report.targetType === "GROUP"
                            ? "bg-violet-50 text-violet-700"
                            : report.targetType === "COMMENT"
                              ? "bg-sky-50 text-sky-700"
                              : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {report.targetType === "GROUP"
                          ? "Nhóm"
                          : report.targetType === "COMMENT"
                            ? "Bình luận"
                            : "Bài viết"}
                      </span>
                    </td>
                    <td className="py-2 pr-2">
                      {report.targetType === "GROUP" ? (
                        <>
                          Nhóm #{report.targetId}
                          <div className="mt-1">
                            <a
                              href={`/admin/groups`}
                              className="text-xs font-medium text-rose-600 hover:underline"
                            >
                              Mở quản lý nhóm
                            </a>
                          </div>
                        </>
                      ) : (
                        <>
                          {report.targetType} #{report.targetId}
                          {report.postId ? <div className="text-xs text-slate-500">Post #{report.postId}</div> : null}
                        </>
                      )}
                    </td>
                    <td className="py-2 pr-2">User #{report.reporterUserId}</td>
                    <td className="py-2 pr-2 max-w-[280px] whitespace-pre-wrap">{report.reason}</td>
                    <td className="py-2 pr-2 max-w-[300px] text-xs text-slate-600">
                      <p>
                        Tác giả:{" "}
                        <span className="font-semibold text-slate-800">
                          {report.targetAuthorUserId ? `User #${report.targetAuthorUserId}` : "--"}
                        </span>
                      </p>
                      <p className="mt-1 whitespace-pre-wrap">
                        Nội dung: {(report.targetContent || "[Không tải được nội dung]").slice(0, 180)}
                      </p>
                      {report.targetType === "COMMENT" && report.relatedPostContent ? (
                        <p className="mt-1 text-slate-500">
                          Bài viết liên quan: {report.relatedPostContent.slice(0, 140)}
                        </p>
                      ) : null}
                      {report.targetType === "GROUP" ? (
                        <p className="mt-1 text-violet-600">
                          Báo cáo nhóm — duyệt sẽ xóa toàn bộ nhóm.
                        </p>
                      ) : null}
                    </td>
                    <td className="py-2 pr-2">
                      <span
                        className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                          report.status === "PENDING"
                            ? "bg-amber-50 text-amber-700"
                            : report.status === "RESOLVED"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {report.status}
                      </span>
                    </td>
                    <td className="py-2 pr-2">{formatDate(report.createdAt)}</td>
                    <td className="py-2 pr-2">
                      <div className="flex flex-col gap-1.5">
                        <button
                          type="button"
                          disabled={report.status !== "PENDING"}
                          onClick={() =>
                            void resolve(
                              report.id,
                              true,
                              report.targetType === "GROUP"
                                ? "Duyệt: xóa nhóm vi phạm"
                                : "Duyệt: ẩn nội dung vi phạm"
                            )
                          }
                          className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                        >
                          {report.targetType === "GROUP" ? "Duyệt (xóa nhóm)" : "Duyệt (ẩn nội dung)"}
                        </button>
                        <button
                          type="button"
                          disabled={report.status !== "PENDING"}
                          onClick={() =>
                            setResolveModal({ open: true, reportId: report.id, accept: false })
                          }
                          className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-50"
                        >
                          Từ chối (giữ nguyên)
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <ReportRejectModal
        open={resolveModal.open}
        submitting={resolveBusy}
        onClose={() => setResolveModal({ open: false })}
        onSubmit={async (note) => {
          if (!resolveModal.reportId || resolveModal.accept == null) return;
          await resolve(resolveModal.reportId, resolveModal.accept, note);
          setResolveModal({ open: false });
        }}
      />
    </section>
  );
}
