import type { QueueItem } from "./types";

type Props = {
  items: QueueItem[];
};

function riskClass(risk: QueueItem["risk"]) {
  if (risk === "High") return "bg-rose-100 text-rose-700";
  if (risk === "Medium") return "bg-amber-100 text-amber-700";
  return "bg-emerald-100 text-emerald-700";
}

export default function ModerationQueueCard({ items }: Props) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-semibold">Hàng chờ moderation</h3>
        <button className="text-xs text-rose-600 hover:underline">Xem tất cả</button>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="rounded-xl border border-slate-200 p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-xs text-slate-500">
                  {item.id} - @{item.author}
                </p>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${riskClass(item.risk)}`}>
                {item.risk}
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-500">Tạo lúc {item.createdAt}</p>
          </div>
        ))}
        {items.length === 0 ? (
          <div className="rounded-xl border border-slate-200 p-3 text-xs text-slate-500">
            Không có mục cần xử lý trong hàng chờ.
          </div>
        ) : null}
      </div>
    </article>
  );
}