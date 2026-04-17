"use client";

import { useState } from "react";

export default function SecuritySettings() {
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (newPwd !== confirmPwd) {
      setMessage("Mật khẩu mới và xác nhận không khớp.");
      return;
    }
    if (newPwd.length < 8) {
      setMessage("Mật khẩu mới phải ít nhất 8 ký tự.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: currentPwd, newPassword: newPwd }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || "Không thể đổi mật khẩu");
      }
      setMessage("Đổi mật khẩu thành công.");
      setCurrentPwd("");
      setNewPwd("");
      setConfirmPwd("");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setMessage(err.message || "Lỗi khi đổi mật khẩu.");
      } else {
        setMessage(String(err) || "Lỗi khi đổi mật khẩu.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-slate-800">Đổi mật khẩu</h3>

      <div className="grid gap-3">
        <label className="text-xs text-slate-500">Mật khẩu hiện tại</label>
        <input
          type="password"
          value={currentPwd}
          onChange={(e) => setCurrentPwd(e.target.value)}
          className="rounded-md border border-slate-200 px-3 py-2"
          required
        />

        <label className="text-xs text-slate-500">Mật khẩu mới</label>
        <input
          type="password"
          value={newPwd}
          onChange={(e) => setNewPwd(e.target.value)}
          className="rounded-md border border-slate-200 px-3 py-2"
          required
        />

        <label className="text-xs text-slate-500">Xác nhận mật khẩu mới</label>
        <input
          type="password"
          value={confirmPwd}
          onChange={(e) => setConfirmPwd(e.target.value)}
          className="rounded-md border border-slate-200 px-3 py-2"
          required
        />

        {message && <p className="text-sm text-rose-600">{message}</p>}

        <div className="mt-2 flex items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-rose-500 px-4 py-2 text-sm font-medium text-white hover:bg-rose-600 disabled:opacity-60"
          >
            {loading ? "Đang xử lý..." : "Cập nhật mật khẩu"}
          </button>
          <button
            type="button"
            onClick={() => {
              setCurrentPwd("");
              setNewPwd("");
              setConfirmPwd("");
              setMessage(null);
            }}
            className="cursor-pointer rounded-xl border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50"
          >
            Hủy
          </button>
        </div>
      </div>
    </form>
  );
}