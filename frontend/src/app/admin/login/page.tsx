"use client";

import Image from "next/image";
import React, { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  checkIsAdmin,
  loginWithOtpSession,
  requestOtp,
  verifyOtp,
} from "../../../lib/api/authApi";
import { clearAuthTokens, saveAuthTokens } from "../../../lib/api/authToken";

type Step = "enter-contact" | "verify";

function parseJwtRole(accessToken: string): string {
  try {
    const parts = accessToken.split(".");
    if (parts.length < 2) return "";
    const payload = parts[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(Math.ceil(parts[1].length / 4) * 4, "=");
    const json = JSON.parse(atob(payload)) as { role?: string };
    return String(json.role ?? "").toUpperCase();
  } catch {
    return "";
  }
}

export default function AdminLoginPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("enter-contact");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const otpCode = useMemo(() => otp.join(""), [otp]);

  const [otpSessionToken, setOtpSessionToken] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);

  function changeOtp(i: number, v: string) {
    const d = v.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[i] = d;
    setOtp(next);
    if (d && i < 5) otpRefs.current[i + 1]?.focus();
  }

  function handleOtpKey(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
  }

  function resetOtpSession() {
    setOtpVerified(false);
    setOtpSessionToken("");
  }

  async function sendOtp(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);

    if (!email) {
      setError("Vui lòng nhập email.");
      return;
    }

    setLoading(true);
    try {
      const isAdmin = await checkIsAdmin(email.trim());
      if (!isAdmin) {
        setError("Tài khoản này không tồn tại hoặc không có quyền Admin.");
        setLoading(false);
        return;
      }

      await requestOtp(email.trim(), "EMAIL", "LOGIN");
      setStep("verify");
      setOtp(["", "", "", "", "", ""]);
      resetOtpSession();
      setTimeout(() => otpRefs.current[0]?.focus(), 50);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không gửi được OTP.");
    } finally {
      setLoading(false);
    }
  }

  function isOtpSessionError(message: string) {
    const m = message.toUpperCase();
    return m.includes("INVALID_OR_EXPIRED") || m.includes("OTP") || m.includes("EXPIRED");
  }

  async function submitLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (otpCode.length < 6 || !password) {
      setError("Vui lòng nhập OTP và mật khẩu.");
      return;
    }

    setLoading(true);
    try {
      let session = otpSessionToken;

      if (!otpVerified) {
        const verify = await verifyOtp(email.trim(), "EMAIL", otpCode, "LOGIN");
        session = verify.otpSessionToken;
        setOtpSessionToken(session);
        setOtpVerified(true);
      }

      const auth = await loginWithOtpSession(email.trim(), password, session);

      const role = parseJwtRole(auth.accessToken);
      if (role !== "ADMIN" && role !== "ROLE_ADMIN") {
        clearAuthTokens();
        setError("Tài khoản không có quyền ADMIN.");
        return;
      }

      saveAuthTokens(auth);
      router.replace("/admin");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Đăng nhập thất bại.";
      if (isOtpSessionError(msg)) {
        resetOtpSession();
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
      <div className="w-full max-w-7xl mx-auto rounded-2xl overflow-hidden shadow-xl origin-center scale-[0.80] md:scale-[0.80]">
        <div className="grid grid-cols-1 lg:grid-cols-2 items-stretch">
          <div className="hidden lg:flex relative overflow-hidden flex-col justify-center px-12 py-20 text-white bg-gradient-to-br from-rose-500 to-rose-300">
            <div className="pointer-events-none absolute -top-16 -left-16 h-56 w-56 rounded-full bg-white/18 blur-3xl" />
            <div className="pointer-events-none absolute bottom-[-80px] right-[-60px] h-72 w-72 rounded-full bg-rose-200/25 blur-3xl" />

            <div className="relative z-10 w-full max-w-xl">
              <div className="mb-8 flex items-center gap-5">
                <div className="relative h-20 w-20 rounded-2xl bg-white/90 p-2 shadow-2xl ring-1 ring-white/60">
                  <Image
                    src="/hype.png"
                    alt="Hype logo"
                    width={80}
                    height={80}
                    className="h-full w-full rounded-xl object-cover"
                  />
                </div>
                <div>
                  <div className="text-[60px] leading-[0.92] font-extrabold tracking-tight drop-shadow-sm">
                    Hype Admin
                  </div>
                </div>
              </div>

              <p className="max-w-[34rem] text-[22px] leading-tight text-white/92">
                Quản trị nội dung và người dùng. Đăng nhập để vào bảng điều khiển.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center px-4 py-12 md:px-8 md:py-16">
            <div className="w-full max-w-2xl">
              <div className="bg-white rounded-2xl shadow-md ring-1 ring-slate-100 p-8 md:p-12 min-h-[420px] text-base">
                <div className="h-full flex flex-col justify-center">
                  <form onSubmit={step === "enter-contact" ? sendOtp : submitLogin} className="space-y-8 md:space-y-10">
                    <h2 className="text-3xl md:text-5xl font-bold text-center text-rose-500 -mt-2">
                      Đăng nhập admin
                    </h2>

                    <div>
                      <label className="block text-base md:text-lg font-medium text-slate-700">Email</label>
                      <input
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          resetOtpSession();
                        }}
                        placeholder="admin@example.com"
                        className="mt-3 h-12 md:h-14 w-full rounded-xl border border-slate-200 px-3 md:px-4 text-base md:text-lg focus:ring-4 focus:ring-slate-50 outline-none"
                        required
                      />
                    </div>

                    {step === "verify" && (
                      <>
                        <div>
                          <label className="block text-base md:text-lg font-medium text-slate-700">OTP</label>
                          <div className="mt-3 flex items-center gap-2">
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
                                className="h-12 w-12 rounded-xl border border-slate-200 text-center text-lg font-semibold outline-none focus:ring-4 focus:ring-slate-50"
                                aria-label={`OTP ${i + 1}`}
                              />
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-base md:text-lg font-medium text-slate-700">Mật khẩu</label>
                          <input
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            type="password"
                            placeholder="••••••••"
                            className="mt-3 h-12 md:h-14 w-full rounded-xl border border-slate-200 px-3 md:px-4 text-base md:text-lg focus:ring-4 focus:ring-slate-50 outline-none"
                            required
                          />
                        </div>
                      </>
                    )}

                    {error ? <div className="text-sm text-rose-500">{error}</div> : null}

                    <div className="flex items-center gap-3">
                      {step === "verify" ? (
                        <button
                          type="button"
                          onClick={() => {
                            setStep("enter-contact");
                            setPassword("");
                            setOtp(["", "", "", "", "", ""]);
                            resetOtpSession();
                          }}
                          className="cursor-pointer hover:bg-slate-200 h-12 md:h-14 rounded-xl border px-4 text-base border-slate-300 text-slate-700"
                        >
                          Quay lại
                        </button>
                      ) : null}

                      <button
                        type="submit"
                        disabled={loading || (step === "enter-contact" ? !email : otpCode.length < 6 || !password)}
                        className="w-full h-12 md:h-14 rounded-xl btn-primary text-lg bg-rose-500 text-white disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
                      >
                        {loading
                          ? step === "enter-contact"
                            ? "Đang gửi OTP..."
                            : "Đang đăng nhập..."
                          : step === "enter-contact"
                            ? "Gửi OTP"
                            : "Đăng nhập"}
                      </button>
                    </div>

                    <div className="text-center text-lg text-slate-600">
                      Về trang người dùng?{" "}
                      <a href="/login" className="font-semibold text-primary hover:underline cursor-pointer">
                        Đăng nhập
                      </a>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}