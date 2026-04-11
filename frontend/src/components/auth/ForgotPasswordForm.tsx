"use client";

import React from "react";

type Props = {
  contact: string;
  setContact: (v: string) => void;
  loading?: boolean;
  onSubmit: (e?: React.FormEvent) => void;
  onCancel?: () => void;
};

export default function ForgotPasswordForm({ contact, setContact, loading, onSubmit, onCancel }: Props) {
  return (
    <form onSubmit={onSubmit} className="space-y-8 md:space-y-10">
      <h2 className="text-3xl md:text-5xl font-bold text-center text-primary -mt-2 md:-mt-6">
        Lấy lại mật khẩu
      </h2>

      <p className="text-base md:text-lg text-slate-600 text-center">
        Nhập email hoặc số điện thoại đã đăng ký, chúng tôi sẽ gửi mã xác thực.
      </p>

      <div>
        <label className="block text-base md:text-lg font-medium text-slate-700">Email hoặc Số điện thoại</label>
        <input
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder="you@example.com hoặc 0123..."
          className="mt-3 h-12 md:h-16 w-full rounded-xl border border-slate-200 px-3 md:px-4 text-base md:text-lg focus:ring-4 focus:ring-slate-50 outline-none"
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={!contact || loading}
          className="flex-1 h-12 md:h-16 rounded-xl btn-primary text-base md:text-xl disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
        >
          {loading ? "Đang gửi..." : "Gửi mã xác thực"}
        </button>

        {onCancel && (
          <button type="button" onClick={onCancel} className="h-12 md:h-16 rounded-xl border px-4 md:px-6 text-base md:text-lg border-rose-500 text-rose-600 hover:bg-rose-500 hover:text-white hover:border-rose-500 transition disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer">
            Hủy
          </button>
        )}
      </div>
    </form>
  );
}