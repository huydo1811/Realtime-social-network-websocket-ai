"use client";

import React, { useEffect, useState } from "react";

type Props = {
  otp: string[];
  otpRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
  changeOtp: (i: number, v: string) => void;
  handleOtpKey: (i: number, e: React.KeyboardEvent<HTMLInputElement>) => void;
  contact: string;
  loading?: boolean;
  onVerify: (e?: React.FormEvent) => void;
  onResend: () => void;
  onBack?: () => void;
};

export default function ResetVerifyForm({
  otp,
  otpRefs,
  changeOtp,
  handleOtpKey,
  contact,
  loading,
  onVerify,
  onResend,
  onBack,
}: Props) {
  const otpCode = otp.join("");
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    // start with 60s cooldown on mount
    setRemaining((r) => (r > 0 ? r : 60));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (remaining <= 0) return;
    const id = setInterval(() => setRemaining((r) => r - 1), 1000);
    return () => clearInterval(id);
  }, [remaining]);

  useEffect(() => {
    const id = setTimeout(() => {
      otpRefs.current[0]?.focus();
    }, 50);
    return () => clearTimeout(id);
  }, []);

  function handleResend() {
    onResend();
    setRemaining(60);
  }

  return (
    <form onSubmit={onVerify} className="space-y-6 md:space-y-8">
      <h2 className="text-3xl md:text-5xl font-bold text-center text-primary -mt-2 md:-mt-6">
        Xác thực
      </h2>

      <p className="text-base md:text-lg text-slate-600 text-center">
        Mã đã gửi tới <span className="font-medium text-primary">{contact}</span>
      </p>

      <div className="flex items-center justify-center gap-3 md:gap-4">
        {otp.map((v, i) => (
          <input
            key={i}
            ref={(el) => { otpRefs.current[i] = el; }}
            value={v}
            onChange={(e) => changeOtp(i, e.target.value)}
            onKeyDown={(e) => handleOtpKey(i, e)}
            inputMode="numeric"
            aria-label={`OTP ${i + 1}`}
            maxLength={1}
            className="h-12 w-12 md:h-16 md:w-16 rounded-xl border border-slate-200 text-center text-xl md:text-2xl font-semibold focus:ring-4 focus:ring-slate-50 outline-none"
          />
        ))}
      </div>

      <div className="flex gap-3 md:gap-4">
        <button type="submit" disabled={otpCode.length < 6 || loading} className="flex-1 h-12 md:h-16 rounded-xl btn-primary text-base md:text-xl disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer">
          {loading ? "Kiểm tra..." : "Xác thực"}
        </button>
        <button type="button" onClick={onBack} className="h-12 md:h-16 rounded-xl border px-4 md:px-6 text-base md:text-lg border-rose-500 text-rose-600 hover:bg-rose-500 hover:text-white hover:border-rose-500 transition disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer">
          Quay lại
        </button>
      </div>

      <div className="text-center text-base md:text-lg text-slate-500">
        Không nhận được mã?{" "}
        <button type="button" onClick={handleResend} disabled={remaining > 0} className="font-semibold text-primary cursor-pointer hover:underline disabled:text-slate-400 disabled:hover:underline-none">
          {remaining > 0 ? `Gửi lại (${remaining}s)` : "Gửi lại"}
        </button>
      </div>
    </form>
  );
}