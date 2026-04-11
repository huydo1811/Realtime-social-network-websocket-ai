"use client";

import React from "react";

type Props = {
  fullName: string;
  setFullName: (v: string) => void;
  username: string;
  setUsername: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  confirmPassword: string;
  setConfirmPassword: (v: string) => void;
  loading: boolean;
  submitProfile: (e?: React.FormEvent) => Promise<void> | void;
};

export default function RegisterProfileForm({
  fullName,
  setFullName,
  username,
  setUsername,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  loading,
  submitProfile,
}: Props) {
  const mismatch = password && confirmPassword && password !== confirmPassword;

  return (
    <form onSubmit={submitProfile} className="space-y-6 md:space-y-8">
      <div>
        <h2 className="text-3xl md:text-5xl font-bold text-center text-primary">Hoàn tất hồ sơ</h2>
        <p className="mt-2 text-lg md:text-lg text-center text-slate-600">
          Điền thông tin để hoàn tất đăng ký và bắt đầu kết nối.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-base md:text-lg font-medium text-slate-700">Họ và tên</label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Nguyễn Văn A"
            className="h-12 md:h-16 w-full rounded-xl border border-slate-200 px-3 md:px-4 text-base md:text-lg focus:ring-4 focus:ring-slate-50 outline-none"
          />
        </div>

        <div>
          <label className="block text-base md:text-lg font-medium text-slate-700">Username</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="@username"
            className="h-12 md:h-16 w-full rounded-xl border border-slate-200 px-3 md:px-4 text-base md:text-lg focus:ring-4 focus:ring-slate-50 outline-none"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-base md:text-lg font-medium text-slate-700">Mật khẩu</label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Tối thiểu 8 ký tự"
            className="h-12 md:h-16 w-full rounded-xl border border-slate-200 px-3 md:px-4 text-base md:text-lg focus:ring-4 focus:ring-slate-50 outline-none"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-base md:text-lg font-medium text-slate-700">Xác nhận mật khẩu</label>
          <input
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            type="password"
            placeholder="Nhập lại mật khẩu"
            className="h-12 md:h-16 w-full rounded-xl border border-slate-200 px-3 md:px-4 text-base md:text-lg focus:ring-4 focus:ring-slate-50 outline-none"
          />
          {mismatch && <p className="mt-2 text-sm text-rose-600">Mật khẩu không khớp</p>}
        </div>
      </div>

      <button
        type="submit"
        className="w-full h-12 md:h-16 rounded-xl btn-primary text-base md:text-xl disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
        disabled={loading || !fullName || !username || !password || password !== confirmPassword}
      >
        {loading ? "Đang tạo..." : "Tạo tài khoản"}
      </button>
    </form>
  );
}