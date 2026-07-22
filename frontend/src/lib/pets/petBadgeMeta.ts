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
