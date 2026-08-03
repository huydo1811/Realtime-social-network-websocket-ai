"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import RegisterContactForm from "../../../components/auth/RegisterContactForm";
import RegisterVerifyForm from "../../../components/auth/RegisterVerifyForm";
import RegisterProfileForm from "../../../components/auth/RegisterProfileForm";
import { registerWithOtpSession, requestOtp, verifyOtp } from "../../../lib/api/authApi";

type Step = "enter-contact" | "verify" | "profile";

export default function RegisterPage() {
  const [step, setStep] = useState<Step>("enter-contact");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [contact, setContact] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const otpCode = useMemo(() => otp.join(""), [otp]);
  const [otpSessionToken, setOtpSessionToken] = useState("");

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

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

  async function sendOtp(e?: React.FormEvent) {
    e?.preventDefault();
    if (!contact) return;
    setError("");
    setLoading(true);
    try {
      await requestOtp(contact.trim(), "EMAIL", "REGISTER");
      setStep("verify");
      setOtp(["", "", "", "", "", ""]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không gửi được OTP");
    } finally {
      setLoading(false);
    }
  }

  async function confirmOtp(e?: React.FormEvent) {
    e?.preventDefault();
    if (otpCode.length < 6) return;
    setError("");
    setLoading(true);
    try {
      const verify = await verifyOtp(contact.trim(), "EMAIL", otpCode, "REGISTER");
      setOtpSessionToken(verify.otpSessionToken);
      setStep("profile");
    } catch (err) {
      setError(err instanceof Error ? err.message : "OTP không hợp lệ");
    } finally {
      setLoading(false);
    }
  }

  async function submitProfile(e?: React.FormEvent) {
    e?.preventDefault();
    if (!fullName || !phone || !password || password !== confirmPassword) return;
    if (!otpSessionToken) return;

    setError("");
    setLoading(true);
    try {
      await registerWithOtpSession({
        email: contact.trim(),
        phone: phone.trim(),
        password,
        fullName,
        otpSessionToken,
      });

      router.replace("/login?registered=1");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đăng ký thất bại");
    } finally {
      setLoading(false);
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

      <div className="absolute inset-0 z-0 bg-grid-slate-200 [mask-image:linear-gradient(to_bottom,white,transparent)]"></div>
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-rose-300 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 animate-blob"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-orange-300 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* Main Card */}
      <div className="relative z-10 mx-3 w-full max-w-[1100px] min-h-[min(100vh-1.5rem,600px)] flex flex-col lg:flex-row bg-white/80 backdrop-blur-2xl rounded-[1.75rem] sm:rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] ring-1 ring-white overflow-hidden animate-fade-in-up">
        
        {/* Left Side: Brand/Marketing */}
        <div className="hidden lg:flex w-[45%] relative overflow-hidden flex-col justify-between px-12 py-14 text-white bg-gradient-to-br from-rose-500 to-rose-300">
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
               Tham gia <br/>cộng đồng pet!
             </h2>
             <p className="text-[1.05rem] text-white/90 leading-relaxed max-w-sm">
               Tạo tài khoản để chia sẻ nhật ký thú cưng, kết nối nhóm yêu pet và theo dõi người bạn quan tâm.
             </p>
           </div>

           <div className="relative z-10 mt-12 animate-float">
             <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 shadow-xl">
                <div className="flex -space-x-3">
                  {[4, 5, 6].map(i => (
                    <Image key={i} src={`https://i.pravatar.cc/100?img=${i + 20}`} width={36} height={36} className="w-9 h-9 rounded-full border-2 border-rose-400 object-cover" alt={`user-${i}`} unoptimized/>
                  ))}
                  <div className="w-9 h-9 rounded-full border-2 border-rose-400 bg-white/20 flex items-center justify-center text-[11px] font-bold">+2k</div>
                </div>
                <div className="text-sm font-semibold ml-2">Chủ nuôi mới tuần này</div>
             </div>
           </div>
        </div>

        {/* Right Side: Forms */}
        <div className="flex-1 flex items-center justify-center p-5 sm:p-8 md:p-12 lg:p-16">
          <div className="w-full max-w-md">
            <div className="animate-fade-in-up" style={{animationDuration: '0.4s'}}>
              
              <div className="mb-4 min-h-8">
                {error && (
                  <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600 border border-rose-100 break-words">
                    {error}
                  </p>
                )}
              </div>

              {step === "enter-contact" && (
                <RegisterContactForm contact={contact} setContact={setContact} loading={loading} sendOtp={sendOtp} />
              )}

              {step === "verify" && (
                <RegisterVerifyForm
                  otp={otp} otpRefs={otpRefs} changeOtp={changeOtp} handleOtpKey={handleOtpKey}
                  contact={contact} loading={loading} confirmOtp={confirmOtp} sendOtp={sendOtp}
                  setStep={(s) => {
                    if (s === "enter-contact") { setStep("enter-contact"); return; }
                    if (s === "verify") { setStep("verify"); return; }
                    setStep("profile");
                  }}
                />
              )}

              {step === "profile" && (
                <RegisterProfileForm
                  fullName={fullName} setFullName={setFullName}
                  phone={phone} setPhone={setPhone}
                  password={password} setPassword={setPassword}
                  confirmPassword={confirmPassword} setConfirmPassword={setConfirmPassword}
                  loading={loading} submitProfile={submitProfile}
                />
              )}

            </div>
          </div>
        </div>

      </div>
    </main>
  );
}