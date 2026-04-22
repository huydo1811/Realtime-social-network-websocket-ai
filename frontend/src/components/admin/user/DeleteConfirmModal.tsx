import { AdminUser } from "@/app/admin/user/page";

type DeleteConfirmModalProps = {
  user: AdminUser | null;
  onClose: () => void;
  onConfirm: () => void;
};

export default function DeleteConfirmModal({ user, onClose, onConfirm }: DeleteConfirmModalProps) {
  if (!user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl text-center">
         <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 ring-8 ring-rose-50/50">
           <svg className="h-8 w-8 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
           </svg>
         </div>
         <h3 className="mb-2 text-xl font-bold text-slate-900">Xác nhận xóa tài khoản</h3>
         <p className="mb-8 text-sm text-slate-500 px-4">Bạn có chắc chắn muốn xóa tài khoản <strong>{user.fullName}</strong> vĩnh viễn khỏi hệ thống không?</p>
         <div className="flex justify-center gap-3">
            <button type="button" onClick={onClose} className="cursor-pointer rounded-xl px-6 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors">
              Giữ lại
            </button>
            <button type="button" onClick={onConfirm} className="cursor-pointer rounded-xl bg-rose-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 transition-colors shadow-sm shadow-rose-200">
              Đồng ý, Xóa ngay
            </button>
         </div>
      </div>
    </div>
  );
}