"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import UserLayout from "@/components/layout/UserLayout";
import { petApi } from "@/lib/api/petApi";
import { getAuthTokens, clearAuthTokens } from "@/lib/api/authToken";
import type { CreatePetPayload, PetDto, PetSpecies } from "@/types/pet";
import type { PetHealthReminderDto } from "@/types/petHealth";

const SPECIES_OPTIONS: { value: PetSpecies; label: string }[] = [
  { value: "DOG", label: "Chó" },
  { value: "CAT", label: "Mèo" },
  { value: "BIRD", label: "Chim" },
  { value: "RABBIT", label: "Thỏ" },
  { value: "HAMSTER", label: "Hamster" },
  { value: "FISH", label: "Cá" },
  { value: "REPTILE", label: "Bò sát" },
  { value: "OTHER", label: "Khác" },
];

export default function PetsPage() {
  const router = useRouter();
  const [pets, setPets] = useState<PetDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<CreatePetPayload>({
    name: "",
    species: "CAT",
    gender: "UNKNOWN",
    visibility: "PUBLIC",
  });
  const [upcomingReminders, setUpcomingReminders] = useState<PetHealthReminderDto[]>([]);

  const loadPets = useCallback(async () => {
    const tokens = getAuthTokens();
    if (!tokens?.accessToken) {
      router.replace("/login");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [petList, reminders] = await Promise.all([
        petApi.listMine(),
        petApi.listMyUpcomingReminders().catch(() => []),
      ]);
      setPets(petList);
      setUpcomingReminders(reminders);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Không thể tải thú cưng";
      if (msg.toLowerCase().includes("unauthorized")) {
        clearAuthTokens();
        router.replace("/login");
        return;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadPets();
  }, [loadPets]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const created = await petApi.create({
        ...form,
        name: form.name.trim(),
        breed: form.breed?.trim() || undefined,
        bio: form.bio?.trim() || undefined,
      });
      setPets((prev) => [created, ...prev]);
      setForm({ name: "", species: "CAT", gender: "UNKNOWN", visibility: "PUBLIC" });
      setShowForm(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể tạo thú cưng");
    } finally {
      setSaving(false);
    }
  }

  return (
    <UserLayout>
      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-rose-100 bg-gradient-to-br from-white via-rose-50/40 to-violet-50/40 px-5 py-5 shadow-sm">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Thú cưng của tôi</h1>
            <p className="mt-1 text-sm text-slate-600">
              Quản lý hồ sơ thú cưng và gắn vào bài viết khi đăng.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="cursor-pointer rounded-xl bg-gradient-to-r from-rose-500 to-violet-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-95"
          >
            {showForm ? "Đóng" : "+ Thêm thú cưng"}
          </button>
        </div>

        {error ? (
          <div className="mb-4 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        {upcomingReminders.length > 0 ? (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <h2 className="mb-3 text-sm font-semibold text-amber-900">Nhắc nhở sắp tới</h2>
            <div className="space-y-2">
              {upcomingReminders.slice(0, 5).map((r) => (
                <Link
                  key={r.id}
                  href={`/pets/${r.petId}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-amber-100 bg-white px-3 py-2 text-sm hover:border-amber-200"
                >
                  <span className="min-w-0 truncate text-slate-800">
                    <span className="font-medium">{r.petName ?? "Thú cưng"}</span>
                    {" · "}
                    {r.title}
                  </span>
                  <span className="shrink-0 text-xs text-amber-700">
                    {new Date(r.dueDate).toLocaleDateString("vi-VN")}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ) : null}

        {showForm ? (
          <form
            onSubmit={(e) => void handleCreate(e)}
            className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Thêm hồ sơ mới</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-sm font-medium text-slate-700">Tên *</span>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-rose-100"
                  placeholder="Meow, Lucky..."
                  required
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Loài</span>
                <select
                  value={form.species}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, species: e.target.value as PetSpecies }))
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-rose-100"
                >
                  {SPECIES_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Giống</span>
                <input
                  value={form.breed ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, breed: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-rose-100"
                  placeholder="Mèo Ba Tư, Corgi..."
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-sm font-medium text-slate-700">Giới thiệu</span>
                <textarea
                  value={form.bio ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-rose-100"
                  placeholder="Tính cách, sở thích..."
                />
              </label>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="cursor-pointer rounded-full bg-rose-500 px-5 py-2 text-sm font-semibold text-white hover:bg-rose-600 disabled:opacity-60"
              >
                {saving ? "Đang lưu..." : "Tạo hồ sơ"}
              </button>
            </div>
          </form>
        ) : null}

        {loading ? (
          <p className="text-sm text-slate-500">Đang tải...</p>
        ) : pets.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center">
            <p className="text-sm text-slate-500">Chưa có thú cưng nào. Hãy thêm hồ sơ đầu tiên!</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pets.map((pet) => (
              <Link
                key={pet.id}
                href={`/pets/${pet.id}`}
                className="group flex items-center gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-rose-200 hover:shadow-md"
              >
                {pet.avatarUrl ? (
                  <Image
                    src={pet.avatarUrl}
                    alt={pet.name}
                    width={56}
                    height={56}
                    className="h-16 w-16 rounded-2xl object-cover ring-2 ring-white"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-100 text-lg font-bold text-rose-600">
                    {pet.name[0]?.toUpperCase() ?? "P"}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900">{pet.name}</p>
                  <p className="truncate text-sm text-slate-500">
                    {[pet.species, pet.breed].filter(Boolean).join(" · ")}
                  </p>
                  <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500 transition group-hover:bg-rose-100 group-hover:text-rose-600">
                    Xem chi tiết
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </UserLayout>
  );
}
