"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import LoginForm from "../../../components/auth/LoginForm";
import VerifyForm from "../../../components/auth/VerifyForm";
import ForgotPasswordForm from "../../../components/auth/ForgotPasswordForm";
import ResetVerifyForm from "../../../components/auth/ResetVerifyForm";
import ResetPasswordForm from "../../../components/auth/ResetPasswordForm";
import {
  loginWithOtpSession,
  requestOtp,
  resetPasswordWithOtpSession,
  verifyOtp,
} from "../../../lib/api/authApi";
import { saveAuthTokens } from "../../../lib/api/authToken";

type Step = "enter-contact" | "verify";

export default function LoginPage() {
  const [step, setStep] = useState<Step>("enter-contact");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [contact, setContact] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const otpCode = useMemo(() => otp.join(""), [otp]);

  const [otpSessionToken, setOtpSessionToken] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);

  const [showForgot, setShowForgot] = useState(false);
  const [fwStep, setFwStep] = useState<"enter" | "verify" | "reset">("enter");
  const [fwContact, setFwContact] = useState("");
  const [fwOtp, setFwOtp] = useState(["", "", "", "", "", ""]);
  const [fwOtpSessionToken, setFwOtpSessionToken] = useState("");
  const fwOtpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [fwPassword, setFwPassword] = useState("");
  const [fwConfirmPassword, setFwConfirmPassword] = useState("");
  const [fwLoading, setFwLoading] = useState(false);
  const [fwError, setFwError] = useState("");

  const router = useRouter();

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

  function resetLoginOtpSession() {
    setOtpVerified(false);
    setOtpSessionToken("");
  }

  async function sendOtp(e?: React.FormEvent) {
    e?.preventDefault();
    if (!contact) return;
    setError("");
    setLoading(true);
    try {
      await requestOtp(contact.trim(), "EMAIL", "LOGIN");
      setStep("verify");
      setOtp(["", "", "", "", "", ""]);
      resetLoginOtpSession();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không gửi được OTP");
    } finally {
      setLoading(false);
    }
  }

  function isOtpSessionError(message: string) {
    const m = message.toUpperCase();
    return (
      m.includes("INVALID_OR_EXPIRED") ||
      m.includes("OTP") ||
      m.includes("EXPIRED")
    );
  }

  async function submitLogin(e: React.FormEvent) {
    e.preventDefault();
    if (otpCode.length < 6 || !password) return;

    setError("");
    setLoading(true);

    try {
      let session = otpSessionToken;

      if (!otpVerified) {
        const verify = await verifyOtp(contact.trim(), "EMAIL", otpCode, "LOGIN");
        session = verify.otpSessionToken;
        setOtpSessionToken(session);
        setOtpVerified(true);
      }

      const auth = await loginWithOtpSession(contact.trim(), password, session);
      saveAuthTokens(auth);
      router.replace("/");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Đăng nhập thất bại";
      if (isOtpSessionError(msg)) {
        resetLoginOtpSession();
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function requestResetOtp(e?: React.FormEvent) {
    e?.preventDefault();
    if (!fwContact) return;
    setFwError("");
    setFwLoading(true);
    try {
      await requestOtp(fwContact.trim(), "EMAIL", "RESET_PASSWORD");
      setFwStep("verify");
      setFwOtp(["", "", "", "", "", ""]);
      setTimeout(() => fwOtpRefs.current[0]?.focus(), 50);
    } catch (err) {
      setFwError(err instanceof Error ? err.message : "Không gửi được OTP reset");
    } finally {
      setFwLoading(false);
    }
  }

  async function resendResetOtp() {
    if (!fwContact) return;
    setFwError("");
    setFwLoading(true);
    try {
      await requestOtp(fwContact.trim(), "EMAIL", "RESET_PASSWORD");
    } catch (err) {
      setFwError(err instanceof Error ? err.message : "Không gửi lại được OTP");
    } finally {
      setFwLoading(false);
    }
  }

  async function verifyResetOtp(e?: React.FormEvent) {
    e?.preventDefault();
    const code = fwOtp.join("");
    if (code.length < 6) return;
    setFwError("");
    setFwLoading(true);
    try {
      const verify = await verifyOtp(fwContact.trim(), "EMAIL", code, "RESET_PASSWORD");
      setFwOtpSessionToken(verify.otpSessionToken);
      setFwStep("reset");
      setFwPassword("");
      setFwConfirmPassword("");
    } catch (err) {
      setFwError(err instanceof Error ? err.message : "OTP không hợp lệ");
    } finally {
      setFwLoading(false);
    }
  }

  async function submitResetPassword(e?: React.FormEvent) {
    e?.preventDefault();
    if (!fwPassword || fwPassword !== fwConfirmPassword) return;
    if (!fwOtpSessionToken) return;
    setFwError("");
    setFwLoading(true);
    try {
      await resetPasswordWithOtpSession(fwContact.trim(), fwPassword, fwOtpSessionToken);
      setShowForgot(false);
      setFwStep("enter");
      setFwOtpSessionToken("");
    } catch (err) {
      setFwError(err instanceof Error ? err.message : "Không reset được mật khẩu");
    } finally {
      setFwLoading(false);
    }
  }

  function handleForgotPasswordClick() {
    setShowForgot(true);
    setFwContact(contact);
    setFwError("");
    if (contact) {
      void requestResetOtp();
    } else {
      setFwStep("enter");
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-50 font-sans flex items-center justify-center p-4 md:p-8 scale-[0.80] md:scale-[0.80]">
      {/* Background Styling */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-blob { animation: blob 8s infinite ease-in-out; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-fade-in-up { animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
        .bg-grid-slate-200 {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='%23e2e8f0'%3E%3Cpath d='M0 .5H31.5V32'/%3E%3C/svg%3E");
        }
      `}} />

      <div className="absolute inset-0 z-0 bg-grid-slate-200 [mask-image:linear-gradient(to_bottom,white,transparent)] "></div>
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-rose-300 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 animate-blob"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-orange-300 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* Main Card */}
      <div className="relative z-10 mx-3 w-full max-w-[1100px] min-h-[min(100vh-1.5rem,600px)] flex flex-col lg:flex-row bg-white/80 backdrop-blur-2xl rounded-[1.75rem] sm:rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] ring-1 ring-white overflow-hidden animate-fade-in-up">
        
        {/* Left Side: Brand/Marketing */}
        <div className="hidden lg:flex w-[45%] relative overflow-hidden flex-col justify-between px-12 py-14 text-white bg-gradient-to-br from-rose-500 to-rose-300">
           {/* Decorative items */}
           <div className="absolute -top-24 -left-24 w-64 h-64 rounded-full bg-white/20 blur-3xl mix-blend-overlay"></div>
           <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-orange-200/30 blur-3xl mix-blend-overlay"></div>

           <div className="relative z-10 mb-8">
             <Link href="/" className="inline-flex items-center gap-3 transition-transform hover:scale-105 active:scale-95 cursor-pointer">
               <div className="h-12 w-12 overflow-hidden rounded-xl bg-white p-[2px] shadow-lg shadow-white/20">
                <Image src="/hype.png" alt="PetHype logo" width={48} height={48} className="h-full w-full rounded-[10px] object-cover" unoptimized/>
               </div>
               <span className="text-3xl font-extrabold tracking-tight text-white drop-shadow-md">
                PetHype
               </span>
             </Link>
           </div>

           <div className="relative z-10 space-y-6">
             <h2 className="text-[2.5rem] leading-[1.15] font-extrabold tracking-tight drop-shadow-sm">
               Chào mừng <br/>trở lại!
             </h2>
             <p className="text-[1.05rem] text-white/90 leading-relaxed max-w-sm">
               Đăng nhập để theo dõi bạn bè, khoe hoạt động thú cưng và khám phá cộng đồng pet quanh bạn.
             </p>
           </div>

           <div className="relative z-10 mt-12 animate-float">
             <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 shadow-xl">
                <div className="flex -space-x-3">
                  {[1, 2, 3].map(i => (
                    <Image key={i} src={`https://i.pravatar.cc/100?img=${i + 15}`} width={36} height={36} className="w-9 h-9 rounded-full border-2 border-rose-400 object-cover" alt={`user-${i}`} unoptimized/>
                  ))}
                  <div className="w-9 h-9 rounded-full border-2 border-rose-400 bg-white/20 flex items-center justify-center text-[11px] font-bold">+99</div>
                </div>
                <div className="text-sm font-semibold ml-2">Đang hoạt động với thú cưng</div>
             </div>
           </div>
        </div>

        {/* Right Side: Forms */}
        <div className="flex-1 flex items-center justify-center p-5 sm:p-8 md:p-12 lg:p-16">
          <div className="w-full max-w-md">
            
            {showForgot ? (
              <div className="animate-fade-in-up" style={{animationDuration: '0.4s'}}>
                <div className="mb-4 min-h-8">
                  {fwError && (
                    <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600 border border-rose-100 break-words">
                      {fwError}
                    </p>
                  )}
                </div>

                {fwStep === "enter" && (
                  <ForgotPasswordForm contact={fwContact} setContact={setFwContact} loading={fwLoading} onSubmit={requestResetOtp} onCancel={() => setShowForgot(false)} />
                )}

                {fwStep === "verify" && (
                  <ResetVerifyForm
                    otp={fwOtp} otpRefs={fwOtpRefs} contact={fwContact} loading={fwLoading}
                    changeOtp={(i, v) => {
                      const d = v.replace(/\D/g, "").slice(-1); const n = [...fwOtp]; n[i] = d; setFwOtp(n);
                      if (d && i < 5) fwOtpRefs.current[i + 1]?.focus();
                    }}
                    handleOtpKey={(i, e) => { if (e.key === "Backspace" && !fwOtp[i] && i > 0) fwOtpRefs.current[i - 1]?.focus(); }}
                    onVerify={verifyResetOtp} onResend={resendResetOtp} onBack={() => setFwStep("enter")}
                  />
                )}

                {fwStep === "reset" && (
                  <ResetPasswordForm password={fwPassword} setPassword={setFwPassword} confirmPassword={fwConfirmPassword} setConfirmPassword={setFwConfirmPassword} loading={fwLoading} onSubmit={submitResetPassword} onCancel={() => setShowForgot(false)} />
                )}
              </div>
            ) : (
              <div className="animate-fade-in-up" style={{animationDuration: '0.4s'}}>
                <div className="mb-4 min-h-8">
                  {error && (
                    <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600 border border-rose-100 break-words">
                      {error}
                    </p>
                  )}
                </div>

                {step === "enter-contact" && (
                  <LoginForm
                    contact={contact} setContact={v => { setContact(v); resetLoginOtpSession(); }}
                    loading={loading} sendOtp={sendOtp} onForgot={handleForgotPasswordClick}
                  />
                )}

                {step === "verify" && (
                  <VerifyForm
                    otp={otp} otpRefs={otpRefs} changeOtp={changeOtp} handleOtpKey={handleOtpKey}
                    password={password} setPassword={setPassword} otpCode={otpCode}
                    loading={loading} submitLogin={submitLogin} sendOtp={sendOtp} contact={contact}
                    setStep={(s) => {
                      if (s === "enter-contact") { setStep("enter-contact"); setPassword(""); setOtp(["","","","","",""]); resetLoginOtpSession(); return; }
                      setStep("verify");
                    }}
                  />
                )}
              </div>
            )}
            
          </div>
        </div>

      </div>
    </main>
  );
}