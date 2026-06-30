"use client";

import { useCallback, useEffect, useState } from "react";

import { petApi } from "@/lib/api/petApi";
import type { PetHealthRecordType } from "@/types/petHealth";
import {
  HEALTH_RECORD_TYPE_LABELS,
  type PetHealthRecordDto,
  type PetHealthReminderDto,
} from "@/types/petHealth";

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

function formatDate(input: string) {
  const dt = new Date(input);
  if (Number.isNaN(dt.getTime())) return input;
  return dt.toLocaleDateString("vi-VN");
}

function daysUntil(dueDate: string) {
  const due = new Date(dueDate);
  const today = new Date();
  due.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return Math.ceil((due.getTime() - today.getTime()) / 86_400_000);
}

export default function PetHealthSection({ petId, isOwner }: Props) {
  const [records, setRecords] = useState<PetHealthRecordDto[]>([]);
  const [reminders, setReminders] = useState<PetHealthReminderDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRecordForm, setShowRecordForm] = useState(false);
  const [showReminderForm, setShowReminderForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [recordForm, setRecordForm] = useState({
    recordType: "VACCINE" as PetHealthRecordType,
    title: "",
    description: "",
    performedAt: new Date().toISOString().slice(0, 10),
    clinicName: "",
  });

  const [reminderForm, setReminderForm] = useState({
    reminderType: "VACCINE" as PetHealthRecordType,
    title: "",
    dueDate: "",
    note: "",
  });

  const load = useCallback(async () => {
    if (!isOwner) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [recordData, reminderData] = await Promise.all([
        petApi.listHealthRecords(petId),
        petApi.listReminders(petId),
      ]);
      setRecords(recordData);
      setReminders(reminderData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể tải sổ sức khỏe");
    } finally {
      setLoading(false);
    }
  }, [isOwner, petId]);

  useEffect(() => {
    void load();
  }, [load]);

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
      setRecordForm({
        recordType: "VACCINE",
        title: "",
        description: "",
        performedAt: new Date().toISOString().slice(0, 10),
        clinicName: "",
      });
      setShowRecordForm(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể thêm hồ sơ");
    } finally {
      setSaving(false);
    }
  }

  async function submitReminder(e: React.FormEvent) {
    e.preventDefault();
    if (!reminderForm.title.trim() || !reminderForm.dueDate) return;
    setSaving(true);
    try {
      const created = await petApi.createReminder(petId, {
        reminderType: reminderForm.reminderType,
        title: reminderForm.title.trim(),
        dueDate: reminderForm.dueDate,
        note: reminderForm.note.trim() || undefined,
      });
      setReminders((prev) => [...prev, created].sort((a, b) => a.dueDate.localeCompare(b.dueDate)));
      setReminderForm({ reminderType: "VACCINE", title: "", dueDate: "", note: "" });
      setShowReminderForm(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể tạo nhắc nhở");
    } finally {
      setSaving(false);
    }
  }

  async function handleCompleteReminder(reminderId: number) {
    try {
      await petApi.completeReminder(petId, reminderId);
      setReminders((prev) => prev.filter((r) => r.id !== reminderId));
      window.dispatchEvent(new CustomEvent("pet-reminder-changed"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể cập nhật nhắc nhở");
    }
  }

  async function handleDeleteRecord(recordId: number) {
    try {
      await petApi.deleteHealthRecord(petId, recordId);
      setRecords((prev) => prev.filter((r) => r.id !== recordId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể xóa hồ sơ");
    }
  }

  if (!isOwner) {
    return (
      <p className="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-500">
        Sổ sức khỏe chỉ hiển thị với chủ nuôi.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {error ? (
        <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">Nhắc nhở sắp tới</h2>
          <button
            type="button"
            onClick={() => setShowReminderForm((v) => !v)}
            className="cursor-pointer rounded-full border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50"
          >
            {showReminderForm ? "Đóng" : "+ Thêm nhắc nhở"}
          </button>
        </div>

        {showReminderForm ? (
          <form onSubmit={(e) => void submitReminder(e)} className="mb-4 rounded-2xl border border-slate-200 bg-white p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-xs font-medium text-slate-600">Tiêu đề *</span>
                <input
                  value={reminderForm.title}
                  onChange={(e) => setReminderForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Tiêm vaccine lần 2"
                  required
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-600">Loại</span>
                <select
                  value={reminderForm.reminderType}
                  onChange={(e) =>
                    setReminderForm((f) => ({
                      ...f,
                      reminderType: e.target.value as PetHealthRecordType,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                >
                  {RECORD_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {HEALTH_RECORD_TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-600">Ngày nhắc *</span>
                <input
                  type="date"
                  value={reminderForm.dueDate}
                  onChange={(e) => setReminderForm((f) => ({ ...f, dueDate: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  required
                />
              </label>
            </div>
            <div className="mt-3 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="cursor-pointer rounded-full bg-rose-500 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-600 disabled:opacity-60"
              >
                Lưu nhắc nhở
              </button>
            </div>
          </form>
        ) : null}

        {loading ? (
          <p className="text-sm text-slate-500">Đang tải...</p>
        ) : reminders.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
            Chưa có nhắc nhở nào.
          </p>
        ) : (
          <div className="space-y-2">
            {reminders.map((r) => {
              const days = daysUntil(r.dueDate);
              const urgent = days <= 7;
              return (
                <div
                  key={r.id}
                  className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 ${
                    urgent ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900">{r.title}</p>
                    <p className="text-xs text-slate-500">
                      {HEALTH_RECORD_TYPE_LABELS[r.reminderType]} · {formatDate(r.dueDate)}
                      {days === 0 ? " · Hôm nay" : days > 0 ? ` · Còn ${days} ngày` : ` · Quá ${Math.abs(days)} ngày`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleCompleteReminder(r.id)}
                    className="cursor-pointer shrink-0 rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-600"
                  >
                    Đã xong
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">Lịch sử sức khỏe</h2>
          <button
            type="button"
            onClick={() => setShowRecordForm((v) => !v)}
            className="cursor-pointer rounded-full border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50"
          >
            {showRecordForm ? "Đóng" : "+ Thêm hồ sơ"}
          </button>
        </div>

        {showRecordForm ? (
          <form onSubmit={(e) => void submitRecord(e)} className="mb-4 rounded-2xl border border-slate-200 bg-white p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-xs font-medium text-slate-600">Tiêu đề *</span>
                <input
                  value={recordForm.title}
                  onChange={(e) => setRecordForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Tiêm 5 bệnh"
                  required
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-600">Loại</span>
                <select
                  value={recordForm.recordType}
                  onChange={(e) =>
                    setRecordForm((f) => ({
                      ...f,
                      recordType: e.target.value as PetHealthRecordType,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                >
                  {RECORD_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {HEALTH_RECORD_TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-600">Ngày thực hiện *</span>
                <input
                  type="date"
                  value={recordForm.performedAt}
                  onChange={(e) => setRecordForm((f) => ({ ...f, performedAt: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  required
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-xs font-medium text-slate-600">Phòng khám</span>
                <input
                  value={recordForm.clinicName}
                  onChange={(e) => setRecordForm((f) => ({ ...f, clinicName: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-xs font-medium text-slate-600">Ghi chú</span>
                <textarea
                  value={recordForm.description}
                  onChange={(e) => setRecordForm((f) => ({ ...f, description: e.target.value }))}
                  rows={2}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </label>
            </div>
            <div className="mt-3 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="cursor-pointer rounded-full bg-rose-500 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-600 disabled:opacity-60"
              >
                Lưu hồ sơ
              </button>
            </div>
          </form>
        ) : null}

        {loading ? null : records.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
            Chưa có hồ sơ sức khỏe nào.
          </p>
        ) : (
          <div className="space-y-2">
            {records.map((r) => (
              <div
                key={r.id}
                className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="font-medium text-slate-900">{r.title}</p>
                  <p className="text-xs text-slate-500">
                    {HEALTH_RECORD_TYPE_LABELS[r.recordType]} · {formatDate(r.performedAt)}
                    {r.clinicName ? ` · ${r.clinicName}` : ""}
                  </p>
                  {r.description ? (
                    <p className="mt-1 text-sm text-slate-600">{r.description}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => void handleDeleteRecord(r.id)}
                  className="cursor-pointer shrink-0 text-xs font-medium text-rose-600 hover:underline"
                >
                  Xóa
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
