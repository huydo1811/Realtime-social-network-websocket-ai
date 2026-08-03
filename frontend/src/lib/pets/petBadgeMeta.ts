export type PetBadgeMeta = {
  icon: string;
  shortLabel: string;
  colorClass: string;
};

export const PET_BADGE_META: Record<string, PetBadgeMeta> = {
  walk_explorer: {
    icon: "🥾",
    shortLabel: "Đi dạo",
    colorClass: "bg-violet-100 text-violet-700",
  },
  care_keeper: {
    icon: "🩺",
    shortLabel: "Chăm sóc",
    colorClass: "bg-emerald-100 text-emerald-700",
  },
  health_archivist: {
    icon: "📘",
    shortLabel: "Sổ sức khỏe",
    colorClass: "bg-sky-100 text-sky-700",
  },
  walk_week_hero: {
    icon: "🏃",
    shortLabel: "Tuần đi dạo",
    colorClass: "bg-violet-100 text-violet-700",
  },
  walk_month_legend: {
    icon: "👑",
    shortLabel: "Tháng đi dạo",
    colorClass: "bg-indigo-100 text-indigo-700",
  },
  care_week_star: {
    icon: "⭐",
    shortLabel: "Chăm tuần",
    colorClass: "bg-emerald-100 text-emerald-700",
  },
  night_owl_walk: {
    icon: "🌙",
    shortLabel: "Cú đêm",
    colorClass: "bg-slate-200 text-slate-700",
  },
  early_bird_care: {
    icon: "🌅",
    shortLabel: "Chim sớm",
    colorClass: "bg-amber-100 text-amber-700",
  },
  care_month_guardian: {
    icon: "🛡️",
    shortLabel: "Chăm tháng",
    colorClass: "bg-teal-100 text-teal-700",
  },
  health_week_tracker: {
    icon: "📊",
    shortLabel: "SK tuần",
    colorClass: "bg-sky-100 text-sky-700",
  },
};

export function getPetBadgeMeta(key: string): PetBadgeMeta {
  return (
    PET_BADGE_META[key] ?? {
      icon: "🏅",
      shortLabel: "Huy hiệu",
      colorClass: "bg-amber-100 text-amber-700",
    }
  );
}
