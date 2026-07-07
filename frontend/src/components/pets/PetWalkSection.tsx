"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";

import { petApi } from "@/lib/api/petApi";
import type {
  CreatePetWalkMeetupPayload,
  CreatePetWalkSessionPayload,
  PetWalkMeetupRequestDto,
  PetWalkSessionDto,
} from "@/types/petWalk";
import type { PetVisibility } from "@/types/pet";

type Tab = "map" | "sessions" | "meetups";

type Props = {
  petId: number;
  isOwner: boolean;
};

const VISIBILITY_OPTIONS: { value: PetVisibility; label: string }[] = [
  { value: "PUBLIC", label: "Công khai" },
  { value: "FRIENDS", label: "Bạn bè" },
  { value: "PRIVATE", label: "Riêng tư" },
];

function formatDateTime(input: string) {
  const dt = new Date(input);
  if (Number.isNaN(dt.getTime())) return input;
  return dt.toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });
}

function toFixedOr(input: number | null | undefined, fraction = 4) {
  if (input == null || Number.isNaN(input)) return "—";
  return input.toFixed(fraction);
}

function distanceKm(aLat: number, aLon: number, bLat: number, bLon: number) {
  const earthRadiusKm = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLon = ((bLon - aLon) * Math.PI) / 180;
  const start =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((aLat * Math.PI) / 180) *
      Math.cos((bLat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(start), Math.sqrt(1 - start));
}

const PetWalkMap = dynamic(() => import("@/components/pets/PetWalkMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[420px] items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-sm text-slate-400">
      <span className="flex items-center gap-2">
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
        Đang tải bản đồ...
      </span>
    </div>
  ),
});

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  PLANNED: "bg-amber-100 text-amber-700",
  FINISHED: "bg-slate-100 text-slate-500",
  CANCELLED: "bg-rose-100 text-rose-600",
};

const MEETUP_STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  ACCEPTED: "bg-emerald-100 text-emerald-700",
  DECLINED: "bg-rose-100 text-rose-600",
  CANCELLED: "bg-slate-100 text-slate-400",
};

export default function PetWalkSection({ petId, isOwner }: Props) {
  const [tab, setTab] = useState<Tab>("map");
  const [sessions, setSessions] = useState<PetWalkSessionDto[]>([]);
  const [nearbySessions, setNearbySessions] = useState<PetWalkSessionDto[]>([]);
  const [meetups, setMeetups] = useState<PetWalkMeetupRequestDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [searching, setSearching] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoMessage, setGeoMessage] = useState<string | null>(null);

  const [walkForm, setWalkForm] = useState<CreatePetWalkSessionPayload>({
    startLatitude: 10.762622,
    startLongitude: 106.660172,
    visibility: "PUBLIC",
    routeName: "",
    note: "",
  });

  const [searchForm, setSearchForm] = useState({
    latitude: 10.762622,
    longitude: 106.660172,
    radiusKm: 5,
  });

  const [meetupDrafts, setMeetupDrafts] = useState<Record<number, CreatePetWalkMeetupPayload>>({});

  const activeSessions = useMemo(
    () => sessions.filter((s) => s.status === "ACTIVE"),
    [sessions]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (isOwner) {
        const [ownSessions, incomingMeetups] = await Promise.all([
          petApi.listWalks(petId).catch(() => [] as PetWalkSessionDto[]),
          petApi.listWalkMeetups(petId).catch(() => [] as PetWalkMeetupRequestDto[]),
        ]);
        setSessions(ownSessions);
        setMeetups(incomingMeetups);
      } else {
        setSessions([]);
        setMeetups([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải dữ liệu đi dạo");
    } finally {
      setLoading(false);
    }
  }, [isOwner, petId]);

  const requestCurrentLocation = useCallback(
    async (searchAfterUpdate = true) => {
      if (!navigator.geolocation) {
        setGeoMessage("Trình duyệt không hỗ trợ định vị.");
        return;
      }
      setGeoLoading(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          setWalkForm((form) => ({ ...form, startLatitude: lat, startLongitude: lon }));
          setSearchForm((form) => ({ ...form, latitude: lat, longitude: lon }));
          setGeoMessage("Đã cập nhật vị trí hiện tại.");
          if (searchAfterUpdate) {
            try {
              const result = await petApi.listNearbyWalks(lat, lon, searchForm.radiusKm);
              setNearbySessions(result);
              setGeoMessage(
                result.length
                  ? `Tìm thấy ${result.length} phiên đi dạo quanh đây.`
                  : "Chưa có phiên đi dạo công khai nào gần đây."
              );
            } catch {
              setError("Không thể tải phiên đi dạo gần đây.");
            }
          }
          setGeoLoading(false);
        },
        () => {
          setGeoMessage("Không lấy được vị trí. Vui lòng cấp quyền định vị.");
          setGeoLoading(false);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    },
    [searchForm.radiusKm]
  );

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void requestCurrentLocation(true);
  }, [requestCurrentLocation]);

  const searchNearby = useCallback(async () => {
    setSearching(true);
    setError(null);
    try {
      const result = await petApi.listNearbyWalks(searchForm.latitude, searchForm.longitude, searchForm.radiusKm);
      setNearbySessions(result);
      if (!result.length) setGeoMessage("Chưa có phiên đi dạo công khai nào trong bán kính này.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải phiên đi dạo gần đây.");
    } finally {
      setSearching(false);
    }
  }, [searchForm.latitude, searchForm.longitude, searchForm.radiusKm]);

  async function submitWalk(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const created = await petApi.createWalk(petId, {
        startLatitude: walkForm.startLatitude,
        startLongitude: walkForm.startLongitude,
        visibility: walkForm.visibility,
        routeName: walkForm.routeName?.trim() || undefined,
        note: walkForm.note?.trim() || undefined,
      });
      setSessions((prev) => [created, ...prev]);
      setShowCreateForm(false);
      setWalkForm((f) => ({ ...f, routeName: "", note: "" }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tạo phiên đi dạo");
    } finally {
      setSaving(false);
    }
  }

  async function finishWalk(session: PetWalkSessionDto) {
    try {
      const finished = await petApi.finishWalk(petId, session.id, {
        endLatitude: searchForm.latitude,
        endLongitude: searchForm.longitude,
      });
      setSessions((prev) => prev.map((item) => (item.id === session.id ? finished : item)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể kết thúc phiên đi dạo");
    }
  }

  async function submitMeetup(walkId: number) {
    const payload = meetupDrafts[walkId] ?? {};
    try {
      const created = await petApi.createWalkMeetup(walkId, {
        message: payload.message?.trim() || undefined,
        meetupLatitude: payload.meetupLatitude,
        meetupLongitude: payload.meetupLongitude,
      });
      setMeetups((prev) => [created, ...prev]);
      setMeetupDrafts((prev) => ({ ...prev, [walkId]: {} }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể gửi lời mời gặp gỡ");
    }
  }

  async function respondMeetup(meetupId: number, accept: boolean) {
    try {
      const updated = accept ? await petApi.acceptWalkMeetup(meetupId) : await petApi.declineWalkMeetup(meetupId);
      setMeetups((prev) => prev.map((item) => (item.id === meetupId ? updated : item)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể phản hồi lời mời");
    }
  }

  const mapCenter = nearbySessions[0] ?? activeSessions[0];
  const activeCount = nearbySessions.filter((s) => s.status === "ACTIVE").length;

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "map", label: "Bản đồ" },
    { id: "sessions", label: "Phiên đi dạo", count: sessions.length },
    ...(isOwner ? [{ id: "meetups" as Tab, label: "Lời mời gặp", count: meetups.filter((m) => m.status === "PENDING").length }] : []),
  ];

  return (
    <div className="space-y-5">

      {error ? (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      ) : null}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-500">Pet walk</p>
          <h2 className="mt-0.5 text-2xl font-semibold text-slate-900">Đi dạo cùng pet</h2>
        </div>

        <div className="flex items-center gap-2">
          {/* GPS status badge */}
          <div className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${geoLoading ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${geoLoading ? "bg-amber-500 animate-pulse" : "bg-emerald-500"}`} />
            {geoLoading ? "Định vị..." : geoMessage ?? "GPS ready"}
          </div>

          {/* Location refresh */}
          <button
            type="button"
            onClick={() => void requestCurrentLocation(true)}
            disabled={geoLoading}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-slate-400 hover:text-slate-700 disabled:cursor-not-allowed"
            title="Cập nhật vị trí"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 rounded-2xl border border-slate-200 bg-slate-50/80 p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
              tab === t.id
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t.label}
            {t.count !== undefined && t.count > 0 ? (
              <span className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold ${tab === t.id ? "bg-rose-500 text-white" : "bg-slate-200 text-slate-600"}`}>
                {t.count}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* ── MAP TAB ── */}
      {tab === "map" && (
        <div className="space-y-4">
          {/* Map container */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="relative">
              <PetWalkMap
                centerLatitude={searchForm.latitude}
                centerLongitude={searchForm.longitude}
                radiusKm={searchForm.radiusKm}
                nearbySessions={nearbySessions}
                geoLoading={geoLoading}
                geoMessage={geoMessage}
                onRefreshLocation={() => void requestCurrentLocation(true)}
              />
            </div>
          </div>

          {/* Quick stats row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Quanh đây", value: nearbySessions.length, sub: "phiên công khai" },
              { label: "Đang hoạt động", value: activeCount, sub: "session live" },
              { label: "Bán kính", value: searchForm.radiusKm, sub: "km", unit: true },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center">
                <p className="text-2xl font-semibold text-slate-900">
                  {stat.unit ? stat.value : stat.value}
                  {stat.unit && <span className="text-sm font-normal text-slate-400"> km</span>}
                </p>
                <p className="mt-0.5 text-xs font-medium text-slate-500">{stat.label}</p>
                <p className="text-[11px] text-slate-400">{stat.sub}</p>
              </div>
            ))}
          </div>

          {/* Nearby sessions list */}
          {nearbySessions.length > 0 && (
            <div className="space-y-2">
              <p className="px-1 text-sm font-semibold text-slate-700">Gần bạn nhất</p>
              <div className="space-y-2">
                {nearbySessions.slice(0, 5).map((session) => {
                  const dist = mapCenter
                    ? distanceKm(searchForm.latitude, searchForm.longitude, session.currentLatitude, session.currentLongitude)
                    : null;
                  return (
                    <div key={session.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate font-medium text-slate-900">{session.petName ?? `Pet #${session.petId}`}</p>
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS_STYLES[session.status] ?? "bg-slate-100 text-slate-500"}`}>
                            {session.status}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-xs text-slate-400">
                          {session.routeName ?? "Đi dạo tự do"} · {session.visibility}
                        </p>
                      </div>
                      <div className="ml-3 shrink-0 text-right">
                        {dist != null && (
                          <p className="text-sm font-semibold text-rose-500">{dist < 1 ? `${(dist * 1000).toFixed(0)}m` : `${dist.toFixed(1)}km`}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {nearbySessions.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-12 text-center">
              <svg className="h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="mt-3 font-medium text-slate-500">Chưa có phiên đi dạo gần đây</p>
              <p className="mt-1 text-sm text-slate-400">Thử tăng bán kính tìm kiếm hoặc chờ người khác bắt đầu phiên.</p>
            </div>
          )}
        </div>
      )}

      {/* ── SESSIONS TAB ── */}
      {tab === "sessions" && (
        <div className="space-y-4">
          {/* Create form */}
          {isOwner && (
            <div className="rounded-2xl border border-slate-200 bg-white">
              <button
                type="button"
                onClick={() => setShowCreateForm((v) => !v)}
                className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-slate-50"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-500 text-white">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  </span>
                  <div>
                    <p className="font-semibold text-slate-900">Tạo phiên đi dạo mới</p>
                    <p className="text-sm text-slate-500">Bắt đầu ghi lại lịch sử đi dạo cho pet</p>
                  </div>
                </div>
                <svg className={`h-5 w-5 text-slate-400 transition-transform ${showCreateForm ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showCreateForm && (
                <form onSubmit={(e) => void submitWalk(e)} className="border-t border-slate-100 px-5 py-4 space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block sm:col-span-2">
                      <span className="mb-1 block text-xs font-medium text-slate-600">Tên route</span>
                      <input
                        value={walkForm.routeName ?? ""}
                        onChange={(e) => setWalkForm((form) => ({ ...form, routeName: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm transition placeholder:text-slate-400 focus:border-rose-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-100"
                        placeholder="VD: Công viên Tao Đàn"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-xs font-medium text-slate-600">Vĩ độ bắt đầu</span>
                      <input
                        type="number"
                        step="0.000001"
                        value={walkForm.startLatitude}
                        onChange={(e) => setWalkForm((form) => ({ ...form, startLatitude: Number(e.target.value) }))}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm transition focus:border-rose-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-100"
                        required
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-xs font-medium text-slate-600">Kinh độ bắt đầu</span>
                      <input
                        type="number"
                        step="0.000001"
                        value={walkForm.startLongitude}
                        onChange={(e) => setWalkForm((form) => ({ ...form, startLongitude: Number(e.target.value) }))}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm transition focus:border-rose-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-100"
                        required
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-xs font-medium text-slate-600">Quyền hiển thị</span>
                      <select
                        value={walkForm.visibility}
                        onChange={(e) => setWalkForm((form) => ({ ...form, visibility: e.target.value as PetVisibility }))}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm transition focus:border-rose-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-100"
                      >
                        {VISIBILITY_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-slate-600">Ghi chú</span>
                    <textarea
                      rows={2}
                      value={walkForm.note ?? ""}
                      onChange={(e) => setWalkForm((form) => ({ ...form, note: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm transition placeholder:text-slate-400 focus:border-rose-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-100"
                      placeholder="VD: Đi dạo 20 phút quanh hồ"
                    />
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex-1 rounded-full bg-rose-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:opacity-60"
                    >
                      {saving ? "Đang lưu..." : "Tạo phiên đi dạo"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="rounded-full border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                    >
                      Hủy
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Session list */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <svg className="h-6 w-6 animate-spin text-slate-300" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-12 text-center">
              <svg className="h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="mt-3 font-medium text-slate-500">Chưa có phiên đi dạo nào</p>
              <p className="mt-1 text-sm text-slate-400">Tạo phiên mới để bắt đầu theo dõi.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sessions.map((session) => (
                <div key={session.id} className="group rounded-2xl border border-slate-200 bg-white px-4 py-3.5 transition hover:border-slate-300 hover:shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-medium text-slate-900">{session.routeName ?? "Phiên đi dạo"}</p>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS_STYLES[session.status] ?? "bg-slate-100 text-slate-500"}`}>
                          {session.status}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-400">{formatDateTime(session.startedAt)}</p>
                      {session.note ? <p className="mt-1 text-sm text-slate-500">{session.note}</p> : null}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs text-slate-400">{toFixedOr(session.currentLatitude)}, {toFixedOr(session.currentLongitude)}</p>
                    </div>
                  </div>
                  {isOwner && session.status === "ACTIVE" && (
                    <button
                      type="button"
                      onClick={() => void finishWalk(session)}
                      className="mt-3 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                    >
                      Kết thúc phiên
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── MEETUPS TAB ── */}
      {tab === "meetups" && isOwner && (
        <div className="space-y-2">
          {meetups.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-12 text-center">
              <svg className="h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="mt-3 font-medium text-slate-500">Chưa có lời mời nào</p>
              <p className="mt-1 text-sm text-slate-400">Lời mời gặp từ người đi dạo khác sẽ hiển thị ở đây.</p>
            </div>
          ) : (
            meetups.map((meetup) => (
              <div key={meetup.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-900">{meetup.requesterName ?? `User #${meetup.requesterUserId}`}</p>
                      <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                        {meetup.petName ?? "Pet"}
                      </span>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${MEETUP_STYLES[meetup.status] ?? "bg-slate-100 text-slate-500"}`}>
                        {meetup.status}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-400">{formatDateTime(meetup.createdAt)}</p>
                    {meetup.message ? <p className="mt-2 text-sm text-slate-600">{meetup.message}</p> : null}
                  </div>
                </div>
                {meetup.status === "PENDING" && (
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => void respondMeetup(meetup.id, true)}
                      className="rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-600"
                    >
                      Chấp nhận
                    </button>
                    <button
                      type="button"
                      onClick={() => void respondMeetup(meetup.id, false)}
                      className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                    >
                      Từ chối
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
