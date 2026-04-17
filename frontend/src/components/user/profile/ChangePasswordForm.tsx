"use client";

import { useMemo, useState } from "react";

export default function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const score = useMemo(() => {
    let s = 0;
    if (newPassword.length >= 8) s += 1;
    if (/[A-Z]/.test(newPassword)) s += 1;
    if (/[0-9]/.test(newPassword)) s += 1;
    if (/[^A-Za-z0-9]/.test(newPassword)) s += 1;
    return s;
  }, [newPassword]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");

    if (!currentPassword || !newPassword || !confirm) {
      setMessage("Vui lòng điền đầy đủ thông tin.");
      return;
    }
    if (newPassword !== confirm) {
      setMessage("Mật khẩu xác nhận chưa khớp.");
      return;
    }

    setSaving(true);
    await new Promise((r) => setTimeout(r, 700));
    setSaving(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirm("");
    setMessage("Đổi mật khẩu thành công (UI demo).");
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
      <h2 className="mb-4 text-lg font-semibold text-slate-900">Đổi mật khẩu</h2>

      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm text-slate-600">Mật khẩu hiện tại</label>
          <input
            type="password"
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:ring-2 focus:ring-rose-100"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-slate-600">Mật khẩu mới</label>
          <input
            type="password"
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:ring-2 focus:ring-rose-100"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <div className="mt-2 flex gap-2">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className={`h-1.5 flex-1 rounded-full ${n <= score ? "bg-rose-500" : "bg-slate-200"}`} />
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm text-slate-600">Xác nhận mật khẩu mới</label>
          <input
            type="password"
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:ring-2 focus:ring-rose-100"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="cursor-pointer rounded-xl bg-rose-500 px-5 py-2.5 font-medium text-white hover:bg-rose-600 disabled:opacity-60"
        >
          {saving ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
        </button>
        {message && <p className="text-sm text-slate-600">{message}</p>}
      </div>
    </form>
  );
}