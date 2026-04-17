"use client";

import React, { useEffect, useRef, useState } from "react";

type Props = {
  contactLabel: string;
  contactValue: string;
  onSendOtp?: (contact: string) => Promise<void> | void;
  onVerify: (code: string) => Promise<boolean> | boolean;
  onCancel?: () => void;
};

export default function OTPForm({ contactLabel, contactValue, onSendOtp, onVerify, onCancel }: Props) {
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [remaining, setRemaining] = useState(0);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    otpRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (remaining <= 0) return;
    const id = setInterval(() => setRemaining((r) => r - 1), 1000);
    return () => clearInterval(id);
  }, [remaining]);

  function startCooldown(sec: number) {
    setRemaining((cur) => (cur > 0 ? cur : sec));
  }

  async function handleSend() {
    setMessage("");
    setSending(true);
    try {
      await (onSendOtp ? onSendOtp(contactValue) : new Promise((r) => setTimeout(r, 700)));
      startCooldown(60);
      setMessage(`OTP đã gửi tới ${contactValue} (demo).`);
      setTimeout(() => otpRefs.current[0]?.focus(), 50);
    } catch {
      setMessage("Gửi OTP thất bại (demo).");
    } finally {
      setSending(false);
    }
  }

  function changeOtp(i: number, v: string) {
    if (!/^[0-9]?$/.test(v)) return;
    const next = [...otp];
    next[i] = v;
    setOtp(next);
    if (v && i < 5) otpRefs.current[i + 1]?.focus();
  }

  function handleKey(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && otp[i] === "" && i > 0) {
      otpRefs.current[i - 1]?.focus();
    }
  }

  async function handleVerify(e?: React.FormEvent) {
    e?.preventDefault();
    const code = otp.join("");
    if (code.length < 6) {
      setMessage("Vui lòng nhập đủ 6 chữ số.");
      return;
    }
    setVerifying(true);
    try {
      const ok = await (onVerify ? onVerify(code) : new Promise<boolean>((r) => setTimeout(() => r(true), 700)));
      if (ok) {
        setMessage("Xác thực thành công (demo).");
      } else {
        setMessage("Mã không đúng (demo).");
      }
    } catch {
      setMessage("Lỗi xác thực (demo).");
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Nhập mã 6 chữ số gửi tới <span className="font-medium text-slate-900">{contactValue}</span>
      </p>

      <form onSubmit={handleVerify} className="flex flex-col items-center gap-4">
        <div className="flex gap-2">
          {otp.map((v, i) => (
            <input
              key={i}
              ref={(el) => { otpRefs.current[i] = el }}
              value={v}
              onChange={(e) => changeOtp(i, e.target.value.replace(/\D/g, "").slice(-1))}
              onKeyDown={(e) => handleKey(i, e)}
              inputMode="numeric"
              className="h-12 w-12 rounded-xl border border-slate-200 text-center text-lg font-semibold outline-none"
            />
          ))}
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={verifying} className="cursor-pointer rounded-xl bg-rose-500 px-4 py-2 text-white hover:bg-rose-600">
            {verifying ? "Xác thực..." : "Xác thực"}
          </button>

          <button type="button" onClick={handleSend} disabled={remaining > 0 || sending} className="cursor-pointer rounded-xl border px-4 py-2 hover:bg-slate-100">
            {remaining > 0 ? `Gửi lại (${remaining}s)` : sending ? "Đang gửi..." : "Gửi lại OTP"}
          </button>

          {onCancel && (
            <button type="button" onClick={onCancel} className="cursor-pointer rounded-xl text-sm text-slate-500 hover:underline">
              Hủy
            </button>
          )}
        </div>

        {message && <p className="text-sm text-slate-600">{message}</p>}
      </form>
    </div>
  );
}