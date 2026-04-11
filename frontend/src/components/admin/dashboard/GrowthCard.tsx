export default function GrowthCard() {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-semibold">Tăng trưởng 7 ngày</h3>
        <span className="text-xs text-slate-500">Người dùng mới</span>
      </div>
      <div className="grid h-44 grid-cols-7 items-end gap-2 rounded-xl bg-slate-50 p-3">
        {[38, 52, 41, 64, 58, 72, 66].map((h, idx) => (
          <div key={idx} className="rounded-md bg-rose-400/90" style={{ height: `${h}%` }} />
        ))}
      </div>
    </article>
  );
}