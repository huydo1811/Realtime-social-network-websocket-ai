"use client";

import Link from "next/link";
import React from "react";

type Props = {
  contact: string;
  setContact: (v: string) => void;
  loading: boolean;
  sendOtp: (e?: React.FormEvent) => Promise<void> | void;
  onForgot?: () => void;
};

export default function LoginForm({ contact, setContact, loading, sendOtp, onForgot }: Props) {
  return (
    <form onSubmit={sendOtp} className="space-y-10 md:space-y-14">
      <h2 className={`text-3xl md:text-5xl font-bold text-center text-rose-500 -mt-2 md:-mt-6 `}>
        Đăng nhập
      </h2>

      <div>
        <label className="block text-base md:text-lg font-medium text-slate-700">Email hoặc Số điện thoại</label>
        <input
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder="you@example.com hoặc 09xxxxxxxx"
          className="mt-3 h-12 md:h-16 w-full rounded-xl border border-slate-200 px-3 md:px-4 text-base md:text-lg focus:ring-4 focus:ring-slate-50 outline-none"
        />

        <div className="mt-3 flex items-center justify-start gap-4 float-right">
          <button
            type="button"
            onClick={onForgot}
            className="text-lg text-primary font-medium cursor-pointer hover:underline"
          >
            Quên mật khẩu?
          </button>
        </div>
      </div>

      <button
        disabled={!contact || loading}
        className="w-full h-12 md:h-16 rounded-xl btn-primary text-base md:text-xl disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
      >
        {loading ? "Đang gửi mã..." : "Gửi mã OTP"}
      </button>

      <div className="text-center text-base md:text-xl text-slate-600">
        Chưa có tài khoản? <Link href="/register" className="font-semibold text-primary cursor-pointer hover:underline">
          Tạo tài khoản
        </Link>
      </div>
    </form>
  );
}