"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Landing() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  const [showForgot, setShowForgot] = useState(false);

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 font-sans flex flex-col">
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
        .animate-float-delayed { animation: float 6s ease-in-out 3s infinite; }
        .animate-fade-in-up { animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
        
        .bg-grid-slate-200 {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='%23e2e8f0'%3E%3Cpath d='M0 .5H31.5V32'/%3E%3C/svg%3E");
        }
      `}} />

      <div className="absolute inset-0 z-0 bg-grid-slate-200 [mask-image:linear-gradient(to_bottom,white,transparent)]"></div>
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-rose-300 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 animate-blob"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-rose-200 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-rose-400 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <header className="relative z-50 flex items-center justify-between px-6 lg:px-12 py-5 bg-white/70 backdrop-blur-lg shadow-sm ring-1 ring-slate-100">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 overflow-hidden rounded-xl bg-gradient-to-br from-rose-500 to-rose-300 p-0.5 shadow-md shadow-rose-200">
            <Image src="/hype.png" alt="Logo" width={40} height={40} className="h-full w-full object-cover rounded-[10px] bg-white" />
          </div>
          <span className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-rose-400 cursor-default">
            Hype
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm font-semibold text-slate-600 hover:text-rose-500 transition-colors"
          >
            Đăng nhập
          </Link>
          <Link
            href="/register"
            className="rounded-full bg-rose-500 px-5 py-2 text-sm font-bold text-white shadow-md shadow-rose-500/30 hover:bg-rose-600 hover:shadow-rose-500/50 transition-all hover:-translate-y-0.5 active:translate-y-0"
          >
            Đăng ký
          </Link>
        </div>
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* TEXT CONTENT */}
          <div className={`space-y-8 ${mounted ? '' : 'invisible'}`}>
<h1
  className="text-4xl sm:text-5xl md:text-6xl lg:text-[4rem] font-extrabold leading-[1.05] lg:leading-[1.1] animate-fade-in-up max-w-full md:max-w-[44rem]"
  style={{ animationDelay: "0.1s" }}
>
  <span className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 md:whitespace-nowrap">
    Chia sẻ khoảnh khắc,
  </span>
  <br />
  <span className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-orange-400 drop-shadow-sm md:whitespace-nowrap">
    kết nối thế giới.
  </span>
</h1>
            
            <p className="text-lg text-slate-600 max-w-lg leading-relaxed animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
              Mạng xã hội thế hệ mới giúp bạn trò chuyện thời gian thực, khám phá cộng đồng và thể hiện cá tính riêng. Trải nghiệm sự mượt mà chưa từng có ngay hôm nay.
            </p>
            
            <div className="flex flex-wrap gap-4 animate-fade-in-up" style={{ animationDelay: "0.5s" }}>
              <Link
                href="/register"
                className="relative group rounded-full bg-gradient-to-r from-rose-500 to-rose-400 p-[2px] transition-all hover:shadow-[0_0_20px_rgba(244,63,94,0.4)]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-rose-500 to-rose-400 rounded-full blur-md opacity-70 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative rounded-full bg-gradient-to-r from-rose-500 to-rose-400 px-8 py-4 text-lg font-bold text-white transition-transform group-hover:-translate-y-0.5">
                  Bắt đầu miễn phí
                </div>
              </Link>
              
              <Link
                href="/login"
                className="rounded-full bg-white/80 backdrop-blur-sm ring-1 ring-slate-200 px-8 py-4 text-lg font-bold text-slate-700 shadow-sm hover:bg-white hover:-translate-y-0.5 hover:shadow-md transition-all"
              >
                Tìm hiểu thêm
              </Link>
            </div>
            
            {/* Social Proof */}
            <div className="pt-6 flex items-center gap-4 animate-fade-in-up" style={{ animationDelay: "0.7s" }}>
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-200 overflow-hidden shadow-sm">
                    <Image src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="user" width={40} height={40} className="w-full h-full object-cover" unoptimized/>
                  </div>
                ))}
              </div>
              <div className="text-sm font-medium text-slate-500">
                Tham gia cùng <span className="font-bold text-slate-800">10,000+</span> người dùng
              </div>
            </div>
          </div>

          {/* 3D MOCKUP BÊN PHẢI */}
          <div className={`relative hidden lg:block h-[600px] w-full perspective-[1000px] animate-fade-in-up ${mounted ? '' : 'invisible'}`} style={{ animationDelay: "0.4s" }}>
            
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-gradient-to-tr from-rose-300 to-orange-200 rounded-full opacity-30 blur-3xl"></div>

            {/* MAIN POST CARD */}
            <div className="absolute top-10 left-8 right-12 bg-white/80 backdrop-blur-2xl rounded-3xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)] p-6 border border-white ring-1 ring-slate-100/50 animate-float z-10">
               <div className="flex items-center gap-4 mb-5">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-rose-400 to-orange-300 p-[2px] shadow-md">
                     <div className="w-full h-full bg-white rounded-full flex items-center justify-center p-1 overflow-hidden">
                        <Image src="https://i.pravatar.cc/100?img=5" alt="author" width={56} height={56} className="rounded-full object-cover w-full h-full" unoptimized />
                     </div>
                  </div>
                  <div className="flex-1">
                     <div className="w-32 h-4 bg-slate-800/10 rounded-full mb-2"></div>
                     <div className="w-20 h-2.5 bg-slate-800/5 rounded-full"></div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center">
                    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                    </svg>
                  </div>
               </div>
               
               <div className="w-full h-48 rounded-2xl bg-gradient-to-br from-rose-50 to-orange-50/50 mb-5 relative overflow-hidden group border border-slate-100">
                  <div className="absolute inset-0 bg-rose-400/5 group-hover:bg-rose-400/10 transition-colors"></div>
                  <div className="absolute top-0 bottom-0 -left-[100%] w-[50%] bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12 animate-[shimmer_2.5s_infinite]"></div>
               </div>
               
               <div className="flex gap-4">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-rose-50 text-rose-500 font-bold transition-transform hover:scale-105 cursor-pointer">
                     <svg className="w-5 h-5 fill-current" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg>
                     <span>4.2k</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 text-slate-600 font-bold transition-transform hover:scale-105 cursor-pointer">
                     <svg className="w-5 h-5 fill-current" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" /></svg>
                     <span>248</span>
                  </div>
               </div>
            </div>

            {/* FLOATING NOTIFICATION 1 (Chat) */}
            <div className="absolute bottom-24 -left-12 bg-white/90 backdrop-blur-xl rounded-2xl rounded-bl-sm shadow-xl shadow-rose-200/40 p-4 border border-white ring-1 ring-slate-100 flex gap-3 items-center z-20 w-64 animate-float-delayed">
               <div className="relative">
                  <Image src="https://i.pravatar.cc/100?img=1" width={48} height={48} className="w-12 h-12 rounded-full object-cover shadow-sm" alt="user" unoptimized />
                  <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
               </div>
               <div className="flex-1">
                  <div className="text-sm font-bold text-slate-800">Trần Ngọc</div>
                  <div className="text-xs text-slate-500 mt-0.5">Ê tối nay đi cafe...</div>
               </div>
            </div>

            {/* FLOATING NOTIFICATION 2 (Like) */}
            <div className="absolute top-28 -right-8 bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl shadow-orange-200/40 p-3 pr-5 border border-white ring-1 ring-slate-100 flex gap-3 items-center z-20 animate-float" style={{ animationDelay: "1s" }}>
               <div className="w-10 h-10 rounded-full bg-rose-100 items-center justify-center flex">
                 <svg className="w-5 h-5 text-rose-500 fill-current" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg>
               </div>
               <div>
                  <div className="text-[13px] text-slate-700"><span className="font-bold">Hoàng</span> đã thả tim</div>
               </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}