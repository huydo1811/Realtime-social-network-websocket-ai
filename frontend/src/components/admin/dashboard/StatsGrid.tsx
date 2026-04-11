import type { Stat } from "./types";

type Props = {
  stats: Stat[];
};

export default function StatsGrid({ stats }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((s) => (
        <article key={s.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">{s.label}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{s.value}</p>
          <p className={`mt-1 text-xs ${s.up ? "text-emerald-600" : "text-rose-600"}`}>{s.change}</p>
        </article>
      ))}
    </div>
  );
}