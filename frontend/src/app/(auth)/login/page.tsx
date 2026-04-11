"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import LoginForm from "../../../components/auth/LoginForm";
import VerifyForm from "../../../components/auth/VerifyForm";
import ForgotPasswordForm from "../../../components/auth/ForgotPasswordForm";
import ResetVerifyForm from "../../../components/auth/ResetVerifyForm";
import ResetPasswordForm from "../../../components/auth/ResetPasswordForm";

type Step = "enter-contact" | "verify" | "done";

export default function LoginPage() {
  const [step, setStep] = useState<Step>("enter-contact");
  const [loading, setLoading] = useState(false);
  const [contact, setContact] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const otpCode = useMemo(() => otp.join(""), [otp]);
  const [showForgot, setShowForgot] = useState(false);
  const [fwStep, setFwStep] = useState<"enter"|"verify"|"reset">("enter");
  const [fwContact, setFwContact] = useState("");
  const [fwOtp, setFwOtp] = useState(["","","","","",""]);
  const fwOtpRefs = useRef<(HTMLInputElement|null)[]>([]);
  const [fwPassword, setFwPassword] = useState("");
  const [fwConfirmPassword, setFwConfirmPassword] = useState("");
  const [fwLoading, setFwLoading] = useState(false);

  useEffect(() => {
    if (step === "verify") otpRefs.current[0]?.focus();
  }, [step]);

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

  async function sendOtp(e?: React.FormEvent) {
    e?.preventDefault();
    if (!contact) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    setLoading(false);
    setStep("verify");
    setOtp(["", "", "", "", "", ""]);
  }

  async function submitLogin(e: React.FormEvent) {
    e.preventDefault();
    if (otpCode.length < 6 || !password) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    setLoading(false);
    setStep("done");
  }

  async function handleForgotPassword() {
    setShowForgot(true);
    setFwStep("enter");
  }

  async function handleResetPassword() {
    if (fwStep === "enter") {
      setFwStep("verify");
      setFwContact(fwContact);
      setFwOtp(["","","","","",""]);
      setFwLoading(true);
      await new Promise((r) => setTimeout(r, 600));
      setFwLoading(false);
    }
    if (fwStep === "verify") {
      setFwStep("reset");
      setFwPassword(fwPassword);
      setFwConfirmPassword(fwConfirmPassword);
      setFwLoading(true);
      await new Promise((r) => setTimeout(r, 600));
      setFwLoading(false);
    }
  }

  function noopPrevent(e?: React.FormEvent) { e?.preventDefault(); }

  // request -> move to verify step (UI-only)
  function requestResetOtp(e?: React.FormEvent) {
    e?.preventDefault();
    setFwLoading(true);
    setTimeout(() => { setFwLoading(false); setFwStep("verify"); setFwOtp(["","","","","",""]); fwOtpRefs.current[0]?.focus(); }, 400);
  }

  function resendResetOtp() {
    setFwLoading(true);
    setTimeout(() => setFwLoading(false), 300);
  }

  function verifyResetOtp(e?: React.FormEvent) {
    e?.preventDefault();
    // fake success -> go to reset step
    setFwLoading(true);
    setTimeout(() => { setFwLoading(false); setFwStep("reset"); setFwPassword(""); setFwConfirmPassword(""); }, 400);
  }

  function submitResetPassword(e?: React.FormEvent) {
    e?.preventDefault();
    setFwLoading(true);
    setTimeout(() => { setFwLoading(false); setShowForgot(false); setFwStep("enter"); }, 400);
  }

  function handleForgotPasswordClick() {
    setShowForgot(true);
    setFwContact(contact);
    if (contact) {
      requestResetOtp();
    } else {
      setFwStep("enter");
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
      <div className="w-full max-w-7xl mx-auto rounded-2xl overflow-hidden shadow-xl origin-center scale-[0.80] md:scale-[0.80]">        
        <div className="grid grid-cols-1 lg:grid-cols-2 items-stretch">
          <div className="hidden lg:flex relative overflow-hidden flex-col justify-center px-12 py-20 text-white bg-gradient-to-br from-rose-500 to-rose-300">
            <div className="pointer-events-none absolute -top-16 -left-16 h-56 w-56 rounded-full bg-white/18 blur-3xl" />
            <div className="pointer-events-none absolute bottom-[-80px] right-[-60px] h-72 w-72 rounded-full bg-rose-200/25 blur-3xl" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.18),transparent_35%),radial-gradient(circle_at_80%_70%,rgba(255,255,255,0.10),transparent_35%)]" />

            <div className="relative z-10 w-full max-w-xl">
              <div className="mb-8 flex items-center gap-5">
                <div className="relative h-20 w-20 rounded-2xl bg-white/90 p-2 shadow-2xl ring-1 ring-white/60">
                  <img
                    src="/hype.png"
                    alt="Hype logo"
                    className="h-full w-full rounded-xl object-cover"
                  />
                </div>

                <div>
                  <div className="text-[60px] leading-[0.92] font-extrabold tracking-tight drop-shadow-sm">
                    Hype
                  </div>
                </div>
              </div>

              <p className="max-w-[34rem] text-[23px] leading-tight text-white/92">
                Kết nối và chia sẻ theo sở thích. Nhắn tin, gọi điện và truyền tải nội dung yêu thích.
              </p>
            </div>
          </div>

          {/* Right auth card */}
          <div className="flex items-center justify-center px-4 py-12 md:px-8 md:py-16">
            <div className="w-full max-w-2xl">
              <div className="bg-white rounded-2xl shadow-md ring-1 ring-slate-100 p-8 md:p-12 min-h-[480px] md:h-[560px] text-base">
                <div className="h-full flex flex-col justify-center">
                  {showForgot ? (
                    <div>
                      {fwStep === "enter" && (
                        <ForgotPasswordForm
                          contact={fwContact}
                          setContact={setFwContact}
                          loading={fwLoading}
                          onSubmit={requestResetOtp}
                          onCancel={() => setShowForgot(false)}
                        />
                      )}

                      {fwStep === "verify" && (
                        <ResetVerifyForm
                          otp={fwOtp}
                          otpRefs={fwOtpRefs}
                          changeOtp={(i, v) => {
                            const d = v.replace(/\D/g, "").slice(-1);
                            const n = [...fwOtp];
                            n[i] = d;
                            setFwOtp(n);
                            if (d && i < 5) fwOtpRefs.current[i + 1]?.focus();
                          }}
                          handleOtpKey={(i,e)=>{ if(e.key==="Backspace" && !fwOtp[i] && i>0) fwOtpRefs.current[i-1]?.focus(); }}
                          contact={fwContact}
                          loading={fwLoading}
                          onVerify={verifyResetOtp}
                          onResend={resendResetOtp}
                          onBack={() => setFwStep("enter")}
                        />
                      )}

                      {fwStep === "reset" && (
                        <ResetPasswordForm
                          password={fwPassword}
                          setPassword={setFwPassword}
                          confirmPassword={fwConfirmPassword}
                          setConfirmPassword={setFwConfirmPassword}
                          loading={fwLoading}
                          onSubmit={submitResetPassword}
                          onCancel={() => setShowForgot(false)}
                        />
                      )}
                    </div>
                  ) : (
                    <>
                      {step === "enter-contact" && (
                        <LoginForm
                          contact={contact}
                          setContact={setContact}
                          loading={loading}
                          sendOtp={sendOtp}
                          onForgot={handleForgotPasswordClick}
                        />
                      )}

                      {step === "verify" && (
                        <VerifyForm
                          otp={otp}
                          otpRefs={otpRefs}
                          changeOtp={changeOtp}
                          handleOtpKey={handleOtpKey}
                          password={password}
                          setPassword={setPassword}
                          otpCode={otpCode}
                          loading={loading}
                          submitLogin={submitLogin}
                          setStep={setStep}
                          sendOtp={sendOtp}
                          contact={contact}
                        />
                      )}

                      {step === "done" && (
                        <div className="text-center py-6">
                          <p className="font-semibold text-emerald-700">Đăng nhập thành công</p>
                          <p className="mt-2 text-sm text-slate-600">Tiếp tục nối API để hoàn thiện.</p>
                          <button onClick={() => { setStep("enter-contact"); setContact(""); setPassword(""); setOtp(["","","","","",""]); }} className="mt-4 rounded-xl bg-emerald-600 px-6 py-3 text-white">
                            Thử lại
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}