"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { petApi } from "@/lib/api/petApi";
import type { PetDto } from "@/types/pet";

type Props = {
  userId: number;
  isOwnProfile?: boolean;
  refreshKey?: number;
};

const SPECIES_ICONS: Record<string, string> = {
  DOG: "🐶", CAT: "🐱", BIRD: "🐦", RABBIT: "🐰",
  HAMSTER: "🐹", FISH: "🐟", REPTILE: "🦎", OTHER: "🐾",
};

const SPECIES_LABELS: Record<string, string> = {
  DOG: "Chó", CAT: "Mèo", BIRD: "Chim", RABBIT: "Thỏ",
  HAMSTER: "Hamster", FISH: "Cá", REPTILE: "Bò sát", OTHER: "Khác",
};

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  DECEASED: "bg-slate-100 text-slate-600",
  ADOPTED_OUT: "bg-amber-100 text-amber-700",
};

function calcAge(birthDate?: string | null): string {
  if (!birthDate) return "";
  const d = new Date(birthDate);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  let years = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) years -= 1;
  if (years < 1) {
    const months = Math.max(0, (now.getFullYear() - d.getFullYear()) * 12 + m);
    return `${months} tháng`;
  }
  return `${years} tuổi`;
}

export default function ProfilePetsSection({ userId, isOwnProfile = false, refreshKey = 0 }: Props) {
  const [pets, setPets] = useState<PetDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId || !Number.isFinite(userId)) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    petApi
      .listByUser(userId)
      .then((rows) => {
        if (cancelled) return;
        setPets(rows);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Không thể tải thú cưng");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId, refreshKey]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="animate-pulse rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-full bg-slate-100" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-24 rounded bg-slate-100" />
                <div className="h-3 w-16 rounded bg-slate-100" />
              </div>
            </div>
            <div className="mt-3 h-3 w-full rounded bg-slate-100" />
            <div className="mt-2 h-3 w-2/3 rounded bg-slate-100" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
        {error}
      </div>
    );
  }

  if (pets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-14 text-center">
        <span className="text-4xl">🐾</span>
        <h4 className="mt-3 text-sm font-bold text-slate-700">
          {isOwnProfile ? "Bạn chưa có thú cưng nào" : "Người dùng này chưa có thú cưng"}
        </h4>
        <p className="mt-1 text-xs text-slate-500">
          {isOwnProfile
            ? "Hãy vào trang Thú cưng để thêm hồ sơ cho các bé."
            : "Khi họ thêm thú cưng, chúng sẽ xuất hiện tại đây."}
        </p>
        {isOwnProfile ? (
          <Link
            href="/pets"
            className="mt-4 inline-flex items-center gap-1 rounded-full bg-rose-500 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-600"
          >
            + Thêm thú cưng
          </Link>
        ) : null}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {pets.map((pet) => {
        const age = calcAge(pet.birthDate);
        return (
          <Link
            key={pet.id}
            href={`/pets/${pet.id}`}
            className="group block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-rose-200 hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-rose-50">
                {pet.avatarUrl ? (
                  <Image
                    src={pet.avatarUrl}
                    alt={pet.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center text-2xl">
                    {SPECIES_ICONS[pet.species] ?? "🐾"}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-900 group-hover:text-rose-600">
                  {pet.name}
                </p>
                <p className="truncate text-xs text-slate-500">
                  {SPECIES_LABELS[pet.species] ?? pet.species}
                  {pet.breed ? ` · ${pet.breed}` : ""}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  STATUS_STYLES[pet.status] ?? "bg-slate-100 text-slate-600"
                }`}
              >
                {pet.status}
              </span>
            </div>

            {pet.bio ? (
              <p className="mt-3 line-clamp-2 text-xs text-slate-600">{pet.bio}</p>
            ) : null}

            <div className="mt-3 flex items-center gap-3 text-[11px] text-slate-500">
              {age ? <span>🎂 {age}</span> : null}
              {pet.weightKg != null ? <span>⚖️ {pet.weightKg} kg</span> : null}
              {pet.gender && pet.gender !== "UNKNOWN" ? (
                <span>
                  {pet.gender === "MALE" ? "♂ Đực" : "♀ Cái"}
                </span>
              ) : null}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
