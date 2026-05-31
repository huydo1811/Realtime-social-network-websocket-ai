"use client";

import { useEffect, useMemo, useState } from "react";
import { adminApi } from "@/lib/api/adminApi";
import type { AdminCallEvent, AdminCallSession } from "@/types/admin";

const PAGE_SIZE = 12;

function formatDate(value?: string | null): string {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleString("vi-VN");
}

export default function AdminCallPage() {
  const [loading, setLoading] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [sessions, setSessions] = useState<AdminCallSession[]>([]);
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const [events, setEvents] = useState<AdminCallEvent[]>([]);

  const [userIdInput, setUserIdInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const parsedUserId = useMemo(() => {
    const n = Number(userIdInput);
    return Number.isFinite(n) && n > 0 ? n : undefined;
  }, [userIdInput]);

  const loadSessions = async (nextPage = page) => {
    setLoading(true);
    setError(null);
    setNotice(null);
    try {
      const data = await adminApi.listCallSessions({
        page: nextPage,
        size: PAGE_SIZE,
        userId: parsedUserId,
        status: statusFilter === "ALL" ? undefined : statusFilter,
      });
      setSessions(data.content ?? []);
      setTotalPages(Math.max(1, data.totalPages ?? 1));
      setPage(data.number ?? nextPage);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể tải lịch sử cuộc gọi");
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const loadEvents = async (callId: string) => {
    setActiveCallId(callId);
    setLoadingEvents(true);
    setError(null);
    setNotice(null);
    try {
      const data = await adminApi.listCallEvents(callId);
      setEvents(data);
      if (data.length === 0) {
        setNotice("Call này chưa có event log.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể tải timeline");
      setEvents([]);
    } finally {
      setLoadingEvents(false);
    }
  };

  useEffect(() => {
    void loadSessions(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  return (
    <section className="space-y-4">
      <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Quản lý cuộc gọi</h1>
        <p className="mt-1 text-sm text-slate-500">
          Theo dõi lịch sử call giữa user, lọc theo trạng thái, mở timeline event theo từng callId.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <input
            value={userIdInput}
            onChange={(e) => setUserIdInput(e.target.value)}
            placeholder="Lọc theo userId (caller/callee)..."
            className="h-10 min-w-[240px] rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-rose-300"
          />
          <select
            value={statusFilter}
            onChange={(e) => {
              setPage(0);
              setStatusFilter(e.target.value);
            }}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-rose-300"
          >
            <option value="ALL">Mọi trạng thái</option>
            <option value="INVITING">INVITING</option>
            <option value="RINGING">RINGING</option>
            <option value="CONNECTED">CONNECTED</option>
            <option value="ENDED">ENDED</option>
            <option value="CANCELED">CANCELED</option>
            <option value="REJECTED">REJECTED</option>
            <option value="TIMEOUT">TIMEOUT</option>
          </select>
          <button
            type="button"
            onClick={() => void loadSessions(0)}
            disabled={loading}
            className="rounded-xl bg-rose-500 px-4 text-sm font-semibold text-white hover:bg-rose-600 disabled:opacity-60"
          >
            {loading ? "Đang tải..." : "Tìm"}
          </button>
        </div>
      </header>

      {(error || notice) && (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm">
          {error ? <p className="text-rose-600">{error}</p> : null}
          {notice ? <p className="text-emerald-600">{notice}</p> : null}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_1fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between text-xs text-slate-500">
            <span>
              Trang {page + 1}/{totalPages}
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                disabled={page <= 0 || loading}
                onClick={() => void loadSessions(page - 1)}
                className="rounded-md border border-slate-200 px-2 py-0.5 disabled:opacity-50"
              >
                ←
              </button>
              <button
                type="button"
                disabled={page >= totalPages - 1 || loading}
                onClick={() => void loadSessions(page + 1)}
                className="rounded-md border border-slate-200 px-2 py-0.5 disabled:opacity-50"
              >
                →
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b text-left text-slate-500">
                  <th className="py-2 pr-2">Call ID</th>
                  <th className="py-2 pr-2">Caller</th>
                  <th className="py-2 pr-2">Callee</th>
                  <th className="py-2 pr-2">Media</th>
                  <th className="py-2 pr-2">Status</th>
                  <th className="py-2 pr-2">Bắt đầu</th>
                  <th className="py-2 pr-2">Kết thúc</th>
                  <th className="py-2 pr-2">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {sessions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      {loading ? "Đang tải dữ liệu..." : "Không có dữ liệu"}
                    </td>
                  </tr>
                ) : (
                  sessions.map((session) => (
                    <tr key={session.id} className="border-b border-slate-100">
                      <td className="py-2 pr-2 font-medium text-slate-700">{session.callId}</td>
                      <td className="py-2 pr-2">{session.callerId}</td>
                      <td className="py-2 pr-2">{session.calleeId}</td>
                      <td className="py-2 pr-2">{session.mediaType}</td>
                      <td className="py-2 pr-2">{session.status}</td>
                      <td className="py-2 pr-2">{formatDate(session.startedAt)}</td>
                      <td className="py-2 pr-2">{formatDate(session.endedAt)}</td>
                      <td className="py-2 pr-2">
                        <button
                          type="button"
                          onClick={() => void loadEvents(session.callId)}
                          className="rounded-md bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                        >
                          Xem timeline
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Timeline sự kiện</h2>
          <p className="mt-1 text-xs text-slate-500">
            {activeCallId ? `callId: ${activeCallId}` : "Chọn một call để xem log event"}
          </p>
          <div className="mt-3 max-h-[56vh] space-y-2 overflow-y-auto pr-1">
            {loadingEvents ? (
              <p className="text-sm text-slate-400">Đang tải timeline...</p>
            ) : events.length === 0 ? (
              <p className="text-sm text-slate-400">Chưa có sự kiện để hiển thị.</p>
            ) : (
              events.map((event) => (
                <article key={event.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-slate-700">{event.eventType}</p>
                    <span className="text-[11px] text-slate-400">{formatDate(event.occurredAt)}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">Actor: {event.actorId ?? "--"}</p>
                  <pre className="mt-2 overflow-x-auto rounded-md bg-white p-2 text-[11px] text-slate-600">
                    {event.payload || "{}"}
                  </pre>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </section>
  );
}
