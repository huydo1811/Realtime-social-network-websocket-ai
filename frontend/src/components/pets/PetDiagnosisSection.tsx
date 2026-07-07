"use client";

import { useCallback, useEffect, useState } from "react";
import { petApi } from "@/lib/api/petApi";
import type { PetDiagnosisDto, SubmitPetSymptomsPayload } from "@/types/petDiagnosis";

type Props = {
  petId: number;
  isOwner: boolean;
};

function formatDateTime(input: string) {
  const dt = new Date(input);
  if (Number.isNaN(dt.getTime())) return input;
  return dt.toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });
}

const SEVERITY_STYLES: Record<PetDiagnosisDto["severity"], string> = {
  LOW: "bg-emerald-100 text-emerald-700",
  MODERATE: "bg-amber-100 text-amber-700",
  HIGH: "bg-rose-100 text-rose-700",
  EMERGENCY: "bg-slate-900 text-white",
};

const SEVERITY_COLORS: Record<PetDiagnosisDto["severity"], string> = {
  LOW: "bg-emerald-400",
  MODERATE: "bg-amber-400",
  HIGH: "bg-rose-500",
  EMERGENCY: "bg-rose-700",
};

export default function PetDiagnosisSection({ petId, isOwner }: Props) {
  const [diagnoses, setDiagnoses] = useState<PetDiagnosisDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<SubmitPetSymptomsPayload>({
    symptomsText: "",
    temperatureC: undefined,
    durationHours: undefined,
    appetiteLoss: false,
    energyDrop: false,
    vomiting: false,
    diarrhea: false,
    cough: false,
    breathingDifficulty: false,
    skinRash: false,
  });

  const load = useCallback(async () => {
    if (!isOwner) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const data = await petApi.listDiagnoses(petId);
      setDiagnoses(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải lịch sử chẩn đoán");
    } finally {
      setLoading(false);
    }
  }, [isOwner, petId]);

  useEffect(() => { void load(); }, [load]);

  async function submitSymptoms(e: React.FormEvent) {
    e.preventDefault();
    if (!form.symptomsText.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const created = await petApi.submitSymptoms(petId, { ...form, symptomsText: form.symptomsText.trim() });
      setDiagnoses((prev) => [created, ...prev]);
      setForm({
        symptomsText: "", temperatureC: undefined, durationHours: undefined,
        appetiteLoss: false, energyDrop: false, vomiting: false,
        diarrhea: false, cough: false, breathingDifficulty: false, skinRash: false,
      });
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể phân tích triệu chứng");
    } finally {
      setSaving(false);
    }
  }

  if (!isOwner) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-14 text-center">
        <svg className="h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        <p className="mt-3 font-medium text-slate-500">AI chẩn đoán sớm chỉ hiển thị với chủ nuôi.</p>
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

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-500">AI Diagnosis</p>
          <h2 className="mt-0.5 text-2xl font-semibold text-slate-900">Chẩn đoán triệu chứng</h2>
        </div>
        {diagnoses.length > 0 && (
          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
            {diagnoses.length} bản ghi
          </span>
        )}
      </div>

      {/* Quick submit form */}
      <div className="rounded-2xl border border-slate-200 bg-white">
        <button type="button" onClick={() => setShowForm((v) => !v)}
          className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-slate-50">
          <div className="flex items-center gap-3">
            <span className={`flex h-9 w-9 items-center justify-center rounded-full ${showForm ? "bg-rose-500 text-white" : "bg-rose-100 text-rose-600"} transition-colors`}>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </span>
            <div>
              <p className="font-semibold text-slate-900">Ghi nhận triệu chứng</p>
              <p className="text-sm text-slate-500">Mô tả triệu chứng để AI phân tích và gợi ý bệnh</p>
            </div>
          </div>
          <svg className={`h-5 w-5 text-slate-400 transition-transform ${showForm ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showForm && (
          <form onSubmit={(e) => void submitSymptoms(e)} className="border-t border-slate-100 px-5 py-4 space-y-4">
            {/* Symptom description */}
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-600">Mô tả triệu chứng *</span>
              <textarea rows={3} value={form.symptomsText}
                onChange={(e) => setForm((v) => ({ ...v, symptomsText: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm transition placeholder:text-slate-400 focus:border-rose-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-100"
                placeholder="VD: bé bỏ ăn 2 ngày, nôn 3 lần, hơi sốt..." required />
            </label>

            {/* Temperature + Duration */}
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-600">Nhiệt độ (°C)</span>
                <input type="number" step="0.1" value={form.temperatureC ?? ""}
                  onChange={(e) => setForm((v) => ({ ...v, temperatureC: e.target.value ? Number(e.target.value) : undefined }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm transition focus:border-rose-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-100"
                  placeholder="VD: 38.5" />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-600">Thời gian (giờ)</span>
                <input type="number" min={0} value={form.durationHours ?? ""}
                  onChange={(e) => setForm((v) => ({ ...v, durationHours: e.target.value ? Number(e.target.value) : undefined }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm transition focus:border-rose-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-100"
                  placeholder="VD: 12" />
              </label>
            </div>

            {/* Symptom checkboxes */}
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {([
                ["appetiteLoss", "Bỏ ăn / ăn ít"],
                ["energyDrop", "Mệt mỏi / lờ đờ"],
                ["vomiting", "Nôn"],
                ["diarrhea", "Tiêu chảy"],
                ["cough", "Ho / hắt hơi"],
                ["breathingDifficulty", "Khó thở"],
                ["skinRash", "Ngứa / phát ban"],
              ] as const).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 transition hover:border-rose-200 cursor-pointer">
                  <input type="checkbox" checked={Boolean(form[key])}
                    onChange={(e) => setForm((v) => ({ ...v, [key]: e.target.checked }))}
                    className="h-4 w-4 rounded border-slate-300 text-rose-500" />
                  <span>{label}</span>
                </label>
              ))}
            </div>

            <div className="flex gap-2">
              <button type="submit" disabled={saving}
                className="flex-1 rounded-full bg-rose-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:opacity-60">
                {saving ? "Đang phân tích..." : "Phân tích triệu chứng"}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="rounded-full border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">
                Hủy
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Diagnosis history */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <svg className="h-5 w-5 animate-spin text-slate-300" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        </div>
      ) : diagnoses.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-12 text-center">
          <svg className="h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <p className="mt-3 font-medium text-slate-500">Chưa có chẩn đoán nào</p>
          <p className="mt-1 text-sm text-slate-400">Mô tả triệu chứng để nhận gợi ý bệnh tiềm năng từ AI.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {diagnoses.map((d) => (
            <article key={d.id} className="rounded-2xl border border-slate-200 bg-white p-5">
              {/* Top row */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${SEVERITY_STYLES[d.severity]}`}>
                      {d.severity}
                    </span>
                    <span className="text-xs text-slate-400">{formatDateTime(d.createdAt)}</span>
                  </div>
                  <h4 className="mt-2 text-base font-semibold text-slate-900">{d.summary}</h4>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-lg font-bold text-rose-500">{d.confidenceScore}%</p>
                  <p className="text-[10px] text-slate-400">tin cậy</p>
                </div>
              </div>

              {/* Disease */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-rose-50 px-3 py-1 text-sm font-semibold text-rose-700">
                  {d.likelyDisease}
                </span>
                {d.shouldSeeVet && (
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                    Nên gặp thú y
                  </span>
                )}
              </div>

              {/* Recommendation */}
              <div className="mt-3 rounded-xl bg-slate-50 px-4 py-3">
                <p className="text-sm text-slate-700">{d.recommendation}</p>
              </div>

              {/* Meta row */}
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-500">
                {d.temperatureC != null && (
                  <span className="flex items-center gap-1">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                    Sốt {d.temperatureC.toFixed(1)}°C
                  </span>
                )}
                {d.durationHours != null && (
                  <span>{d.durationHours} giờ</span>
                )}
                {d.redFlags && (
                  <span className="flex items-center gap-1 text-rose-600">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    {d.redFlags}
                  </span>
                )}
                <span className="ml-auto text-slate-400">Model: {d.modelName}</span>
              </div>

              {/* Extra details */}
              {(d.possibleCauses || d.differentialDiagnoses) && (
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {d.possibleCauses && (
                    <div className="rounded-xl bg-slate-50 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Nguyên nhân khả dĩ</p>
                      <p className="mt-1 text-sm text-slate-700">{d.possibleCauses}</p>
                    </div>
                  )}
                  {d.differentialDiagnoses && (
                    <div className="rounded-xl bg-slate-50 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Chẩn đoán phân biệt</p>
                      <p className="mt-1 text-sm text-slate-700">{d.differentialDiagnoses}</p>
                    </div>
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
