"use client";

import React from "react";

type Props = {
  fullName: string;
  setFullName: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
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
  phone,
  setPhone,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  loading,
  submitProfile,
}: Props) {
  const mismatch = password && confirmPassword && password !== confirmPassword;
  const isPasswordShort = password && password.length < 6;

  return (
    <form onSubmit={submitProfile} className="space-y-4 md:space-y-6">
      <div>
        <h2 className="text-2xl md:text-4xl font-bold text-center text-primary">Hoàn tất hồ sơ</h2>
        <p className="mt-2 text-base text-center text-slate-600">
          Điền thông tin để hoàn tất đăng ký.
        </p>
      </div>

      <div className="grid gap-3 md:gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm md:text-base font-medium text-slate-700">Họ và tên</label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Nguyễn Văn A"
            className="mt-1 h-12 w-full rounded-xl border border-slate-200 px-3 text-base focus:ring-4 focus:ring-slate-50 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm md:text-base font-medium text-slate-700">Số điện thoại</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="09xxxxxxxx"
            className="mt-1 h-12 w-full rounded-xl border border-slate-200 px-3 text-base focus:ring-4 focus:ring-slate-50 outline-none"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm md:text-base font-medium text-slate-700">Mật khẩu</label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Tối thiểu 6 ký tự"
            className="mt-1 h-12 w-full rounded-xl border border-slate-200 px-3 text-base focus:ring-4 focus:ring-slate-50 outline-none"
          />
          {isPasswordShort ? <p className="mt-1 text-sm text-rose-600">Mật khẩu phải có ít nhất 6 ký tự</p> : null}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm md:text-base font-medium text-slate-700">Xác nhận mật khẩu</label>
          <input
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            type="password"
            placeholder="Nhập lại mật khẩu"
            className="mt-1 h-12 w-full rounded-xl border border-slate-200 px-3 text-base focus:ring-4 focus:ring-slate-50 outline-none"
          />
          {mismatch && !isPasswordShort ? <p className="mt-1 text-sm text-rose-600">Mật khẩu không khớp</p> : null}
        </div>
      </div>

      <button
        type="submit"
        className="w-full h-12 mt-2 rounded-xl btn-primary text-lg disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
        disabled={loading || !fullName || !phone || !password || password.length < 6 || password !== confirmPassword}
      >
        {loading ? "Đang tạo..." : "Tạo tài khoản"}
      </button>
    </form>
  );
}