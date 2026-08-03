"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { format, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import { petApi } from "@/lib/api/petApi";
import { adminGetUsers, AdminUserDto } from "@/lib/api/userApi";
import {
  PetDiagnosisDto,
} from "@/types/petDiagnosis";
import { PetWalkSessionDto } from "@/types/petWalk";
import { PetVisibility } from "@/types/pet";
import { PetHealthReminderDto } from "@/types/petHealth";
import { PetDto } from "@/types/pet";

type Tab = "pets" | "diagnoses" | "walks" | "reminders";
type ScopeMode = "user" | "search" | "all";

type Stats = {
  totalPets: number;
  totalActivePets: number;
  totalWalkSessions: number;
  totalDiagnoses: number;
  pendingReminders: number;
  overdueReminders: number;
};

type UserSearchItem = AdminUserDto & { id: number; fullName: string; role: string; active?: boolean; avatarUrl?: string };

type UserPetsSummary = {
  userId: number;
  fullName: string;
  username: string;
  avatarUrl: string | null;
  totalPets: number;
  activePets: number;
  pendingReminders: number;
  pets: PetDto[];
};

const PET_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Đang hoạt động",
  INACTIVE: "Ngừng hoạt động",
  DECEASED: "Đã mất",
};

const SEVERITY_LABELS: Record<string, string> = {
  LOW: "Thấp",
  MODERATE: "Trung bình",
  HIGH: "Cao",
  EMERGENCY: "Khẩn cấp",
};

const WALK_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Đang đi",
  FINISHED: "Hoàn thành",
  CANCELLED: "Đã hủy",
};

const VISIBILITY_LABELS: Record<string, string> = {
  PUBLIC: "Công khai",
  FRIENDS: "Bạn bè",
  PRIVATE: "Riêng tư",
};

const REMINDER_STATUS_LABELS: Record<string, string> = {
  PENDING: "Đang chờ",
  COMPLETED: "Hoàn thành",
  DISMISSED: "Đã bỏ qua",
};

const SPECIES_LABELS: Record<string, string> = {
  DOG: "Chó", CAT: "Mèo", BIRD: "Chim", RABBIT: "Thỏ",
  HAMSTER: "Hamster", FISH: "Cá", REPTILE: "Bò sát", OTHER: "Khác",
};

function fmtDate(d: string) {
  try { return format(parseISO(d), "dd/MM/yyyy", { locale: vi }); } catch { return d; }
}
function fmtDateTime(d: string) {
  try { return format(parseISO(d), "dd/MM/yyyy HH:mm", { locale: vi }); } catch { return d; }
}

function SkeletonRows({ cols }: { cols: number }) {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i}>
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j} className="px-4 py-3"><div className="h-4 w-full animate-pulse rounded bg-slate-100" /></td>
          ))}
        </tr>
      ))}
    </>
  );
}

export default function AdminPetPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // ── User-scope state ────────────────────────────────────────────────────────
  const [scope, setScope] = useState<ScopeMode>("user");
  const [userQuery, setUserQuery] = useState("");
  const [userResults, setUserResults] = useState<UserSearchItem[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserPetsSummary | null>(null);
  const [loadingSelectedUser, setLoadingSelectedUser] = useState(false);
  const [tab, setTab] = useState<Tab>("pets");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [items, setItems] = useState<PetDto[] | PetDiagnosisDto[] | PetWalkSessionDto[] | PetHealthReminderDto[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Search-scope state ─────────────────────────────────────────────────────
  const [petQuery, setPetQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PetDto[]>([]);
  const [searchingPets, setSearchingPets] = useState(false);
  const [petSearchError, setPetSearchError] = useState<string | null>(null);

  // ── All-scope state (only enabled when explicitly toggled) ─────────────────
  const [allPets, setAllPets] = useState<PetDto[]>([]);
  const [allDiagnoses, setAllDiagnoses] = useState<PetDiagnosisDto[]>([]);
  const [allWalks, setAllWalks] = useState<PetWalkSessionDto[]>([]);
  const [allReminders, setAllReminders] = useState<PetHealthReminderDto[]>([]);
  const [loadingAll, setLoadingAll] = useState(false);
  const [allPage, setAllPage] = useState(0);
  const [allTotalPages, setAllTotalPages] = useState(1);
  const [confirmAll, setConfirmAll] = useState(false);

  const pageSize = 15;

  // ── Loaders ─────────────────────────────────────────────────────────────────
  const loadStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const data = await petApi.adminGetStats();
      setStats(data);
    } catch (e) {
      console.error("Lỗi tải stats:", e);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  // Debounced user search
  useEffect(() => {
    if (scope !== "user") return;
    if (!userQuery.trim()) { setUserResults([]); return; }
    const t = setTimeout(async () => {
      setSearchingUsers(true);
      try {
        const resp = await adminGetUsers(0, 10, userQuery.trim());
        const items = (resp.content || []) as UserSearchItem[];
        setUserResults(items);
      } catch (e) {
        setUserResults([]);
        setError(e instanceof Error ? e.message : "Lỗi tìm người dùng");
      } finally {
        setSearchingUsers(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [userQuery, scope]);

  const selectUser = useCallback(async (user: UserSearchItem) => {
    setLoadingSelectedUser(true);
    setError(null);
    setSelectedUser(null);
    setItems([]);
    setTab("pets");
    setPage(0);
    try {
      const data = await petApi.adminGetUserPets(user.id);
      setSelectedUser(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi tải thông tin user");
    } finally {
      setLoadingSelectedUser(false);
    }
  }, []);

  const loadUserScopedData = useCallback(async () => {
    if (!selectedUser) return;
    setLoadingItems(true);
    setError(null);
    try {
      if (tab === "pets") {
        const r = await petApi.adminListPetsByOwner(selectedUser.userId, page, pageSize);
        setItems(r.items);
        setTotalPages(r.totalPages);
      } else if (tab === "diagnoses") {
        const r = await petApi.adminListDiagnosesByOwner(selectedUser.userId, page, pageSize);
        setItems(r.items);
        setTotalPages(r.totalPages);
      } else if (tab === "walks") {
        const r = await petApi.adminListWalksByOwner(selectedUser.userId, page, pageSize);
        setItems(r.items);
        setTotalPages(r.totalPages);
      } else {
        const r = await petApi.adminListRemindersByOwner(selectedUser.userId, page, pageSize);
        setItems(r.items);
        setTotalPages(r.totalPages);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi tải dữ liệu");
    } finally {
      setLoadingItems(false);
    }
  }, [selectedUser, tab, page, pageSize]);

  // Debounced pet search
  useEffect(() => {
    if (scope !== "search") return;
    if (!petQuery.trim()) { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      setSearchingPets(true);
      setPetSearchError(null);
      try {
        const r = await petApi.adminSearchPets(petQuery.trim(), 0, 30);
        setSearchResults(r.items);
      } catch (e) {
        setSearchResults([]);
        setPetSearchError(e instanceof Error ? e.message : "Không thể tìm thú cưng");
      } finally {
        setSearchingPets(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [petQuery, scope]);

  const loadAllData = useCallback(async () => {
    setLoadingAll(true);
    setError(null);
    try {
      if (tab === "pets") {
        const r = await petApi.adminListPets(allPage, pageSize);
        setAllPets(r.items); setAllTotalPages(r.totalPages);
      } else if (tab === "diagnoses") {
        const r = await petApi.adminListDiagnoses(allPage, pageSize);
        setAllDiagnoses(r.items); setAllTotalPages(r.totalPages);
      } else if (tab === "walks") {
        const r = await petApi.adminListWalks(allPage, pageSize);
        setAllWalks(r.items); setAllTotalPages(r.totalPages);
      } else {
        const r = await petApi.adminListReminders(allPage, pageSize);
        setAllReminders(r.items); setAllTotalPages(r.totalPages);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi tải dữ liệu");
    } finally {
      setLoadingAll(false);
    }
  }, [tab, allPage, pageSize]);

  useEffect(() => { void loadStats(); }, [loadStats]);
  useEffect(() => {
    if (scope === "user" && selectedUser) void loadUserScopedData();
  }, [scope, selectedUser, loadUserScopedData]);
  useEffect(() => { setPage(0); }, [tab]);
  useEffect(() => { if (scope === "all" && confirmAll) void loadAllData(); }, [scope, confirmAll, loadAllData]);

  const statCards = stats ? [
    { label: "Tổng thú cưng", value: stats.totalPets, color: "text-rose-500" },
    { label: "Thú cưng đang hoạt động", value: stats.totalActivePets, color: "text-emerald-500" },
    { label: "Lịch đi dạo", value: stats.totalWalkSessions, color: "text-blue-500" },
    { label: "Chẩn đoán AI", value: stats.totalDiagnoses, color: "text-violet-500" },
    { label: "Nhắc nhở đang chờ", value: stats.pendingReminders, color: "text-amber-500" },
    { label: "Nhắc nhở quá hạn", value: stats.overdueReminders, color: "text-rose-600" },
  ] : Array(6).fill(null);

  const TABS: { id: Tab; label: string }[] = [
    { id: "pets", label: "Thú cưng" },
    { id: "diagnoses", label: "Chẩn đoán AI" },
    { id: "walks", label: "Đi dạo" },
    { id: "reminders", label: "Nhắc nhở" },
  ];

  // ── Render helpers ─────────────────────────────────────────────────────────
  function renderPetsTable(rows: PetDto[], loading: boolean) {
    return (
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
              <th className="px-4 py-3 text-left font-semibold">Thú cưng</th>
              <th className="px-4 py-3 text-left font-semibold">Chủ nuôi</th>
              <th className="px-4 py-3 text-center font-semibold">Loài</th>
              <th className="px-4 py-3 text-center font-semibold">Trạng thái</th>
              <th className="px-4 py-3 text-center font-semibold">Cân nặng</th>
              <th className="px-4 py-3 text-right font-semibold">Ngày tạo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? <SkeletonRows cols={6} /> :
              rows.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-400">Chưa có thú cưng nào.</td></tr>
              ) : rows.map((pet) => (
                <tr key={pet.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-slate-100">
                        {pet.avatarUrl
                          ? <Image src={pet.avatarUrl} alt={pet.name} fill className="object-cover" unoptimized />
                          : <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-slate-500">
                              {SPECIES_LABELS[pet.species]?.slice(0, 2) ?? "TC"}
                            </span>
                        }
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{pet.name}</p>
                        {pet.breed && <p className="text-xs text-slate-400">{pet.breed}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/profile/${pet.ownerUserId}`} className="font-medium text-slate-700 hover:text-rose-600">
                      {pet.ownerName ?? `#${pet.ownerUserId}`}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                      {SPECIES_LABELS[pet.species] ?? pet.species}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      pet.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" :
                      "bg-slate-100 text-slate-600"
                    }`}>{PET_STATUS_LABELS[pet.status] ?? pet.status}</span>
                  </td>
                  <td className="px-4 py-3 text-center text-slate-700">{pet.weightKg != null ? `${pet.weightKg} kg` : "—"}</td>
                  <td className="px-4 py-3 text-right text-slate-500 text-xs">{pet.createdAt ? fmtDate(pet.createdAt) : "—"}</td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    );
  }

  function renderDiagnosesTable(rows: PetDiagnosisDto[], loading: boolean) {
    return (
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
              <th className="px-4 py-3 text-left font-semibold">Pet</th>
              <th className="px-4 py-3 text-left font-semibold">Bệnh gợi ý</th>
              <th className="px-4 py-3 text-center font-semibold">Mức độ</th>
              <th className="px-4 py-3 text-center font-semibold">Tin cậy</th>
              <th className="px-4 py-3 text-left font-semibold">Triệu chứng</th>
              <th className="px-4 py-3 text-right font-semibold">Thời gian</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? <SkeletonRows cols={6} /> :
              rows.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-400">Chưa có chẩn đoán nào.</td></tr>
              ) : rows.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/pets/${d.petId}`} className="font-semibold text-slate-900 hover:text-rose-600">
                      {d.petName ?? `#${d.petId}`}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">{d.likelyDisease}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      d.severity === "EMERGENCY" ? "bg-slate-900 text-white" :
                      d.severity === "HIGH" ? "bg-rose-100 text-rose-700" :
                      d.severity === "MODERATE" ? "bg-amber-100 text-amber-700" :
                      "bg-emerald-100 text-emerald-700"
                    }`}>{SEVERITY_LABELS[d.severity] ?? d.severity}</span>
                  </td>
                  <td className="px-4 py-3 text-center"><span className="font-bold text-slate-900">{d.confidenceScore}%</span></td>
                  <td className="px-4 py-3"><p className="max-w-xs truncate text-xs text-slate-600">{d.symptomsText}</p></td>
                  <td className="px-4 py-3 text-right text-xs text-slate-500">{fmtDateTime(d.createdAt)}</td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    );
  }

  function renderWalksTable(rows: PetWalkSessionDto[], loading: boolean) {
    return (
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
              <th className="px-4 py-3 text-left font-semibold">Pet</th>
              <th className="px-4 py-3 text-left font-semibold">Tên session</th>
              <th className="px-4 py-3 text-center font-semibold">Trạng thái</th>
              <th className="px-4 py-3 text-center font-semibold">Hiển thị</th>
              <th className="px-4 py-3 text-right font-semibold">Bắt đầu</th>
              <th className="px-4 py-3 text-right font-semibold">Kết thúc</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? <SkeletonRows cols={6} /> :
              rows.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-400">Chưa có lịch đi dạo nào.</td></tr>
              ) : rows.map((w) => (
                <tr key={w.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/pets/${w.petId}`} className="font-semibold text-slate-900 hover:text-rose-600">
                      {w.petName ?? `#${w.petId}`}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-700">{w.routeName || "—"}</p>
                    {w.note && <p className="text-xs text-slate-400 truncate max-w-xs">{w.note}</p>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      w.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" :
                      w.status === "FINISHED" ? "bg-blue-100 text-blue-700" :
                      "bg-slate-100 text-slate-600"
                    }`}>{WALK_STATUS_LABELS[w.status] ?? w.status}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      w.visibility === "PUBLIC" ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-600"
                    }`}>{VISIBILITY_LABELS[w.visibility] ?? w.visibility}</span>
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-slate-500">{w.startedAt ? fmtDateTime(w.startedAt) : "—"}</td>
                  <td className="px-4 py-3 text-right text-xs text-slate-500">{w.endedAt ? fmtDateTime(w.endedAt) : "—"}</td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    );
  }

  function renderRemindersTable(rows: PetHealthReminderDto[], loading: boolean) {
    return (
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
              <th className="px-4 py-3 text-left font-semibold">Pet</th>
              <th className="px-4 py-3 text-left font-semibold">Tiêu đề</th>
              <th className="px-4 py-3 text-center font-semibold">Loại</th>
              <th className="px-4 py-3 text-center font-semibold">Trạng thái</th>
              <th className="px-4 py-3 text-center font-semibold">Ngày nhắc</th>
              <th className="px-4 py-3 text-right font-semibold">Tạo lúc</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? <SkeletonRows cols={6} /> :
              rows.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-400">Chưa có nhắc nhở nào.</td></tr>
              ) : rows.map((r) => {
                const isOverdue = r.status === "PENDING" && new Date(r.dueDate) < new Date();
                return (
                  <tr key={r.id} className={`hover:bg-slate-50 transition-colors ${isOverdue ? "bg-rose-50/40" : ""}`}>
                    <td className="px-4 py-3">
                      <Link href={`/pets/${r.petId}`} className="font-semibold text-slate-900 hover:text-rose-600">
                        {r.petName ?? `#${r.petId}`}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-700">{r.title}</p>
                      {r.note && <p className="text-xs text-slate-400 truncate max-w-xs">{r.note}</p>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">{r.reminderType}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        r.status === "COMPLETED" ? "bg-emerald-100 text-emerald-700" :
                        r.status === "DISMISSED" ? "bg-slate-100 text-slate-600" :
                        isOverdue ? "bg-rose-100 text-rose-700" :
                        "bg-amber-100 text-amber-700"
                      }`}>{isOverdue ? "QUÁ HẠN" : (REMINDER_STATUS_LABELS[r.status] ?? r.status)}</span>
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-slate-500">{fmtDate(r.dueDate)}</td>
                    <td className="px-4 py-3 text-right text-xs text-slate-500">{r.createdAt ? fmtDateTime(r.createdAt) : "—"}</td>
                  </tr>
                );
              })
            }
          </tbody>
        </table>
      </div>
    );
  }

  function renderTableByTab(rows: any[], loading: boolean) {
    if (tab === "pets") return renderPetsTable(rows as PetDto[], loading);
    if (tab === "diagnoses") return renderDiagnosesTable(rows as PetDiagnosisDto[], loading);
    if (tab === "walks") return renderWalksTable(rows as PetWalkSessionDto[], loading);
    return renderRemindersTable(rows as PetHealthReminderDto[], loading);
  }

  function Paginator({ page, totalPages, setPage }: { page: number; totalPages: number; setPage: (p: number) => void }) {
    if (totalPages <= 1) return null;
    return (
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">Trang {page + 1} / {totalPages}</p>
        <div className="flex gap-1">
          <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40">←</button>
          <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40">→</button>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <main className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản lý Thú cưng</h1>
          <p className="text-sm text-slate-500">Tìm theo người dùng để xem thú cưng, chẩn đoán, đi dạo và nhắc nhở của họ.</p>
        </div>
        <button onClick={() => { void loadStats(); if (scope === "user" && selectedUser) void loadUserScopedData(); if (scope === "all" && confirmAll) void loadAllData(); }}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          Làm mới
        </button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {statCards.map((card, i) =>
          card === null ? (
            <div key={i} className="animate-pulse rounded-2xl border border-slate-200 bg-white p-4">
              <div className="h-4 w-20 rounded bg-slate-100" />
              <div className="mt-2 h-7 w-12 rounded bg-slate-100" />
            </div>
          ) : (
            <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium text-slate-500">{card.label}</p>
              <p className={`mt-1.5 text-2xl font-bold ${card.color}`}>
                {loadingStats ? "—" : card.value.toLocaleString("vi")}
              </p>
            </div>
          )
        )}
      </div>

      {/* Scope switcher */}
      <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50/80 p-1 w-fit">
        {([
          { id: "user", label: "Theo người dùng" },
          { id: "search", label: "Tìm thú cưng" },
          { id: "all", label: "Tất cả (toàn hệ thống)" },
        ] as const).map((s) => (
          <button key={s.id} type="button" onClick={() => { setScope(s.id); setConfirmAll(false); setSelectedUser(null); setItems([]); }}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
              scope === s.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}>
            {s.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {error}
          <button onClick={() => setError(null)} className="ml-auto text-rose-400 hover:text-rose-600">✕</button>
        </div>
      )}

      {/* ── USER SCOPE ── */}
      {scope === "user" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <label className="block text-xs font-semibold uppercase text-slate-500">Tìm người dùng</label>
            <div className="relative mt-2">
              <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                placeholder="Nhập tên, username hoặc email..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-50"
              />
            </div>
            {searchingUsers && <p className="mt-2 text-xs text-slate-400">Đang tìm…</p>}
            {!searchingUsers && userResults.length > 0 && (
              <ul className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-100">
                {userResults.map((u) => (
                  <li key={u.id}>
                    <button type="button" onClick={() => selectUser(u)}
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-slate-50">
                      <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-rose-100">
                        {u.avatarUrl
                          ? <Image src={u.avatarUrl} alt={u.fullName} fill className="object-cover" unoptimized />
                          : <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-rose-600">{u.fullName?.charAt(0)?.toUpperCase() ?? "?"}</span>}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900">{u.fullName || "(chưa đặt tên)"}</p>
                        <p className="truncate text-xs text-slate-500">
                          {u.username ? `@${u.username}` : "—"}
                          {u.email ? ` · ${u.email}` : ""}
                        </p>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        u.role === "ADMIN" ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-600"
                      }`}>{u.role}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {!searchingUsers && userQuery.trim() && userResults.length === 0 && (
              <p className="mt-2 text-xs text-slate-400">Không tìm thấy người dùng phù hợp.</p>
            )}
          </div>

          {loadingSelectedUser && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex animate-pulse items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-slate-100" />
                <div className="space-y-2">
                  <div className="h-4 w-40 rounded bg-slate-100" />
                  <div className="h-3 w-24 rounded bg-slate-100" />
                </div>
              </div>
            </div>
          )}

          {selectedUser && (
            <div className="space-y-4">
              {/* User card */}
              <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-rose-100">
                  {selectedUser.avatarUrl
                    ? <Image src={selectedUser.avatarUrl} alt={selectedUser.fullName} fill className="object-cover" unoptimized />
                    : <span className="absolute inset-0 flex items-center justify-center text-xl font-bold text-rose-600">{selectedUser.fullName?.charAt(0)?.toUpperCase() ?? "?"}</span>}
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-slate-900">{selectedUser.fullName}</h2>
                  <p className="text-sm text-slate-500">@{selectedUser.username}</p>
                </div>
                <div className="flex flex-wrap gap-3 text-xs">
                  <span className="rounded-full bg-rose-50 px-3 py-1 font-semibold text-rose-700">{selectedUser.totalPets} thú cưng</span>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-700">{selectedUser.activePets} đang hoạt động</span>
                  <span className="rounded-full bg-amber-50 px-3 py-1 font-semibold text-amber-700">{selectedUser.pendingReminders} nhắc nhở</span>
                </div>
                <Link
                  href={`/admin/user`}
                  className="text-xs font-medium text-rose-600 hover:underline"
                >← Quay lại tìm user</Link>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-1 rounded-2xl border border-slate-200 bg-slate-50/80 p-1 w-fit">
                {TABS.map((t) => (
                  <button key={t.id} type="button" onClick={() => { setTab(t.id); setPage(0); }}
                    className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                      tab === t.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    }`}>
                    {t.label}
                  </button>
                ))}
              </div>

              {renderTableByTab(items as any[], loadingItems)}
              <Paginator page={page} totalPages={totalPages} setPage={setPage} />
            </div>
          )}

          {!selectedUser && !loadingSelectedUser && (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-400">
              Vui lòng tìm và chọn một người dùng để xem thú cưng của họ.
            </div>
          )}
        </div>
      )}

      {/* ── SEARCH (PET) SCOPE ── */}
      {scope === "search" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <label className="block text-xs font-semibold uppercase text-slate-500">Tìm thú cưng theo tên</label>
            <div className="relative mt-2">
              <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={petQuery}
                onChange={(e) => setPetQuery(e.target.value)}
                placeholder="Tên thú cưng (≥ 1 ký tự)"
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-50"
              />
            </div>
            <p className="mt-2 text-[11px] text-slate-400">Tip: dùng cho case điều tra pet cụ thể. Để quản lý theo user, chuyển sang tab "Theo người dùng".</p>
          </div>
            {petSearchError ? (
              <p className="mt-2 text-sm text-rose-600">{petSearchError}</p>
            ) : null}
            {searchingPets && <p className="text-sm text-slate-400">Đang tìm…</p>}
          {renderPetsTable(searchResults, searchingPets)}
        </div>
      )}

      {/* ── ALL (system-wide) SCOPE ── */}
      {scope === "all" && (
        <div className="space-y-4">
          {!confirmAll ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-amber-900">Chế độ toàn hệ thống — không khuyến khích</h3>
                  <p className="mt-1 text-sm text-amber-800">
                    Tab này liệt kê <strong>mọi bản ghi</strong> trên nền tảng. Với nhiều user, dữ liệu rất lớn — hãy chuyển sang tab <em>Theo người dùng</em> để có hiệu năng tốt hơn.
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => setConfirmAll(true)} className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700">
                      Tôi hiểu, mở chế độ toàn hệ thống
                    </button>
                    <button onClick={() => setScope("user")} className="rounded-xl border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-50">
                      Quay lại "Theo người dùng"
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-1 rounded-2xl border border-slate-200 bg-slate-50/80 p-1 w-fit">
                {TABS.map((t) => (
                  <button key={t.id} type="button" onClick={() => { setTab(t.id); setAllPage(0); }}
                    className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                      tab === t.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    }`}>
                    {t.label}
                  </button>
                ))}
              </div>
              {renderTableByTab(
                tab === "pets" ? allPets :
                tab === "diagnoses" ? allDiagnoses :
                tab === "walks" ? allWalks : allReminders,
                loadingAll
              )}
              <Paginator page={allPage} totalPages={allTotalPages} setPage={setAllPage} />
            </>
          )}
        </div>
      )}

    </main>
  );
}
