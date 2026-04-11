import type { ReportItem } from "./types";

type Props = {
  reports: ReportItem[];
};

function statusClass(status: ReportItem["status"]) {
  if (status === "New") return "bg-sky-100 text-sky-700";
  if (status === "Reviewing") return "bg-amber-100 text-amber-700";
  return "bg-emerald-100 text-emerald-700";
}

export default function ReportsTable({ reports }: Props) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-semibold">Danh sách báo cáo gần đây</h3>
        <div className="flex gap-2">
          <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs hover:bg-slate-100">Xuất CSV</button>
          <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs hover:bg-slate-100">Bộ lọc nâng cao</button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="text-slate-500">
            <tr className="border-b border-slate-200">
              <th className="py-2 pr-4 font-medium">Mã</th>
              <th className="py-2 pr-4 font-medium">Loại</th>
              <th className="py-2 pr-4 font-medium">Đối tượng</th>
              <th className="py-2 pr-4 font-medium">Lý do</th>
              <th className="py-2 pr-4 font-medium">Trạng thái</th>
              <th className="py-2 font-medium">Thời gian</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((r) => (
              <tr key={r.id} className="border-b border-slate-100">
                <td className="py-3 pr-4 font-medium text-slate-800">{r.id}</td>
                <td className="py-3 pr-4">{r.type}</td>
                <td className="py-3 pr-4 text-slate-700">{r.target}</td>
                <td className="py-3 pr-4">{r.reason}</td>
                <td className="py-3 pr-4">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusClass(r.status)}`}>
                    {r.status}
                  </span>
                </td>
                <td className="py-3 text-slate-500">{r.createdAt}</td>
              </tr>
            ))}

            {!reports.length && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500">
                  Không có dữ liệu phù hợp.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </article>
  );
}