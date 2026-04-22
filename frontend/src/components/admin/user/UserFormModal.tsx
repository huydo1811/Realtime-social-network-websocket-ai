import { AdminUser } from "@/app/admin/user/page";
import { AdminUserDto } from "@/lib/api/userApi";

type UserFormModalProps = {
  editingUser: AdminUser | null;
  formData: AdminUserDto;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
};

export default function UserFormModal({ editingUser, formData, onClose, onSubmit, onChange }: UserFormModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl overflow-hidden transform duration-200">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-rose-50/50">
          <h2 className="text-lg font-bold text-slate-800">
            {editingUser ? "Chỉnh sửa người dùng" : "Thêm người dùng mới"}
          </h2>
          <button type="button" onClick={onClose} className="p-2 -mr-2 text-slate-400 hover:bg-rose-100 hover:text-rose-600 rounded-full">
             <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4 bg-white">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Email tài khoản *</label>
            <input required type="email" name="email" value={formData.email} onChange={onChange} className="w-full rounded-xl border border-slate-300 p-2.5 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100 focus:bg-white bg-slate-50"/>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Họ và tên *</label>
              <input required type="text" name="fullName" value={formData.fullName} onChange={onChange} className="w-full rounded-xl border border-slate-300 p-2.5 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100 bg-slate-50 focus:bg-white"/>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Số điện thoại *</label>
              <input required type="text" name="phone" value={formData.phone || ""} onChange={onChange} className="w-full rounded-xl border border-slate-300 p-2.5 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100 bg-slate-50 focus:bg-white" placeholder="09x..."/>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Vai trò</label>
              <select name="role" value={formData.role} onChange={onChange} className="w-full rounded-xl border border-slate-300 p-2.5 text-sm outline-none focus:border-rose-500 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-rose-100 cursor-pointer">
                <option value="USER">User (Khách)</option>
                <option value="ADMIN">Admin (Quản trị)</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Mật khẩu {editingUser && <span className="font-normal text-slate-400">(Để trống bỏ qua)</span>}
              </label>
              <input required={!editingUser} minLength={6} type="password" name="password" value={formData.password || ""} onChange={onChange} className="w-full rounded-xl border border-slate-300 p-2.5 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100 bg-slate-50 focus:bg-white placeholder:text-slate-300" placeholder="••••••••"/>
            </div>
          </div>
          
          <div className="mt-8 flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="cursor-pointer rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors">
              Hủy bỏ
            </button>
            <button type="submit" className="cursor-pointer rounded-xl bg-rose-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm shadow-rose-200 hover:bg-rose-600 transition-colors">
              {editingUser ? "Lưu thay đổi" : "Khởi tạo tài khoản"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}