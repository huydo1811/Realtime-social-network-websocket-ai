"use client";

import Image from "next/image";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Vui lòng nhập email và mật khẩu");
      return;
    }

    // UI-only mode: fake request
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    setLoading(false);

    // Tạm điều hướng vào dashboard, API thật nối sau
    router.push("/admin");
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
                  <form onSubmit={submit} className="space-y-8 md:space-y-10">
                    <h2 className="text-3xl md:text-5xl font-bold text-center text-rose-500 -mt-2">
                      Đăng nhập
                    </h2>

                    <div>
                      <label className="block text-base md:text-lg font-medium text-slate-700">Email</label>
                      <input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="admin@example.com"
                        className="mt-3 h-12 md:h-14 w-full rounded-xl border border-slate-200 px-3 md:px-4 text-base md:text-lg focus:ring-4 focus:ring-slate-50 outline-none"
                        required
                      />
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

                    {error && <div className="text-sm text-rose-400">{error}</div>}

                    <div className="flex items-center justify-between">
                      <button
                        type="submit"
                        disabled={!email || !password || loading}
                        className="w-full h-12 md:h-14 rounded-xl btn-primary text-lg bg-rose-500 text-white disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
                      >
                        {loading ? "Đang đăng nhập..." : "Đăng nhập"}
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