type Props = {
  title?: string;
  subtitle?: string;
  points?: number[];
  labels?: string[];
};

export default function GrowthCard({
  title = "Tăng trưởng 7 ngày",
  subtitle = "Người dùng mới",
  points,
  labels,
}: Props) {
  const chartPoints = points && points.length > 0 ? points : [38, 52, 41, 64, 58, 72, 66];
  const chartLabels = labels && labels.length === chartPoints.length ? labels : chartPoints.map((_, idx) => String(idx + 1));
  const max = Math.max(...chartPoints, 1);
  const columns = `repeat(${chartPoints.length}, minmax(12px, 1fr))`;

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-semibold">{title}</h3>
        <span className="text-xs text-slate-500">{subtitle}</span>
      </div>
      <div className="grid h-44 items-end gap-2 rounded-xl bg-slate-50 p-3" style={{ gridTemplateColumns: columns }}>
        {chartPoints.map((value, idx) => (
          <div
            key={idx}
            className="rounded-md bg-rose-400/90"
            style={{ height: `${Math.max((value / max) * 100, 6)}%` }}
            title={`${chartLabels[idx]}: ${value}`}
          />
        ))}
      </div>
      <div className="mt-2 grid gap-2 text-[10px] text-slate-500" style={{ gridTemplateColumns: columns }}>
        {chartLabels.map((label, idx) => {
          const shouldShow = chartLabels.length <= 10 || idx % Math.ceil(chartLabels.length / 10) === 0 || idx === chartLabels.length - 1;
          return (
            <span key={`${label}-${idx}`} className="truncate text-center" title={label}>
              {shouldShow ? label : ""}
            </span>
          );
        })}
      </div>
    </article>
  );
}