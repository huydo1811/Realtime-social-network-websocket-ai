"use client";

import React from "react";

type Props = {
  password: string;
  setPassword: (v: string) => void;
  confirmPassword: string;
  setConfirmPassword: (v: string) => void;
  loading?: boolean;
  onSubmit: (e?: React.FormEvent) => void;
  onCancel?: () => void;
};

export default function ResetPasswordForm({ password, setPassword, confirmPassword, setConfirmPassword, loading, onSubmit, onCancel }: Props) {
  const isPasswordShort = password && password.length < 6;
  const mismatch = password && confirmPassword && password !== confirmPassword;

  return (
    <form onSubmit={onSubmit} className="space-y-6 md:space-y-8">
      <h2 className="text-3xl md:text-5xl font-bold text-center text-primary -mt-2 md:-mt-6">
        Đặt mật khẩu mới
      </h2>

      <div>
        <label className="block text-base md:text-lg font-medium text-slate-700">Mật khẩu mới</label>
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          placeholder="Tối thiểu 6 ký tự"
          className="mt-3 h-12 md:h-16 w-full rounded-xl border border-slate-200 px-3 md:px-4 text-base md:text-lg focus:ring-4 focus:ring-slate-50 outline-none"
        />
        {isPasswordShort ? <p className="mt-2 text-sm text-rose-600">Mật khẩu phải có ít nhất 6 ký tự</p> : null}
      </div>

      <div>
        <label className="block text-base md:text-lg font-medium text-slate-700">Xác nhận mật khẩu</label>
        <input
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          type="password"
          placeholder="Nhập lại mật khẩu"
          className="mt-3 h-12 md:h-16 w-full rounded-xl border border-slate-200 px-3 md:px-4 text-base md:text-lg focus:ring-4 focus:ring-slate-50 outline-none"
        />
        {mismatch && !isPasswordShort ? <p className="mt-2 text-sm text-rose-600">Mật khẩu không khớp</p> : null}
      </div>

      <div className="flex gap-3 md:gap-4">
        <button
          type="submit"
          disabled={loading || !password || password.length < 6 || password !== confirmPassword}
          className="flex-1 h-12 md:h-16 rounded-xl btn-primary text-base md:text-xl disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        >
          {loading ? "Đang lưu..." : "Đặt lại mật khẩu"}
        </button>
        {onCancel && <button type="button" onClick={onCancel} className="h-12 md:h-16 rounded-xl border px-4 md:px-6 text-base md:text-lg border-rose-500 text-rose-600 hover:bg-rose-500 hover:text-white hover:border-rose-500 transition disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer">Hủy</button>}
      </div>
    </form>
  );
}