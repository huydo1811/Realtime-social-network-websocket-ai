import Image from "next/image";
import { AdminUser } from "@/app/admin/user/page";

type UserTableProps = {
  users: AdminUser[];
  loading: boolean;
  page: number;
  totalPages: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  onEdit: (u: AdminUser) => void;
  onDelete: (u: AdminUser) => void;
  onToggleStatus: (u: AdminUser) => void; 
};

export default function UserTable({ users, loading, page, totalPages, setPage, onEdit, onDelete, onToggleStatus }: UserTableProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600 min-w-[800px]">
          <thead className="bg-slate-50 text-slate-900 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 font-semibold">Tài khoản</th>
              <th className="px-6 py-4 font-semibold text-center">Vai trò</th>
              <th className="px-6 py-4 font-semibold text-center">Trạng thái</th>
              <th className="px-6 py-4 font-semibold text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={4} className="py-20 text-center">
                  <div className="flex justify-center items-center gap-2 text-rose-500">
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                    Đang tải dữ liệu...
                  </div>
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={4} className="py-20 text-center text-slate-500">Không tìm thấy người dùng nào!</td></tr>
            ) : users.map((user) => (
              <tr key={user.id} className={`hover:bg-rose-50/30 transition-colors ${!user.active ? "opacity-75 bg-slate-50" : ""}`}>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-100 p-0.5 ${!user.active && 'grayscale'}`}>
                      <Image 
                        src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.fullName || "U"}&background=ffe4e6&color=e11d48`} 
                        alt="Avatar" 
                        fill
                        className="rounded-full object-cover" 
                        unoptimized
                      />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{user.fullName}</p>
                      <p className="text-xs text-slate-500">{user.email} <span className="mx-1">•</span> {user.phone || "Chưa có SĐT"}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wider ${
                    user.role === 'ADMIN' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <button 
                    onClick={() => onToggleStatus(user)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wider border transition-colors hover:shadow-md ${
                    user.active 
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100' 
                      : 'border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${user.active ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                    {user.active ? 'HOẠT ĐỘNG' : 'ĐÃ KHOÁ'}
                  </button>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <button onClick={() => onEdit(user)} className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all" title="Chỉnh sửa">
                      <svg className="cursor-pointer h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button onClick={() => onDelete(user)} className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all" title="Xoá vĩnh viễn">
                      <svg className="cursor-pointer h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-200 p-4 bg-slate-50">
          <span className="text-sm text-slate-500">Trang <span className="font-semibold text-slate-900">{page + 1}</span> / {totalPages}</span>
          <div className="flex gap-2">
            <button 
               onClick={() => setPage(p => Math.max(0, p - 1))}
               disabled={page === 0}
               className="cursor-pointer rounded-xl p-2 text-slate-600 bg-white border border-slate-300 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button 
               onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
               disabled={page >= totalPages - 1}
               className="cursor-pointer rounded-xl p-2 text-slate-600 bg-white border border-slate-300 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}