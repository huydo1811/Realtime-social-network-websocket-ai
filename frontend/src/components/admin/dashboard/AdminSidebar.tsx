import Link from "next/link";

export default function AdminSidebar() {
  return (
    <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-5 lg:h-[calc(100vh-2.5rem)]">
      <div className="mb-6 flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-rose-100 p-1">
          <img src="/hype.png" alt="Hype" className="h-full w-full rounded-lg object-cover" />
        </div>
        <div>
          <p className="text-sm text-slate-500">Admin Panel</p>
          <h2 className="text-lg font-semibold leading-tight">Hype</h2>
        </div>
      </div>

      <nav className=" space-y-1 text-sm">
        <Link href="/admin" className="block rounded-xl bg-rose-50 px-3 py-2 font-medium text-rose-700">
          Tổng quan
        </Link>
        <button className="w-full rounded-xl px-3 py-2 text-left hover:bg-slate-100">Người dùng</button>
        <button className="w-full rounded-xl px-3 py-2 text-left hover:bg-slate-100">Bài viết</button>
        <button className="w-full rounded-xl px-3 py-2 text-left hover:bg-slate-100">Moderation</button>
        <button className="w-full rounded-xl px-3 py-2 text-left hover:bg-slate-100">Báo cáo</button>
        <button className="w-full rounded-xl px-3 py-2 text-left hover:bg-slate-100">Cài đặt hệ thống</button>
      </nav>

      <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
        <p className="font-medium text-slate-700">Tình trạng hệ thống</p>
        <p className="mt-1">API: Online</p>
        <p>Queue moderation: 12 tác vụ</p>
        <p>DB: 28ms</p>
      </div>
    </aside>
  );
}