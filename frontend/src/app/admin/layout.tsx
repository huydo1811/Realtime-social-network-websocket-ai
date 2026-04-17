import AdminSidebar from "../../components/admin/dashboard/AdminSidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-8">
        <div className="grid grid-cols-[16rem_1fr] gap-6">
          <aside className="hidden md:block">
            <div className="w-64 flex-shrink-0">
              <AdminSidebar />
            </div>
          </aside>

          <main>{children}</main>
        </div>
      </div>
    </div>
  );
}