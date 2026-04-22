"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Thêm tuỳ chọn "query" là optional vì có page không cần thanh search header này
type Props = {
  query?: string;
  setQuery?: (v: string) => void;
};

export default function DashboardHeader({ query = "", setQuery }: Props) {
  const router = useRouter();
  const [openAccountMenu, setOpenAccountMenu] = useState(false);

  function handleLogout() {
    localStorage.removeItem("auth_tokens"); // Nhớ xóa đúng key token của bạn, ở layout check auth_tokens
    router.push("/admin/login");
  }

  return (
    <header className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard quản trị</h1>
          <p className="text-sm text-slate-500">Theo dõi hoạt động, xử lý vi phạm, và vận hành hệ thống.</p>
        </div>

        <div className="flex items-center gap-3">
          {setQuery && (
            <>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm báo cáo..."
                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-rose-100 md:w-64"
              />
              <button className="cursor-pointer h-10 rounded-xl bg-rose-500 px-4 text-sm font-medium text-white hover:bg-rose-600 transition-colors">
                Làm mới
              </button>
            </>
          )}

          <div className="relative ml-auto md:ml-1">
            <button
              type="button"
              onClick={() => setOpenAccountMenu((v) => !v)}
              className="cursor-pointer flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 text-sm font-bold text-rose-700 ring-2 ring-rose-200 hover:bg-rose-200 transition-colors"
              aria-label="Tài khoản admin"
            >
              AD
            </button>

            {openAccountMenu && (
              <div className="absolute right-0 z-30 mt-2 w-52 rounded-xl border border-slate-200 bg-white p-1 shadow-lg py-2">
                <button
                  type="button"
                  onClick={() => {
                    setOpenAccountMenu(false);
                    router.push("/admin/profile");
                  }}
                  className="cursor-pointer block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Hồ sơ admin
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="cursor-pointer block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-rose-600 hover:bg-rose-50"
                >
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}