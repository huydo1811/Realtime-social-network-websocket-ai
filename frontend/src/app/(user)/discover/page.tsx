"use client";

import UserLayout from "@/components/layout/UserLayout";
import UserDirectory from "@/components/user/search/UserDirectory";

export default function DiscoverPage() {
  return (
    <UserLayout>
      <div className="w-full pb-20 pt-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mb-6 px-2">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Khám phá</h1>
          <p className="text-slate-500 font-medium mt-1">Tìm kiếm, kết nối và mở rộng vòng kết nối của bạn</p>
        </div>

        {/* Component danh bạ kết bạn */}
        <UserDirectory />
      </div>
    </UserLayout>
  );
}