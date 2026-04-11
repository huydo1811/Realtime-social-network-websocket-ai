"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import RegisterContactForm from "../../../components/auth/RegisterContactForm";
import RegisterVerifyForm from "../../../components/auth/RegisterVerifyForm";
import RegisterProfileForm from "../../../components/auth/RegisterProfileForm";

type Step = "enter-contact" | "verify" | "profile" | "done";

export default function RegisterPage() {
  const [step, setStep] = useState<Step>("enter-contact");
  const [loading, setLoading] = useState(false);
  const [contact, setContact] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const otpCode = useMemo(() => otp.join(""), [otp]);

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

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

  async function confirmOtp(e?: React.FormEvent) {
    e?.preventDefault();
    if (otpCode.length < 6) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    setLoading(false);
    setStep("profile");
  }

  async function submitProfile(e?: React.FormEvent) {
    e?.preventDefault();
    if (!fullName || !username || !password || password !== confirmPassword) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    setLoading(false);
    setStep("done");
    // reset
    setContact("");
    setOtp(["", "", "", "", "", ""]);
    setFullName("");
    setUsername("");
    setPassword("");
    setConfirmPassword("");
  }

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
      <div className="w-full max-w-7xl mx-auto rounded-2xl overflow-hidden shadow-xl origin-center scale-[0.80] md:scale-[0.80]">        
        <div className="grid grid-cols-1 lg:grid-cols-2 items-stretch">
          {/* Left brand panel */}
          <div className="hidden lg:flex relative overflow-hidden flex-col justify-center px-12 py-20 text-white bg-gradient-to-br from-rose-500 to-rose-300">
            {/* decorative blobs - toned to old rose palette */}
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
                  {step === "enter-contact" && (
                    <RegisterContactForm
                      contact={contact}
                      setContact={setContact}
                      loading={loading}
                      sendOtp={sendOtp}
                    />
                  )}

                  {step === "verify" && (
                    <RegisterVerifyForm
                      otp={otp}
                      otpRefs={otpRefs}
                      changeOtp={changeOtp}
                      handleOtpKey={handleOtpKey}
                      contact={contact}
                      loading={loading}
                      confirmOtp={confirmOtp}
                      setStep={setStep}
                      sendOtp={sendOtp}
                    />
                  )}

                  {step === "profile" && (
                    <RegisterProfileForm
                      fullName={fullName}
                      setFullName={setFullName}
                      username={username}
                      setUsername={setUsername}
                      password={password}
                      setPassword={setPassword}
                      confirmPassword={confirmPassword}
                      setConfirmPassword={setConfirmPassword}
                      loading={loading}
                      submitProfile={submitProfile}
                    />
                  )}

                  {step === "done" && (
                    <div className="text-center py-6">
                      <p className="font-semibold text-emerald-700">Đăng ký thành công</p>
                      <p className="mt-2 text-sm text-slate-600">Bạn có thể đăng nhập ngay bây giờ.</p>
                      <Link href="/login" className="mt-4 inline-block rounded-xl bg-rose-500 px-6 py-3 text-white">
                        Đăng nhập
                      </Link>
                    </div>
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