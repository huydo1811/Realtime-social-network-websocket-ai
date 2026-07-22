"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { petApi } from "@/lib/api/petApi";
import { postApi } from "@/lib/api/postApi";
import type { PetHealthRecordType } from "@/types/petHealth";
import type { VetClinicDto } from "@/types/petVet";
import {
  HEALTH_RECORD_TYPE_LABELS,
  type PetHealthRecordDto,
  type PetHealthReminderDto,
  type WeightEntry,
  type AppetiteEntry,
  type ActivityEntry,
} from "@/types/petHealth";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format, parseISO, startOfDay } from "date-fns";
import { vi } from "date-fns/locale";

type Tab = "weight" | "appetite" | "activity" | "appointments" | "records";
type TimeFilter = "7d" | "30d" | "90d" | "all";
type AppointmentStatusFilter = "pending" | "done" | "all";
type ShareTone = "friendly" | "expert" | "fun";
type ShareTemplate = "diary" | "alert" | "milestone";
type ShareDraft = {
  key: string;
  title: string;
  content: string;
  visibility: "PUBLIC" | "FRIENDS" | "PRIVATE";
};

type Props = {
  petId: number;
  isOwner: boolean;
};

const RECORD_TYPES: PetHealthRecordType[] = [
  "VACCINE",
  "DEWORM",
  "CHECKUP",
  "SURGERY",
  "MEDICATION",
  "OTHER",
];

const APPETITE_LEVEL_LABELS: Record<AppetiteEntry["level"], string> = {
  GOOD: "Tốt",
  NORMAL: "Bình thường",
  POOR: "Kém",
  NONE: "Không ăn",
};

const APPETITE_LEVEL_COLORS: Record<AppetiteEntry["level"], string> = {
  GOOD: "#10b981",
  NORMAL: "#f59e0b",
  POOR: "#f97316",
  NONE: "#ef4444",
};

const APPETITE_LEVEL_NUMERIC: Record<AppetiteEntry["level"], number> = {
  GOOD: 4,
  NORMAL: 3,
  POOR: 2,
  NONE: 1,
};

const ACTIVITY_TYPES = ["Đi dạo", "Chạy", "Chơi đùa", "Bơi", "Khác"];

const RECORD_TYPE_COLORS: Record<PetHealthRecordType, string> = {
  VACCINE: "bg-blue-100 text-blue-700",
  DEWORM: "bg-purple-100 text-purple-700",
  CHECKUP: "bg-emerald-100 text-emerald-700",
  SURGERY: "bg-rose-100 text-rose-700",
  MEDICATION: "bg-amber-100 text-amber-700",
  OTHER: "bg-slate-100 text-slate-600",
};

const REMINDER_STATUS_LABELS: Record<string, string> = {
  PENDING: "Chưa xong",
  COMPLETED: "Đã xong",
  DISMISSED: "Đã bỏ qua",
};

const VET_POSITIVE_KEYWORDS = [
  "thu y",
  "thú y",
  "veterinary",
  "vet",
  "clinic",
  "hospital",
  "animal hospital",
  "benh vien thu y",
  "bệnh viện thú y",
  "phong kham thu y",
  "phòng khám thú y",
  "chẩn trị",
  "animal clinic",
];

const VET_NEGATIVE_KEYWORDS = [
  "pet shop",
  "petshop",
  "cửa hàng thú cưng",
  "phụ kiện",
  "spa",
  "groom",
  "grooming",
  "tắm cắt",
  "hotel",
  "boarding",
  "coffee",
  "cafe",
  "siêu thị",
  "shop",
  "thức ăn",
  "pet mart",
];

function normalizeText(input: string) {
  return input.toLowerCase().trim();
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

function vetRelevanceScore(input: {
  name: string;
  address?: string;
  category?: string;
  type?: string;
}) {
  const name = normalizeText(input.name || "");
  const address = normalizeText(input.address || "");
  const category = normalizeText(input.category || "");
  const type = normalizeText(input.type || "");
  const haystack = `${name} ${address}`;

  let score = 0;
  if (category === "amenity" || category === "healthcare") score += 2;
  if (type.includes("veterinary")) score += 8;
  if (type.includes("clinic") || type.includes("hospital")) score += 3;
  if (category === "shop" || type.includes("pet") || type.includes("grooming")) score -= 6;

  for (const keyword of VET_POSITIVE_KEYWORDS) {
    if (haystack.includes(keyword)) score += 2;
  }
  for (const keyword of VET_NEGATIVE_KEYWORDS) {
    if (haystack.includes(keyword)) score -= 4;
  }
  return score;
}

function formatDate(input: string) {
  const dt = parseISO(input);
  if (Number.isNaN(dt.getTime())) return input;
  return format(dt, "dd/MM/yyyy", { locale: vi });
}

function toChartDate(input: string) {
  const dt = parseISO(input);
  return Number.isNaN(dt.getTime()) ? input : format(dt, "dd/MM");
}

function daysUntil(dueDate: string) {
  const due = startOfDay(parseISO(dueDate));
  const today = startOfDay(new Date());
  return Math.ceil((due.getTime() - today.getTime()) / 86400000);
}

function getAppetiteBgClass(level: AppetiteEntry["level"]) {
  switch (level) {
    case "GOOD": return "bg-emerald-100 text-emerald-700";
    case "NORMAL": return "bg-amber-100 text-amber-700";
    case "POOR": return "bg-orange-100 text-orange-700";
    case "NONE": return "bg-rose-100 text-rose-700";
    default: return "bg-slate-100 text-slate-700";
  }
}

function inTimeRange(input: string, filter: TimeFilter) {
  if (filter === "all") return true;
  const date = parseISO(input);
  if (Number.isNaN(date.getTime())) return false;
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const rangeDays = filter === "7d" ? 7 : filter === "30d" ? 30 : 90;
  return now - date.getTime() <= rangeDays * day;
}

function inSpecificDateRange(input: string, fromDate: string, toDate: string) {
  if (!fromDate && !toDate) return true;
  const date = parseISO(input);
  if (Number.isNaN(date.getTime())) return false;
  const target = startOfDay(date).getTime();
  if (fromDate) {
    const fromTs = startOfDay(parseISO(fromDate)).getTime();
    if (!Number.isNaN(fromTs) && target < fromTs) return false;
  }
  if (toDate) {
    const toTs = startOfDay(parseISO(toDate)).getTime();
    if (!Number.isNaN(toTs) && target > toTs) return false;
  }
  return true;
}

function paginate<T>(items: T[], page: number, pageSize: number) {
  const safePage = Math.max(1, page);
  const start = (safePage - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

export default function PetHealthSection({ petId, isOwner }: Props) {
  const [tab, setTab] = useState<Tab>("weight");
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([]);
  const [appetiteEntries, setAppetiteEntries] = useState<AppetiteEntry[]>([]);
  const [activityEntries, setActivityEntries] = useState<ActivityEntry[]>([]);
  const [records, setRecords] = useState<PetHealthRecordDto[]>([]);
  const [reminders, setReminders] = useState<PetHealthReminderDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [sharingKey, setSharingKey] = useState<string | null>(null);
  const [shareTone, setShareTone] = useState<ShareTone>("friendly");
  const [shareTemplate, setShareTemplate] = useState<ShareTemplate>("diary");
  const [shareDraft, setShareDraft] = useState<ShareDraft | null>(null);
  const [showRecordForm, setShowRecordForm] = useState(false);
  const [showReminderForm, setShowReminderForm] = useState(false);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("30d");
  const [notesOnly, setNotesOnly] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [appointmentStatusFilter, setAppointmentStatusFilter] = useState<AppointmentStatusFilter>("pending");
  const [pageByTab, setPageByTab] = useState<Record<Tab, number>>({
    weight: 1,
    appetite: 1,
    activity: 1,
    appointments: 1,
    records: 1,
  });
  const PAGE_SIZE = 6;

  const [weightForm, setWeightForm] = useState({ weightKg: "", date: new Date().toISOString().slice(0, 10), note: "" });
  const [appetiteForm, setAppetiteForm] = useState({ level: "NORMAL" as AppetiteEntry["level"], date: new Date().toISOString().slice(0, 10), note: "" });
  const [activityForm, setActivityForm] = useState({ minutes: "", activityType: "Đi dạo", date: new Date().toISOString().slice(0, 10), note: "" });
  const [recordForm, setRecordForm] = useState({ recordType: "VACCINE" as PetHealthRecordType, title: "", description: "", performedAt: new Date().toISOString().slice(0, 10), clinicName: "" });
  const [reminderForm, setReminderForm] = useState({ reminderType: "VACCINE" as PetHealthRecordType, title: "", dueDate: "", clinicName: "", note: "" });
  const [vetGeo, setVetGeo] = useState<{ latitude: number; longitude: number } | null>(null);
  const [vetRadiusKm, setVetRadiusKm] = useState(5);
  const [vetSearching, setVetSearching] = useState(false);
  const [vetSearchError, setVetSearchError] = useState<string | null>(null);
  const [vetResults, setVetResults] = useState<VetClinicDto[]>([]);

  const load = useCallback(async () => {
    if (!isOwner) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const [weightData, appetiteData, activityData, recordData, reminderData] = await Promise.all([
        petApi.listWeightEntries(petId),
        petApi.listAppetiteEntries(petId),
        petApi.listActivityEntries(petId),
        petApi.listHealthRecords(petId),
        petApi.listReminders(petId),
      ]);
      setWeightEntries(weightData);
      setAppetiteEntries(appetiteData);
      setActivityEntries(activityData);
      setRecords(recordData);
      setReminders(reminderData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể tải dữ liệu sức khỏe");
    } finally {
      setLoading(false);
    }
  }, [isOwner, petId]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    function handleReminderChanged() { void load(); }
    window.addEventListener("pet-reminder-changed", handleReminderChanged);
    return () => window.removeEventListener("pet-reminder-changed", handleReminderChanged);
  }, [load]);

  // ── Submit handlers ──────────────────────────────────────────────────────────

  async function submitWeight(e: React.FormEvent) {
    e.preventDefault();
    const w = parseFloat(weightForm.weightKg);
    if (!Number.isFinite(w) || w <= 0) return;
    setSaving(true);
    try {
      const created = await petApi.createWeightEntry(petId, w, weightForm.note || undefined);
      setWeightEntries((prev) => [created, ...prev].sort((a, b) => b.recordedAt.localeCompare(a.recordedAt)));
      setWeightForm({ weightKg: "", date: new Date().toISOString().slice(0, 10), note: "" });
    } catch (e) { setError(e instanceof Error ? e.message : "Lỗi"); }
    finally { setSaving(false); }
  }

  async function submitAppetite(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const created = await petApi.createAppetiteEntry(petId, appetiteForm.level, appetiteForm.note || undefined);
      setAppetiteEntries((prev) => [created, ...prev].sort((a, b) => b.recordedAt.localeCompare(a.recordedAt)));
      setAppetiteForm({ level: "NORMAL", date: new Date().toISOString().slice(0, 10), note: "" });
    } catch (e) { setError(e instanceof Error ? e.message : "Lỗi"); }
    finally { setSaving(false); }
  }

  async function submitActivity(e: React.FormEvent) {
    e.preventDefault();
    const m = parseInt(activityForm.minutes);
    if (!Number.isFinite(m) || m <= 0) return;
    setSaving(true);
    try {
      const created = await petApi.createActivityEntry(petId, m, activityForm.activityType, activityForm.note || undefined);
      setActivityEntries((prev) => [created, ...prev].sort((a, b) => b.recordedAt.localeCompare(a.recordedAt)));
      setActivityForm({ minutes: "", activityType: "Đi dạo", date: new Date().toISOString().slice(0, 10), note: "" });
    } catch (e) { setError(e instanceof Error ? e.message : "Lỗi"); }
    finally { setSaving(false); }
  }

  async function submitRecord(e: React.FormEvent) {
    e.preventDefault();
    if (!recordForm.title.trim()) return;
    setSaving(true);
    try {
      const created = await petApi.createHealthRecord(petId, {
        recordType: recordForm.recordType,
        title: recordForm.title.trim(),
        description: recordForm.description.trim() || undefined,
        performedAt: recordForm.performedAt,
        clinicName: recordForm.clinicName.trim() || undefined,
      });
      setRecords((prev) => [created, ...prev]);
      setRecordForm({ recordType: "VACCINE", title: "", description: "", performedAt: new Date().toISOString().slice(0, 10), clinicName: "" });
      setShowRecordForm(false);
    } catch (e) { setError(e instanceof Error ? e.message : "Không thể thêm hồ sơ"); }
    finally { setSaving(false); }
  }

  async function submitReminder(e: React.FormEvent) {
    e.preventDefault();
    if (!reminderForm.title.trim() || !reminderForm.dueDate) return;
    setSaving(true);
    try {
      const noteParts = [
        reminderForm.clinicName.trim() ? `Nơi khám: ${reminderForm.clinicName.trim()}` : null,
        reminderForm.note.trim() ? reminderForm.note.trim() : null,
      ].filter(Boolean) as string[];
      const created = await petApi.createReminder(petId, {
        reminderType: reminderForm.reminderType,
        title: reminderForm.title.trim(),
        dueDate: reminderForm.dueDate,
        note: noteParts.length ? noteParts.join(" • ") : undefined,
      });
      setReminders((prev) => [...prev, created].sort((a, b) => a.dueDate.localeCompare(b.dueDate)));
      window.dispatchEvent(new CustomEvent("pet-reminder-changed"));
      setReminderForm({ reminderType: "VACCINE", title: "", dueDate: "", clinicName: "", note: "" });
      setShowReminderForm(false);
    } catch (e) { setError(e instanceof Error ? e.message : "Không thể tạo nhắc nhở"); }
    finally { setSaving(false); }
  }

  const requestVetLocation = useCallback(async (): Promise<{ latitude: number; longitude: number } | null> => {
    if (!navigator.geolocation) {
      setVetSearchError("Trình duyệt không hỗ trợ GPS.");
      return null;
    }
    return await new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = { latitude: position.coords.latitude, longitude: position.coords.longitude };
          setVetGeo(loc);
          setVetSearchError(null);
          resolve(loc);
        },
        () => {
          setVetSearchError("Không lấy được vị trí hiện tại.");
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }, []);

  const searchNearbyVets = useCallback(async () => {
    setVetSearching(true);
    setVetSearchError(null);
    try {
      const loc = vetGeo ?? (await requestVetLocation());
      if (!loc) return;
      const cacheKey = `health-vet-search:${loc.latitude.toFixed(3)}:${loc.longitude.toFixed(3)}:${vetRadiusKm}`;
      const cachedRaw = typeof window !== "undefined" ? sessionStorage.getItem(cacheKey) : null;
      if (cachedRaw) {
        try {
          const cached = JSON.parse(cachedRaw) as { ts: number; items: VetClinicDto[] };
          if (Date.now() - cached.ts <= 5 * 60 * 1000 && Array.isArray(cached.items)) {
            setVetResults(cached.items);
            if (!cached.items.length) {
              setVetSearchError("Không tìm thấy thú y phù hợp trong bán kính đã chọn.");
            }
            return;
          }
        } catch {
          // ignore invalid cache
        }
      }

      const latDelta = vetRadiusKm / 111;
      const lonDelta = vetRadiusKm / (111 * Math.max(Math.cos((loc.latitude * Math.PI) / 180), 0.2));
      const viewBox = `${loc.longitude - lonDelta},${loc.latitude + latDelta},${loc.longitude + lonDelta},${loc.latitude - latDelta}`;
      const nominatimQueries = [
        "phong kham thu y",
        "thú y",
        "benh vien thu y",
        "animal hospital",
        "veterinary clinic",
        "vet clinic",
      ];

      const queryResults = await Promise.allSettled(
        nominatimQueries.map(async (q) => {
          const controller = new AbortController();
          const timer = window.setTimeout(() => controller.abort(), 4500);
          try {
            const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=80&bounded=1&q=${encodeURIComponent(
              q
            )}&viewbox=${encodeURIComponent(viewBox)}&countrycodes=vn&addressdetails=1&extratags=1`;
            const res = await fetch(url, {
              signal: controller.signal,
              headers: { Accept: "application/json" },
            });
            if (!res.ok) return [] as VetClinicDto[];
            const data = (await res.json()) as Array<{
              lat: string;
              lon: string;
              display_name: string;
              name?: string;
              place_id: number;
              category?: string;
              type?: string;
            }>;
            return data
              .map((row) => {
                const lat = Number(row.lat);
                const lon = Number(row.lon);
                if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
                const distance = distanceKm(loc.latitude, loc.longitude, lat, lon);
                if (distance > vetRadiusKm + 0.25) return null;
                const candidateName = row.name || row.display_name.split(",")[0] || "Phòng khám thú y";
                const relevance = vetRelevanceScore({
                  name: candidateName,
                  address: row.display_name,
                  category: row.category,
                  type: row.type,
                });
                if (relevance < 5) return null;
                return {
                  id: `nominatim-${row.place_id}`,
                  name: candidateName,
                  latitude: lat,
                  longitude: lon,
                  distanceKm: distance,
                  address: row.display_name,
                  phone: null,
                  website: null,
                  openingHours: null,
                } as VetClinicDto;
              })
              .filter((item): item is VetClinicDto => item != null);
          } finally {
            window.clearTimeout(timer);
          }
        })
      );

      const merged = queryResults.flatMap((result) => (result.status === "fulfilled" ? result.value : []));
      const seen = new Set<string>();
      const vets = merged
        .filter((item) => {
          const key = `${item.name.toLowerCase()}-${item.latitude.toFixed(5)}-${item.longitude.toFixed(5)}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .sort((a, b) => a.distanceKm - b.distanceKm)
        .slice(0, 120);

      setVetResults(vets);
      if (typeof window !== "undefined") {
        sessionStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), items: vets }));
      }
      if (!vets.length) setVetSearchError("Không tìm thấy thú y phù hợp trong bán kính đã chọn.");
    } catch (err) {
      setVetSearchError(err instanceof Error ? err.message : "Không thể tìm thú y gần đây.");
    } finally {
      setVetSearching(false);
    }
  }, [requestVetLocation, vetGeo, vetRadiusKm]);

  async function handleCompleteReminder(reminderId: number) {
    try {
      const updated = await petApi.completeReminder(petId, reminderId);
      setReminders((prev) =>
        prev.map((r) => (r.id === reminderId ? updated : r))
      );
      window.dispatchEvent(new CustomEvent("pet-reminder-changed"));
    } catch (e) { setError(e instanceof Error ? e.message : "Không thể cập nhật nhắc nhở"); }
  }

  async function handleDeleteRecord(recordId: number) {
    try {
      await petApi.deleteHealthRecord(petId, recordId);
      setRecords((prev) => prev.filter((r) => r.id !== recordId));
    } catch (e) { setError(e instanceof Error ? e.message : "Không thể xóa hồ sơ"); }
  }

  function buildReminderShareContent(reminder: PetHealthReminderDto): string {
    const base =
      shareTemplate === "alert"
        ? `🔔 Nhắc lịch chăm sóc: ${reminder.title}`
        : shareTemplate === "milestone"
          ? `🏆 Mốc chăm sóc sắp tới của pet: ${reminder.title}`
          : `📔 Nhật ký chăm sóc pet: ${reminder.title}`;
    const toneLine =
      shareTone === "expert"
        ? "Cập nhật theo dõi sức khỏe thú cưng theo lịch định kỳ."
        : shareTone === "fun"
          ? "Team nuôi pet nhớ lịch để boss luôn khỏe nhen 🐾"
          : "Mình vừa lên lịch chăm sóc để không bỏ lỡ mốc quan trọng.";
    return [base, toneLine, `Loại: ${HEALTH_RECORD_TYPE_LABELS[reminder.reminderType]}`, `Ngày: ${formatDate(reminder.dueDate)}`, reminder.note?.trim() ? `Ghi chú: ${reminder.note.trim()}` : null]
      .filter(Boolean)
      .join("\n");
  }

  function buildRecordShareContent(record: PetHealthRecordDto): string {
    const base =
      shareTemplate === "alert"
        ? `🚨 Cập nhật sức khỏe cần lưu ý: ${record.title}`
        : shareTemplate === "milestone"
          ? `🎉 Vừa hoàn thành một mốc chăm sóc: ${record.title}`
          : `🩺 Nhật ký sức khỏe mới: ${record.title}`;
    const toneLine =
      shareTone === "expert"
        ? "Thông tin theo dõi sức khỏe thú cưng được cập nhật chi tiết."
        : shareTone === "fun"
          ? "Boss vừa có update sức khỏe mới, cả nhà cổ vũ nào!"
          : "Mình vừa cập nhật hồ sơ sức khỏe cho pet.";
    return [base, toneLine, `Danh mục: ${HEALTH_RECORD_TYPE_LABELS[record.recordType]}`, `Ngày thực hiện: ${formatDate(record.performedAt)}`, record.clinicName?.trim() ? `Phòng khám: ${record.clinicName.trim()}` : null, record.description?.trim() ? `Chi tiết: ${record.description.trim()}` : null]
      .filter(Boolean)
      .join("\n");
  }

  function buildWeightShareContent(entry: WeightEntry): string {
    const base =
      shareTemplate === "alert"
        ? `⚠️ Cập nhật cân nặng cần theo dõi: ${entry.weightKg} kg`
        : shareTemplate === "milestone"
          ? `🎯 Mốc cân nặng mới của pet: ${entry.weightKg} kg`
          : `⚖️ Nhật ký cân nặng mới: ${entry.weightKg} kg`;
    const toneLine =
      shareTone === "expert"
        ? "Mình đang theo dõi chỉ số cân nặng để kiểm soát sức khỏe tốt hơn."
        : shareTone === "fun"
          ? "Boss vừa cân xong, cả nhà vào xem thành tích nha!"
          : "Mình vừa cập nhật cân nặng mới cho pet.";
    return [base, toneLine, `Ngày: ${formatDate(entry.recordedAt)}`, entry.note?.trim() ? `Ghi chú: ${entry.note.trim()}` : null]
      .filter(Boolean)
      .join("\n");
  }

  function buildAppetiteShareContent(entry: AppetiteEntry): string {
    const appetiteLabel = APPETITE_LEVEL_LABELS[entry.level];
    const base =
      shareTemplate === "alert"
        ? `🔔 Cập nhật ăn uống cần lưu ý: ${appetiteLabel}`
        : shareTemplate === "milestone"
          ? `🏅 Mốc ăn uống hôm nay của pet: ${appetiteLabel}`
          : `🍽️ Nhật ký ăn uống: ${appetiteLabel}`;
    const toneLine =
      shareTone === "expert"
        ? "Theo dõi khẩu phần và mức ăn để đánh giá tình trạng sức khỏe."
        : shareTone === "fun"
          ? "Hôm nay boss ăn uống thế này nè, mọi người xem thử!"
          : "Mình vừa cập nhật tình hình ăn uống của pet.";
    return [base, toneLine, `Ngày: ${formatDate(entry.recordedAt)}`, entry.note?.trim() ? `Ghi chú: ${entry.note.trim()}` : null]
      .filter(Boolean)
      .join("\n");
  }

  function buildActivityShareContent(entry: ActivityEntry): string {
    const base =
      shareTemplate === "alert"
        ? `📣 Hoạt động hôm nay cần lưu ý: ${entry.activityType}`
        : shareTemplate === "milestone"
          ? `🏃 Hoàn thành mốc vận động mới: ${entry.minutes} phút`
          : `🐾 Nhật ký vận động: ${entry.activityType}`;
    const toneLine =
      shareTone === "expert"
        ? "Dữ liệu hoạt động giúp theo dõi thể lực và nhịp chăm sóc."
        : shareTone === "fun"
          ? "Boss vừa vận động cực sung, khoe nhẹ với mọi người!"
          : "Mình vừa ghi lại hoạt động mới của pet.";
    return [
      base,
      toneLine,
      `Thời lượng: ${entry.minutes} phút`,
      `Ngày: ${formatDate(entry.recordedAt)}`,
      entry.note?.trim() ? `Ghi chú: ${entry.note.trim()}` : null,
    ]
      .filter(Boolean)
      .join("\n");
  }

  function shareWeightToFeed(entry: WeightEntry) {
    setShareDraft({
      key: `weight-${entry.id}`,
      title: "Xem trước chia sẻ cân nặng",
      content: buildWeightShareContent(entry),
      visibility: "FRIENDS",
    });
  }

  function shareAppetiteToFeed(entry: AppetiteEntry) {
    setShareDraft({
      key: `appetite-${entry.id}`,
      title: "Xem trước chia sẻ ăn uống",
      content: buildAppetiteShareContent(entry),
      visibility: "FRIENDS",
    });
  }

  function shareActivityToFeed(entry: ActivityEntry) {
    setShareDraft({
      key: `activity-${entry.id}`,
      title: "Xem trước chia sẻ hoạt động",
      content: buildActivityShareContent(entry),
      visibility: "FRIENDS",
    });
  }

  function shareReminderToFeed(reminder: PetHealthReminderDto) {
    setShareDraft({
      key: `reminder-${reminder.id}`,
      title: "Xem trước chia sẻ lịch chăm sóc",
      content: buildReminderShareContent(reminder),
      visibility: "FRIENDS",
    });
  }

  function shareRecordToFeed(record: PetHealthRecordDto) {
    setShareDraft({
      key: `record-${record.id}`,
      title: "Xem trước chia sẻ cập nhật sức khỏe",
      content: buildRecordShareContent(record),
      visibility: "FRIENDS",
    });
  }

  async function confirmShareDraft() {
    if (!shareDraft) return;
    setSharingKey(shareDraft.key);
    setError(null);
    try {
      await postApi.create({
        content: shareDraft.content,
        visibility: shareDraft.visibility,
        petId,
      });
      setShareDraft(null);
      setNotice("Đã chia sẻ lên bảng tin. Vào Trang chủ để xem bài vừa đăng.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể chia sẻ cập nhật sức khỏe.");
    } finally {
      setSharingKey(null);
    }
  }

  useEffect(() => {
    setPageByTab((prev) => ({ ...prev, [tab]: 1 }));
  }, [tab, timeFilter, notesOnly, fromDate, toDate]);

  const filteredWeightEntries = useMemo(
    () =>
      weightEntries.filter((entry) => {
        if (!inTimeRange(entry.recordedAt, timeFilter)) return false;
        if (!inSpecificDateRange(entry.recordedAt, fromDate, toDate)) return false;
        if (notesOnly && !entry.note?.trim()) return false;
        return true;
      }),
    [weightEntries, timeFilter, notesOnly, fromDate, toDate]
  );

  const filteredAppetiteEntries = useMemo(
    () =>
      appetiteEntries.filter((entry) => {
        if (!inTimeRange(entry.recordedAt, timeFilter)) return false;
        if (!inSpecificDateRange(entry.recordedAt, fromDate, toDate)) return false;
        if (notesOnly && !entry.note?.trim()) return false;
        return true;
      }),
    [appetiteEntries, timeFilter, notesOnly, fromDate, toDate]
  );

  const filteredActivityEntries = useMemo(
    () =>
      activityEntries.filter((entry) => {
        if (!inTimeRange(entry.recordedAt, timeFilter)) return false;
        if (!inSpecificDateRange(entry.recordedAt, fromDate, toDate)) return false;
        if (notesOnly && !entry.note?.trim()) return false;
        return true;
      }),
    [activityEntries, timeFilter, notesOnly, fromDate, toDate]
  );

  const filteredRecords = useMemo(
    () =>
      records.filter((entry) => {
        if (!inTimeRange(entry.performedAt, timeFilter)) return false;
        if (!inSpecificDateRange(entry.performedAt, fromDate, toDate)) return false;
        if (notesOnly && !entry.description?.trim()) return false;
        return true;
      }),
    [records, timeFilter, notesOnly, fromDate, toDate]
  );

  const filteredReminders = useMemo(
    () =>
      reminders.filter((entry) => {
        if (appointmentStatusFilter === "pending" && entry.status !== "PENDING") return false;
        if (appointmentStatusFilter === "done" && entry.status === "PENDING") return false;
        if (!inTimeRange(entry.dueDate, timeFilter)) return false;
        if (!inSpecificDateRange(entry.dueDate, fromDate, toDate)) return false;
        if (notesOnly && !entry.note?.trim()) return false;
        return true;
      }),
    [reminders, appointmentStatusFilter, timeFilter, notesOnly, fromDate, toDate]
  );

  const pagedWeightEntries = useMemo(
    () => paginate(filteredWeightEntries, pageByTab.weight, PAGE_SIZE),
    [filteredWeightEntries, pageByTab.weight]
  );
  const pagedAppetiteEntries = useMemo(
    () => paginate(filteredAppetiteEntries, pageByTab.appetite, PAGE_SIZE),
    [filteredAppetiteEntries, pageByTab.appetite]
  );
  const pagedActivityEntries = useMemo(
    () => paginate(filteredActivityEntries, pageByTab.activity, PAGE_SIZE),
    [filteredActivityEntries, pageByTab.activity]
  );
  const pagedReminders = useMemo(
    () => paginate(filteredReminders, pageByTab.appointments, PAGE_SIZE),
    [filteredReminders, pageByTab.appointments]
  );
  const pagedRecords = useMemo(
    () => paginate(filteredRecords, pageByTab.records, PAGE_SIZE),
    [filteredRecords, pageByTab.records]
  );

  function renderPager(targetTab: Tab, totalItems: number) {
    const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
    if (totalPages <= 1) return null;
    const current = Math.min(pageByTab[targetTab], totalPages);
    return (
      <div className="flex items-center justify-between px-1 pt-1">
        <p className="text-xs text-slate-500">
          Trang {current}/{totalPages}
        </p>
        <div className="flex gap-1">
          <button
            type="button"
            disabled={current <= 1}
            onClick={() =>
              setPageByTab((prev) => ({ ...prev, [targetTab]: Math.max(1, prev[targetTab] - 1) }))
            }
            className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-40"
          >
            Trước
          </button>
          <button
            type="button"
            disabled={current >= totalPages}
            onClick={() =>
              setPageByTab((prev) => ({
                ...prev,
                [targetTab]: Math.min(totalPages, prev[targetTab] + 1),
              }))
            }
            className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-40"
          >
            Sau
          </button>
        </div>
      </div>
    );
  }

  // ── Chart data ───────────────────────────────────────────────────────────────

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const weightChartData = filteredWeightEntries
    .filter((e) => parseISO(e.recordedAt) >= thirtyDaysAgo)
    .sort((a, b) => a.recordedAt.localeCompare(b.recordedAt))
    .map((e) => ({ date: toChartDate(e.recordedAt), weight: e.weightKg }));

  const appetiteChartData = filteredAppetiteEntries
    .filter((e) => parseISO(e.recordedAt) >= thirtyDaysAgo)
    .sort((a, b) => a.recordedAt.localeCompare(b.recordedAt))
    .map((e) => ({
      date: toChartDate(e.recordedAt),
      level: APPETITE_LEVEL_NUMERIC[e.level],
      levelLabel: APPETITE_LEVEL_LABELS[e.level],
      color: APPETITE_LEVEL_COLORS[e.level],
    }));

  const activityByDay = filteredActivityEntries
    .filter((e) => parseISO(e.recordedAt) >= thirtyDaysAgo)
    .reduce<Record<string, number>>((acc, e) => {
      const key = e.recordedAt.slice(0, 10);
      acc[key] = (acc[key] ?? 0) + e.minutes;
      return acc;
    }, {});

  const activityChartData = Object.entries(activityByDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, minutes]) => ({ date: toChartDate(date), minutes }));

  const latestWeight = filteredWeightEntries[0]?.weightKg;
  const latestAppetite = filteredAppetiteEntries[0];

  // ── Tab definitions ─────────────────────────────────────────────────────────
  const tabIcons: Record<Tab, JSX.Element> = {
    weight: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M12 7v10m-4 0h8" />
      </svg>
    ),
    appetite: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21c4.418 0 8-3.582 8-8S16.418 3 12 3 4 6.582 4 11c0 2.89 1.532 5.422 3.828 6.828L12 21Z" />
      </svg>
    ),
    activity: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="m3 12 4-4 4 8 4-6 2 2h4" />
      </svg>
    ),
    appointments: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 3v3m8-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" />
      </svg>
    ),
    records: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5h6m-6 4h6m-6 4h4m-7 8h12a2 2 0 0 0 2-2V5l-4-2H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2Z" />
      </svg>
    ),
  };

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "weight", label: "Cân nặng" },
    { id: "appetite", label: "Ăn uống" },
    { id: "activity", label: "Hoạt động" },
    { id: "appointments", label: "Lịch khám", count: filteredReminders.length },
    { id: "records", label: "Lịch sử", count: filteredRecords.length },
  ];

  if (!isOwner) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-14 text-center">
        <svg className="h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        <p className="mt-3 font-medium text-slate-500">Sổ sức khỏe chỉ hiển thị với chủ nuôi.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {error ? (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
          <button onClick={() => setError(null)} className="ml-auto text-rose-400 hover:text-rose-600">✕</button>
        </div>
      ) : null}
      {notice ? (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {notice}
          <button onClick={() => setNotice(null)} className="ml-auto text-emerald-400 hover:text-emerald-600">✕</button>
        </div>
      ) : null}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-500">Health</p>
          <h2 className="mt-0.5 text-2xl font-semibold text-slate-900">Sổ sức khỏe</h2>
        </div>
        {/* Quick snapshot */}
        <div className="flex items-center gap-3">
          {latestWeight && (
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-center">
              <p className="text-lg font-semibold text-slate-900">{latestWeight} <span className="text-xs font-normal text-slate-400">kg</span></p>
              <p className="text-[11px] text-slate-400">Cân nặng</p>
            </div>
          )}
          {latestAppetite && (
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-center">
              <p className="text-lg font-semibold text-slate-900">{APPETITE_LEVEL_LABELS[latestAppetite.level]}</p>
              <p className="text-[11px] text-slate-400">Mức ăn</p>
            </div>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div className="rounded-2xl border border-slate-200 bg-white/90 p-1.5 shadow-sm">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`mr-1 inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition-all last:mr-0 ${
              tab === t.id
                ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-sm"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            }`}
          >
            {tabIcons[t.id]}
            {t.label}
            {t.count !== undefined && t.count > 0 ? (
              <span className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold ${tab === t.id ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"}`}>
                {t.count}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Lọc thời gian</span>
        {([
          ["7d", "7 ngày"],
          ["30d", "30 ngày"],
          ["90d", "90 ngày"],
          ["all", "Tất cả"],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setTimeFilter(value)}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
              timeFilter === value
                ? "bg-emerald-500 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {label}
          </button>
        ))}
        <label className="flex items-center gap-2 text-xs text-slate-600">
          <input
            type="checkbox"
            checked={notesOnly}
            onChange={(e) => setNotesOnly(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-emerald-500"
          />
          Chỉ mục có ghi chú
        </label>
        <div className="ml-auto flex flex-wrap items-center gap-2 text-xs text-slate-600">
          <label className="flex items-center gap-1.5">
            <span>Từ ngày</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs"
              max={toDate || undefined}
            />
          </label>
          <label className="flex items-center gap-1.5">
            <span>Đến ngày</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs"
              min={fromDate || undefined}
            />
          </label>
          {(fromDate || toDate) && (
            <button
              type="button"
              onClick={() => {
                setFromDate("");
                setToDate("");
              }}
              className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200"
            >
              Xóa ngày
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Chia sẻ social</span>
        <label className="flex items-center gap-2 text-xs text-slate-600">
          <span>Template</span>
          <select
            value={shareTemplate}
            onChange={(e) => setShareTemplate(e.target.value as ShareTemplate)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs"
          >
            <option value="diary">Nhật ký</option>
            <option value="alert">Thông báo</option>
            <option value="milestone">Thành tích</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-xs text-slate-600">
          <span>Giọng văn</span>
          <select
            value={shareTone}
            onChange={(e) => setShareTone(e.target.value as ShareTone)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs"
          >
            <option value="friendly">Thân thiện</option>
            <option value="expert">Chuyên nghiệp</option>
            <option value="fun">Vui vẻ</option>
          </select>
        </label>
      </div>

      {/* ── WEIGHT TAB ── */}
      {tab === "weight" && (
        <div className="space-y-4">
          {/* Quick add form */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-500 text-white">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              </span>
              <div>
                <p className="font-semibold text-slate-900">Ghi nhận cân nặng</p>
                <p className="text-sm text-slate-500">Cập nhật cân nặng mới nhất</p>
              </div>
            </div>
            <form onSubmit={(e) => void submitWeight(e)} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="block sm:col-span-1">
                  <span className="mb-1 block text-xs font-medium text-slate-600">Cân nặng (kg) *</span>
                  <input type="number" step="0.1" min="0" value={weightForm.weightKg}
                    onChange={(e) => setWeightForm((f) => ({ ...f, weightKg: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm transition placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                    placeholder="VD: 4.5" required />
                </label>
                <label className="block sm:col-span-1">
                  <span className="mb-1 block text-xs font-medium text-slate-600">Ngày</span>
                  <input type="date" value={weightForm.date}
                    onChange={(e) => setWeightForm((f) => ({ ...f, date: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm transition focus:border-blue-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100" />
                </label>
                <label className="block sm:col-span-1">
                  <span className="mb-1 block text-xs font-medium text-slate-600">Ghi chú</span>
                  <input type="text" value={weightForm.note}
                    onChange={(e) => setWeightForm((f) => ({ ...f, note: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm transition placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                    placeholder="VD: Sau bữa ăn" />
                </label>
              </div>
              <button type="submit" disabled={saving}
                className="w-full rounded-full bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:opacity-60">
                {saving ? "Đang lưu..." : "Lưu cân nặng"}
              </button>
            </form>
          </div>

          {/* Chart */}
          {weightChartData.length > 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="mb-4 text-sm font-semibold text-slate-700">Xu hướng 30 ngày</p>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weightChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} domain={["auto", "auto"]} />
                    <Tooltip contentStyle={{ borderRadius: "0.75rem", border: "1px solid #e2e8f0", fontSize: 12 }}
                      formatter={(v) => [`${v} kg`, "Cân nặng"]} />
                    <Line type="monotone" dataKey="weight" stroke="#3b82f6" strokeWidth={2} dot={{ fill: "#3b82f6", r: 3 }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-10 text-center">
              <svg className="h-8 w-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>
              <p className="mt-2 text-sm text-slate-500">Chưa có dữ liệu cân nặng</p>
            </div>
          )}

          {/* History list */}
          <div className="space-y-2">
            <p className="px-1 text-sm font-semibold text-slate-700">Lịch sử</p>
            {pagedWeightEntries.map((e) => (
              <div key={e.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-500">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>
                  </span>
                  <div>
                    <p className="font-medium text-slate-900">{e.weightKg} kg</p>
                    <p className="text-xs text-slate-400">{formatDate(e.recordedAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {e.note && <p className="max-w-[180px] truncate text-xs text-slate-500">{e.note}</p>}
                  <button
                    type="button"
                    onClick={() => shareWeightToFeed(e)}
                    disabled={sharingKey === `weight-${e.id}`}
                    className="rounded-full border border-sky-300 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 transition hover:bg-sky-100 disabled:opacity-60"
                  >
                    {sharingKey === `weight-${e.id}` ? "Đang chia sẻ..." : "Chia sẻ lên bảng tin"}
                  </button>
                </div>
              </div>
            ))}
            {renderPager("weight", filteredWeightEntries.length)}
          </div>
        </div>
      )}

      {/* ── APPETITE TAB ── */}
      {tab === "appetite" && (
        <div className="space-y-4">
          {/* Quick add */}
          <div className="rounded-2xl border border-slate-200 bg-white">
            <form onSubmit={(e) => void submitAppetite(e)} className="px-5 py-4 space-y-3">
              <div>
                <p className="mb-2 text-sm font-semibold text-slate-700">Mức ăn hôm nay</p>
                <div className="flex flex-wrap gap-2">
                  {(["GOOD", "NORMAL", "POOR", "NONE"] as const).map((lvl) => (
                    <button key={lvl} type="button" onClick={() => setAppetiteForm((f) => ({ ...f, level: lvl }))}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                        appetiteForm.level === lvl
                          ? `${getAppetiteBgClass(lvl)} border-2 border-current`
                          : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                      }`}>
                      {APPETITE_LEVEL_LABELS[lvl]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-slate-600">Ngày</span>
                  <input type="date" value={appetiteForm.date}
                    onChange={(e) => setAppetiteForm((f) => ({ ...f, date: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm transition focus:border-amber-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-100" />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-slate-600">Ghi chú</span>
                  <input type="text" value={appetiteForm.note}
                    onChange={(e) => setAppetiteForm((f) => ({ ...f, note: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm transition placeholder:text-slate-400 focus:border-amber-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-100"
                    placeholder="VD: Ăn ít hơn bình thường" />
                </label>
              </div>
              <button type="submit" disabled={saving}
                className="rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:opacity-60">
                {saving ? "Đang lưu..." : "Lưu mức ăn"}
              </button>
            </form>
          </div>

          {/* Chart */}
          {appetiteChartData.length > 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="mb-4 text-sm font-semibold text-slate-700">Xu hướng 30 ngày</p>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={appetiteChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} domain={[0, 5]}
                      ticks={[1, 2, 3, 4]}
                      tickFormatter={(v) => ["", "Không ăn", "Kém", "BT", "Tốt"][v] ?? ""} />
                    <Tooltip contentStyle={{ borderRadius: "0.75rem", border: "1px solid #e2e8f0", fontSize: 12 }}
                      formatter={(_v, _n, props) => [props.payload?.levelLabel ?? "", "Mức ăn"]} />
                    <Bar dataKey="level" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-10 text-center">
              <svg className="h-8 w-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
              <p className="mt-2 text-sm text-slate-500">Chưa có dữ liệu ăn uống</p>
            </div>
          )}

          {/* History */}
          <div className="space-y-2">
            <p className="px-1 text-sm font-semibold text-slate-700">Lịch sử</p>
            {pagedAppetiteEntries.map((e) => (
              <div key={e.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${getAppetiteBgClass(e.level)}`}>
                    {APPETITE_LEVEL_LABELS[e.level]}
                  </span>
                  <div>
                    <p className="font-medium text-slate-900">{APPETITE_LEVEL_LABELS[e.level]}</p>
                    <p className="text-xs text-slate-400">{formatDate(e.recordedAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {e.note && <p className="max-w-[180px] truncate text-xs text-slate-500">{e.note}</p>}
                  <button
                    type="button"
                    onClick={() => shareAppetiteToFeed(e)}
                    disabled={sharingKey === `appetite-${e.id}`}
                    className="rounded-full border border-sky-300 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 transition hover:bg-sky-100 disabled:opacity-60"
                  >
                    {sharingKey === `appetite-${e.id}` ? "Đang chia sẻ..." : "Chia sẻ lên bảng tin"}
                  </button>
                </div>
              </div>
            ))}
            {renderPager("appetite", filteredAppetiteEntries.length)}
          </div>
        </div>
      )}

      {/* ── ACTIVITY TAB ── */}
      {tab === "activity" && (
        <div className="space-y-4">
          {/* Quick add */}
          <div className="rounded-2xl border border-slate-200 bg-white">
            <form onSubmit={(e) => void submitActivity(e)} className="px-5 py-4 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-slate-600">Thời gian (phút) *</span>
                  <input type="number" min="1" value={activityForm.minutes}
                    onChange={(e) => setActivityForm((f) => ({ ...f, minutes: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm transition placeholder:text-slate-400 focus:border-emerald-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    placeholder="VD: 30" required />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-slate-600">Loại hoạt động</span>
                  <select value={activityForm.activityType}
                    onChange={(e) => setActivityForm((f) => ({ ...f, activityType: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm transition focus:border-emerald-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100">
                    {ACTIVITY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-slate-600">Ngày</span>
                  <input type="date" value={activityForm.date}
                    onChange={(e) => setActivityForm((f) => ({ ...f, date: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm transition focus:border-emerald-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100" />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-slate-600">Ghi chú</span>
                  <input type="text" value={activityForm.note}
                    onChange={(e) => setActivityForm((f) => ({ ...f, note: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm transition placeholder:text-slate-400 focus:border-emerald-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    placeholder="VD: Ra công viên" />
                </label>
              </div>
              <button type="submit" disabled={saving}
                className="rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-60">
                {saving ? "Đang lưu..." : "Lưu hoạt động"}
              </button>
            </form>
          </div>

          {/* Chart */}
          {activityChartData.length > 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="mb-4 text-sm font-semibold text-slate-700">Phút hoạt động theo ngày</p>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={activityChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} domain={[0, "auto"]} />
                    <Tooltip contentStyle={{ borderRadius: "0.75rem", border: "1px solid #e2e8f0", fontSize: 12 }}
                      formatter={(v) => [`${v} phút`, "Hoạt động"]} />
                    <Bar dataKey="minutes" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-10 text-center">
              <svg className="h-8 w-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              <p className="mt-2 text-sm text-slate-500">Chưa có dữ liệu hoạt động</p>
            </div>
          )}

          {/* History */}
          <div className="space-y-2">
            <p className="px-1 text-sm font-semibold text-slate-700">Lịch sử</p>
            {pagedActivityEntries.map((e) => (
              <div key={e.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  </span>
                  <div>
                    <p className="font-medium text-slate-900">{e.activityType}</p>
                    <p className="text-xs text-slate-400">{formatDate(e.recordedAt)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-emerald-600">{e.minutes} phút</p>
                  {e.note && <p className="text-xs text-slate-400">{e.note}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => shareActivityToFeed(e)}
                  disabled={sharingKey === `activity-${e.id}`}
                  className="ml-3 rounded-full border border-sky-300 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 transition hover:bg-sky-100 disabled:opacity-60"
                >
                  {sharingKey === `activity-${e.id}` ? "Đang chia sẻ..." : "Chia sẻ lên bảng tin"}
                </button>
              </div>
            ))}
            {renderPager("activity", filteredActivityEntries.length)}
          </div>
        </div>
      )}

      {/* ── APPOINTMENTS TAB ── */}
      {tab === "appointments" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Lọc trạng thái</span>
            {([
              ["pending", "Chưa xong"],
              ["done", "Đã xong"],
              ["all", "Tất cả"],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setAppointmentStatusFilter(value)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                  appointmentStatusFilter === value
                    ? "bg-rose-500 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="rounded-2xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-800">
            Muốn chia sẻ nhanh? Bấm <span className="font-semibold">Chia sẻ lên bảng tin</span> dưới từng mục, xem trước rồi đăng.
          </div>

          {/* Add reminder form */}
          <div className="rounded-2xl border border-slate-200 bg-white">
            <button type="button" onClick={() => setShowReminderForm((v) => !v)}
              className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-slate-50">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-500 text-white">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                </span>
                <div>
                  <p className="font-semibold text-slate-900">Thêm lịch nhắc nhở</p>
                  <p className="text-sm text-slate-500">Tiêm phòng, khám định kỳ, tẩy giun...</p>
                </div>
              </div>
              <svg className={`h-5 w-5 text-slate-400 transition-transform ${showReminderForm ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showReminderForm && (
              <form onSubmit={(e) => void submitReminder(e)} className="border-t border-slate-100 px-5 py-4 space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block sm:col-span-2">
                    <span className="mb-1 block text-xs font-medium text-slate-600">Tiêu đề *</span>
                    <input value={reminderForm.title}
                      onChange={(e) => setReminderForm((f) => ({ ...f, title: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm transition placeholder:text-slate-400 focus:border-rose-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-100"
                      placeholder="VD: Tiêm vaccine dại lần 2" required />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-slate-600">Loại</span>
                    <select value={reminderForm.reminderType}
                      onChange={(e) => setReminderForm((f) => ({ ...f, reminderType: e.target.value as PetHealthRecordType }))}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm transition focus:border-rose-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-100">
                      {RECORD_TYPES.map((t) => <option key={t} value={t}>{HEALTH_RECORD_TYPE_LABELS[t]}</option>)}
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-slate-600">Ngày nhắc *</span>
                    <input type="date" value={reminderForm.dueDate}
                      onChange={(e) => setReminderForm((f) => ({ ...f, dueDate: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm transition focus:border-rose-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-100"
                      required />
                  </label>
                  <label className="block sm:col-span-2">
                    <span className="mb-1 block text-xs font-medium text-slate-600">Nơi khám thú y</span>
                    <input value={reminderForm.clinicName}
                      onChange={(e) => setReminderForm((f) => ({ ...f, clinicName: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm transition placeholder:text-slate-400 focus:border-rose-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-100"
                      placeholder="VD: Bệnh viện thú y PetCare" />
                  </label>
                  <div className="sm:col-span-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="text-xs font-medium text-slate-600">
                        Bán kính
                        <select
                          value={vetRadiusKm}
                          onChange={(e) => setVetRadiusKm(Number(e.target.value))}
                          className="ml-2 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs"
                        >
                          {[1, 3, 5, 10, 15].map((km) => (
                            <option key={km} value={km}>
                              {km} km
                            </option>
                          ))}
                        </select>
                      </label>
                      <button
                        type="button"
                        onClick={() => void requestVetLocation()}
                        className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        Lấy GPS
                      </button>
                      <button
                        type="button"
                        onClick={() => void searchNearbyVets()}
                        disabled={vetSearching}
                        className="rounded-full bg-rose-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-600 disabled:opacity-60"
                      >
                        {vetSearching ? "Đang quét..." : "Quét thú y gần đây"}
                      </button>
                    </div>
                    {vetSearchError ? <p className="mt-2 text-xs text-rose-600">{vetSearchError}</p> : null}
                    {vetResults.length > 0 ? (
                      <div className="mt-2 max-h-44 space-y-2 overflow-y-auto">
                        {vetResults.slice(0, 12).map((vet) => (
                          <button
                            key={vet.id}
                            type="button"
                            onClick={() =>
                              setReminderForm((f) => ({
                                ...f,
                                clinicName: vet.name,
                                note: f.note || (vet.address ?? ""),
                                reminderType: "CHECKUP",
                              }))
                            }
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-left hover:bg-slate-50"
                          >
                            <p className="text-xs font-semibold text-slate-900">{vet.name}</p>
                            <p className="text-[11px] text-slate-600">
                              {vet.distanceKm < 1 ? `${(vet.distanceKm * 1000).toFixed(0)} m` : `${vet.distanceKm.toFixed(2)} km`}
                              {vet.address ? ` · ${vet.address}` : ""}
                            </p>
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <label className="block sm:col-span-2">
                    <span className="mb-1 block text-xs font-medium text-slate-600">Ghi chú</span>
                    <input value={reminderForm.note}
                      onChange={(e) => setReminderForm((f) => ({ ...f, note: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm transition placeholder:text-slate-400 focus:border-rose-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-100"
                      placeholder="VD: Tiêm mũi nhắc lại, mang sổ tiêm" />
                  </label>
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={saving}
                    className="flex-1 rounded-full bg-rose-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:opacity-60">
                    {saving ? "Đang lưu..." : "Tạo nhắc nhở"}
                  </button>
                  <button type="button" onClick={() => setShowReminderForm(false)}
                    className="rounded-full border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">
                    Hủy
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Reminder list */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <svg className="h-5 w-5 animate-spin text-slate-300" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            </div>
          ) : filteredReminders.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-12 text-center">
              <svg className="h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="mt-3 font-medium text-slate-500">Không có lịch phù hợp bộ lọc</p>
              <p className="mt-1 text-sm text-slate-400">Đổi bộ lọc hoặc thêm lịch mới để xem dữ liệu.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {pagedReminders.map((r) => {
                const days = daysUntil(r.dueDate);
                const urgent = r.status === "PENDING" && days <= 7;
                return (
                  <div key={r.id} className={`flex items-center justify-between rounded-2xl border px-4 py-3.5 ${
                    urgent ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-white"
                  }`}>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${RECORD_TYPE_COLORS[r.reminderType]}`}>
                          {HEALTH_RECORD_TYPE_LABELS[r.reminderType]}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                            r.status === "PENDING"
                              ? "bg-amber-100 text-amber-700"
                              : r.status === "COMPLETED"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {REMINDER_STATUS_LABELS[r.status] ?? r.status}
                        </span>
                        {urgent && <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-800">Sắp tới</span>}
                      </div>
                      <p className="mt-1 font-medium text-slate-900">{r.title}</p>
                      <p className="text-xs text-slate-500">
                        {formatDate(r.dueDate)}
                        {days === 0 ? " · Hôm nay" : days > 0 ? ` · Còn ${days} ngày` : ` · Quá ${Math.abs(days)} ngày`}
                      </p>
                    </div>
                    <div className="ml-3 shrink-0 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
                      <button
                        type="button"
                        onClick={() => shareReminderToFeed(r)}
                        disabled={sharingKey === `reminder-${r.id}`}
                        className="rounded-full border border-sky-300 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-700 transition hover:bg-sky-100 disabled:opacity-60"
                      >
                        {sharingKey === `reminder-${r.id}` ? "Đang chia sẻ..." : "Chia sẻ lên bảng tin"}
                      </button>
                      {r.status === "PENDING" ? (
                        <button type="button" onClick={() => void handleCompleteReminder(r.id)}
                          className="rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-600">
                          Đã xong
                        </button>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-semibold text-slate-500">
                          Đã lưu lịch sử
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
              {renderPager("appointments", filteredReminders.length)}
            </div>
          )}
        </div>
      )}

      {/* ── RECORDS TAB ── */}
      {tab === "records" && (
        <div className="space-y-4">
          {/* Add record form */}
          <div className="rounded-2xl border border-slate-200 bg-white">
            <button type="button" onClick={() => setShowRecordForm((v) => !v)}
              className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-slate-50">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-500 text-white">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                </span>
                <div>
                  <p className="font-semibold text-slate-900">Thêm hồ sơ sức khỏe</p>
                  <p className="text-sm text-slate-500">Lưu lịch sử khám, tiêm phòng, tẩy giun...</p>
                </div>
              </div>
              <svg className={`h-5 w-5 text-slate-400 transition-transform ${showRecordForm ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showRecordForm && (
              <form onSubmit={(e) => void submitRecord(e)} className="border-t border-slate-100 px-5 py-4 space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block sm:col-span-2">
                    <span className="mb-1 block text-xs font-medium text-slate-600">Tiêu đề *</span>
                    <input value={recordForm.title}
                      onChange={(e) => setRecordForm((f) => ({ ...f, title: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm transition placeholder:text-slate-400 focus:border-violet-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-100"
                      placeholder="VD: Tiêm 5 bệnh cho chó" required />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-slate-600">Loại</span>
                    <select value={recordForm.recordType}
                      onChange={(e) => setRecordForm((f) => ({ ...f, recordType: e.target.value as PetHealthRecordType }))}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm transition focus:border-violet-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-100">
                      {RECORD_TYPES.map((t) => <option key={t} value={t}>{HEALTH_RECORD_TYPE_LABELS[t]}</option>)}
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-slate-600">Ngày thực hiện *</span>
                    <input type="date" value={recordForm.performedAt}
                      onChange={(e) => setRecordForm((f) => ({ ...f, performedAt: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm transition focus:border-violet-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-100"
                      required />
                  </label>
                  <label className="block sm:col-span-2">
                    <span className="mb-1 block text-xs font-medium text-slate-600">Phòng khám</span>
                    <input value={recordForm.clinicName}
                      onChange={(e) => setRecordForm((f) => ({ ...f, clinicName: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm transition placeholder:text-slate-400 focus:border-violet-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-100"
                      placeholder="VD: Bệnh viện thú y PetCare" />
                  </label>
                  <label className="block sm:col-span-2">
                    <span className="mb-1 block text-xs font-medium text-slate-600">Ghi chú</span>
                    <textarea rows={2} value={recordForm.description}
                      onChange={(e) => setRecordForm((f) => ({ ...f, description: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm transition placeholder:text-slate-400 focus:border-violet-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-100"
                      placeholder="VD: Chó khỏe, không phản ứng phụ..." />
                  </label>
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={saving}
                    className="flex-1 rounded-full bg-violet-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-600 disabled:opacity-60">
                    {saving ? "Đang lưu..." : "Lưu hồ sơ"}
                  </button>
                  <button type="button" onClick={() => setShowRecordForm(false)}
                    className="rounded-full border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">
                    Hủy
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Records list */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <svg className="h-5 w-5 animate-spin text-slate-300" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-12 text-center">
              <svg className="h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="mt-3 font-medium text-slate-500">Chưa có hồ sơ sức khỏe nào</p>
              <p className="mt-1 text-sm text-slate-400">Thêm hồ sơ để lưu lịch sử khám cho pet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {pagedRecords.map((r) => (
                <div key={r.id} className="flex items-start justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${RECORD_TYPE_COLORS[r.recordType]}`}>
                        {HEALTH_RECORD_TYPE_LABELS[r.recordType]}
                      </span>
                    </div>
                    <p className="mt-1.5 font-medium text-slate-900">{r.title}</p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {formatDate(r.performedAt)}
                      {r.clinicName ? ` · ${r.clinicName}` : ""}
                    </p>
                    {r.description && <p className="mt-1.5 text-sm text-slate-600">{r.description}</p>}
                  </div>
                  <div className="ml-3 shrink-0 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => shareRecordToFeed(r)}
                      disabled={sharingKey === `record-${r.id}`}
                      className="rounded-full border border-sky-300 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 transition hover:bg-sky-100 disabled:opacity-60"
                    >
                      {sharingKey === `record-${r.id}` ? "Đang chia sẻ..." : "Chia sẻ lên bảng tin"}
                    </button>
                    <button type="button" onClick={() => void handleDeleteRecord(r.id)}
                      className="text-xs font-medium text-rose-500 transition hover:text-rose-700">
                      Xóa
                    </button>
                  </div>
                </div>
              ))}
              {renderPager("records", filteredRecords.length)}
            </div>
          )}
        </div>
      )}

      {shareDraft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 px-4">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">{shareDraft.title}</p>
                <p className="text-xs text-slate-500">Bạn có thể sửa nội dung và chọn quyền xem trước khi đăng.</p>
              </div>
              <button
                type="button"
                onClick={() => setShareDraft(null)}
                className="rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <textarea
              value={shareDraft.content}
              onChange={(e) => setShareDraft((prev) => (prev ? { ...prev, content: e.target.value } : prev))}
              rows={8}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-sky-100"
            />
            <div className="mt-2">
              <label className="text-xs text-slate-600">
                Quyền xem
                <select
                  value={shareDraft.visibility}
                  onChange={(e) =>
                    setShareDraft((prev) =>
                      prev ? { ...prev, visibility: e.target.value as "PUBLIC" | "FRIENDS" | "PRIVATE" } : prev
                    )
                  }
                  className="ml-2 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs"
                >
                  <option value="PUBLIC">Công khai</option>
                  <option value="FRIENDS">Bạn bè</option>
                  <option value="PRIVATE">Riêng tư</option>
                </select>
              </label>
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShareDraft(null)}
                className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => void confirmShareDraft()}
                disabled={sharingKey === shareDraft.key}
                className="rounded-full bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
              >
                {sharingKey === shareDraft.key ? "Đang đăng..." : "Đăng lên bảng tin"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
