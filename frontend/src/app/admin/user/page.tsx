"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { adminGetUsers, adminCreateUser, adminUpdateUser, adminDeleteUser, AdminUserDto } from "@/lib/api/userApi";
import UserTable from "@/components/admin/user/UserTable";
import UserFormModal from "@/components/admin/user/UserFormModal";
import DeleteConfirmModal from "@/components/admin/user/DeleteConfirmModal";

export interface AdminUser {
  id: number;
  email: string;
  fullName: string;
  phone?: string;
  role: string;
  active?: boolean;
  avatarUrl?: string;
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter & Pagination
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterActive, setFilterActive] = useState<string>("ALL"); // ALL, ACTIVE, INACTIVE
  const [filterRole, setFilterRole] = useState<string>("ALL"); // Frontend Filter Logic Tạm cho role nếu API chưa support role
  const pageSize = 10;

  // Forms
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [formData, setFormData] = useState<AdminUserDto>({
    email: "", fullName: "", phone: "", password: "", role: "USER"
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);

  // Custom Toast Notifier
  const [toast, setToast] = useState<{ message: string, type: "success" | "error" } | null>(null);
  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const activeParam = filterActive === "ALL" ? undefined : filterActive === "ACTIVE";
      const resp = await adminGetUsers(page, pageSize, searchQuery, activeParam);
      setUsers(resp.content || []);
      setTotalPages(resp.totalPages || 1);
    } catch (error) {
      console.error("Lỗi lấy danh sách user:", error);
      showToast("Lỗi lấy danh sách người dùng", "error");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, searchQuery, filterActive]);

  useEffect(() => {
    const timeout = setTimeout(() => fetchUsers(), 300);
    return () => clearTimeout(timeout);
  }, [fetchUsers]);

  // Frontend filter for Role (Vì API chưa có tham số role)
  const filteredUsers = useMemo(() => {
    if (filterRole === "ALL") return users;
    return users.filter(u => u.role === filterRole);
  }, [users, filterRole]);

  const openCreateDialog = () => {
    setEditingUser(null);
    setFormData({ email: "", fullName: "", phone: "", password: "", role: "USER" });
    setShowForm(true);
  };

  const openEditDialog = (u: AdminUser) => {
    setEditingUser(u);
    setFormData({
      email: u.email,
      fullName: u.fullName || "",
      phone: u.phone || "",
      password: "", 
      role: u.role || "USER"
    });
    setShowForm(true);
  };

  const handleUpdateField = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser?.id) {
        await adminUpdateUser(editingUser.id, formData);
        showToast("Cập nhật tài khoản thành công!", "success");
      } else {
        await adminCreateUser(formData);
        showToast("Đã thêm thành viên mới!", "success");
      }
      setShowForm(false);
      fetchUsers(); 
    } catch (error: unknown) {
      if (error instanceof Error) {
        showToast(error.message, "error");
      }
    }
  };

  const confirmDelete = async () => {
    if (!userToDelete?.id) return;
    try {
      await adminDeleteUser(userToDelete.id);
      setShowDeleteConfirm(false);
      showToast("Đã xóa vĩnh viễn tài khoản", "success");
      if (page !== 0) setPage(0);
      else fetchUsers(); 
    } catch (error: unknown) {
      if (error instanceof Error) {
        showToast(error.message, "error");
      }
    }
  };

  const toggleStatus = async (user: AdminUser) => {
    if (!confirm(`Bạn muốn ${user.active ? 'KHOÁ' : 'MỞ KHOÁ'} tài khoản ${user.fullName}?`)) return;
    try {
      await adminUpdateUser(user.id, { 
        email: user.email, 
        fullName: user.fullName, 
        role: user.role, 
        isActive: !user.active 
      });
      showToast(`Đã ${user.active ? 'Khoá' : 'Mở khoá'} tài khoản!`, "success");
      fetchUsers();
    } catch (error: unknown) {
      if (error instanceof Error) showToast(error.message, "error");
    }
  };

  return (
    <main className="relative min-h-[80vh]">
      <header className="mb-5 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Quản lý người dùng</h1>
            <p className="text-sm text-slate-500">Xem danh sách, thêm, sửa, xóa và bộ lọc tài khoản.</p>
          </div>
          <button
            onClick={openCreateDialog}
            className="cursor-pointer mt-3 md:mt-0 flex h-10 w-fit items-center justify-center gap-2 rounded-xl bg-rose-500 px-5 text-sm font-semibold text-white transition-colors hover:bg-rose-600 shadow-sm shadow-rose-200"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Thêm người dùng
          </button>
        </div>
        
        {/* Bộ Lọc (Filters) */}
        <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-slate-100">
          <div className="relative flex-grow">
            <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input 
              type="text" 
              placeholder="Tìm kiếm bằng tên..." 
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-50"
            />
          </div>
          <select 
            value={filterActive} 
            onChange={(e) => { setFilterActive(e.target.value); setPage(0); }}
            className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none focus:border-rose-300 cursor-pointer"
          >
            <option value="ALL">Mọi trạng thái</option>
            <option value="ACTIVE">Chỉ Hoạt động</option>
            <option value="INACTIVE">Chỉ Đã khoá</option>
          </select>
          <select 
            value={filterRole} 
            onChange={(e) => { setFilterRole(e.target.value); setPage(0); }}
            className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none focus:border-rose-300 cursor-pointer"
          >
            <option value="ALL">Mọi vai trò</option>
            <option value="ADMIN">Chỉ Admin</option>
            <option value="USER">Chỉ User thường</option>
          </select>
        </div>
      </header>

      <UserTable 
        users={filteredUsers} 
        loading={loading} 
        page={page} 
        totalPages={totalPages} 
        setPage={setPage} 
        onEdit={openEditDialog} 
        onDelete={(u) => { setUserToDelete(u); setShowDeleteConfirm(true); }} 
        onToggleStatus={toggleStatus}
      />

      {showForm && (
        <UserFormModal 
          editingUser={editingUser} 
          formData={formData} 
          onClose={() => setShowForm(false)} 
          onSubmit={submitForm} 
          onChange={handleUpdateField} 
        />
      )}

      {showDeleteConfirm && (
        <DeleteConfirmModal 
          user={userToDelete} 
          onClose={() => setShowDeleteConfirm(false)} 
          onConfirm={confirmDelete} 
        />
      )}

      {/* TOAST SYSTEM (Sẽ trượt lên ở góc) */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[9999] flex items-center gap-3 rounded-2xl px-5 py-4 shadow-xl transition-all animate-in slide-in-from-bottom border ${
          toast.type === 'success' ? 'bg-white border-emerald-100 text-slate-700' : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {toast.type === "success" ? (
             <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
               <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
             </div>
          ) : (
             <div className="h-8 w-8 rounded-full bg-rose-200 flex items-center justify-center text-rose-700">
               <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
             </div>
          )}
          <div>
            <h4 className="text-sm font-bold">{toast.type === 'success' ? 'Thành công' : 'Lỗi ngoại lệ'}</h4>
            <p className="text-xs font-medium opacity-90 mt-0.5">{toast.message}</p>
          </div>
        </div>
      )}
    </main>
  );
}