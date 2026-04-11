"use client";

import React, { useEffect, useState } from "react";

type Props = {
  otp: string[];
  otpRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
  changeOtp: (i: number, v: string) => void;
  handleOtpKey: (i: number, e: React.KeyboardEvent<HTMLInputElement>) => void;
  contact: string;
  loading: boolean;
  confirmOtp: (e: React.FormEvent) => Promise<void> | void;
  setStep: (s: "enter-contact" | "verify" | "profile" | "done") => void;
  sendOtp: (e?: React.FormEvent) => Promise<void> | void;
};

export default function RegisterVerifyForm({
  otp,
  otpRefs,
  changeOtp,
  handleOtpKey,
  contact,
  loading,
  confirmOtp,
  setStep,
  sendOtp,
}: Props) {
  const otpCode = otp.join("");
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    startCooldown(60);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (remaining <= 0) return;
    const id = setInterval(() => setRemaining((r) => r - 1), 1000);
    return () => clearInterval(id);
  }, [remaining]);

  function startCooldown(sec: number) {
    setRemaining((cur) => (cur > 0 ? cur : sec));
  }

  function handleResend() {
    void sendOtp();
    startCooldown(60);
  }

  return (
    <form onSubmit={confirmOtp} className="space-y-6 md:space-y-8">
      <h2 className="text-3xl md:text-5xl font-bold text-center text-primary -mt-2 md:-mt-6">
        Xác thực
      </h2>
      <p className="text-base md:text-lg text-slate-600 text-center">
        Mã 6 chữ số đã gửi tới <span className="font-medium text-primary">{contact}</span>
      </p>

      <div className="flex items-center justify-center gap-3 md:gap-4">
        {otp.map((v, i) => (
          <input
            key={i}
            ref={(el) => {
              otpRefs.current[i] = el;
            }}
            value={v}
            onChange={(e) => changeOtp(i, e.target.value)}
            onKeyDown={(e) => handleOtpKey(i, e)}
            inputMode="numeric"
            aria-label={`OTP ${i + 1}`}
            className="h-12 w-12 md:h-16 md:w-16 rounded-xl border border-slate-200 text-center text-xl md:text-2xl font-semibold focus:ring-4 focus:ring-slate-50 outline-none"
          />
        ))}
      </div>

      <div className="flex gap-3 md:gap-4">
        <button
          type="submit"
          disabled={otpCode.length < 6 || loading}
          className="flex-1 h-12 md:h-16 rounded-xl btn-primary text-base md:text-xl disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
        >
          {loading ? "Đang xác thực..." : "Tiếp tục"}
        </button>
        <button
          type="button"
          onClick={() => setStep("enter-contact")}
          className="h-12 md:h-16 rounded-xl border px-4 md:px-6 text-base md:text-lg border-rose-500 text-rose-600 hover:bg-rose-500 hover:text-white hover:border-rose-500 transition cursor-pointer"
        >
          Quay lại
        </button>
      </div>

      <div className="text-center text-base md:text-lg text-slate-500">
        Không nhận được mã?{" "}
        <button
          type="button"
          className="font-semibold text-primary cursor-pointer hover:underline"
          onClick={handleResend}
          disabled={remaining > 0}
        >
          {remaining > 0 ? `Gửi lại (${remaining}s)` : "Gửi lại"}
        </button>
      </div>
    </form>
  );
}