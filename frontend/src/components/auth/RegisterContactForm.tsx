"use client";

import Link from "next/link";
import React from "react";

type Props = {
  contact: string;
  setContact: (v: string) => void;
  loading: boolean;
  sendOtp: (e?: React.FormEvent) => Promise<void> | void;
};

export default function RegisterContactForm({ contact, setContact, loading, sendOtp }: Props) {
  return (
    <form onSubmit={sendOtp} className="space-y-10 md:space-y-14">
      <h2 className="text-3xl md:text-5xl font-bold text-center text-rose-500 -mt-2 md:-mt-6">Đăng ký</h2>

      <div>
        <label className="block text-base md:text-lg font-medium text-slate-700">Email hoặc Số điện thoại</label>
        <input
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder="you@example.com hoặc 09xxxxxxxx"
          className="mt-3 h-12 md:h-16 w-full rounded-xl border border-slate-200 px-3 md:px-4 text-base md:text-lg focus:ring-4 focus:ring-slate-50 outline-none"
        />
      </div>

      <button
        disabled={!contact || loading}
        className="w-full h-12 md:h-16 rounded-xl btn-primary text-base md:text-xl disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
      >
        {loading ? "Đang gửi mã..." : "Gửi mã xác thực"}
      </button>

      <div className="text-center text-base md:text-xl text-slate-600">
        Đã có tài khoản? <Link href="/login" className="font-semibold text-primary cursor-pointer hover:underline">
          Đăng nhập
        </Link>
      </div>
    </form>
  );
}