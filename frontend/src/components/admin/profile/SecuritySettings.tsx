"use client";

import { useState } from "react";
import { getAuthTokens } from "@/lib/api/authToken";
import { changePassword, requestOtp, verifyOtp } from "@/lib/api/authApi";

type Props = {
  email?: string;
};

export default function SecuritySettings({ email }: Props) {
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [otpCode, setOtpCode] = useState("");
  
  const [otpSessionToken, setOtpSessionToken] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [message, setMessage] = useState<{ text: string, type: "success" | "error" } | null>(null);

  async function handleSendOtp() {
    setMessage(null);
    if (!email?.trim()) {
      setMessage({ text: "Không tìm thấy email Admin để gửi OTP.", type: "error" });
      return;
    }

    setSendingOtp(true);
    try {
      // Gọi API yêu cầu cấp OTP Reset Password
      await requestOtp(email.trim(), "EMAIL", "RESET_PASSWORD");
      setOtpSessionToken("");
      setMessage({ text: "Đã gửi OTP tới email của bạn. Vui lòng kiểm tra hộp thư.", type: "success" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err || "");
      setMessage({ text: msg || "Gửi OTP thất bại.", type: "error" });
    } finally {
      setSendingOtp(false);
    }
  }

  async function handleVerifyOtp() {
    setMessage(null);
    if (!email?.trim()) {
      setMessage({ text: "Không tìm thấy email để xác thực OTP.", type: "error" });
      return;
    }
    if (otpCode.trim().length < 6) {
      setMessage({ text: "Vui lòng nhập đủ 6 số OTP.", type: "error" });
      return;
    }

    setVerifyingOtp(true);
    try {
      // Gọi API xác nhận OTP, lấy lại chuỗi token hợp lệ để đổi mk
      const verify = await verifyOtp(email.trim(), "EMAIL", otpCode.trim(), "RESET_PASSWORD");
      setOtpSessionToken(verify.otpSessionToken);
      setMessage({ text: "Mã OTP hợp lệ. Bây giờ bạn có thể nhập mật khẩu mới.", type: "success" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err || "");
      setOtpSessionToken("");
      setMessage({ text: msg || "OTP không hợp lệ hoặc đã hết hạn.", type: "error" });
    } finally {
      setVerifyingOtp(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    // Validate form
    if (!currentPwd || !newPwd || !confirmPwd) {
      setMessage({ text: "Vui lòng nhập đủ các trường mật khẩu.", type: "error" });
      return;
    }
    if (newPwd !== confirmPwd) {
      setMessage({ text: "Mật khẩu xác nhận không khớp với mật khẩu mới.", type: "error" });
      return;
    }
    if (newPwd.length < 8) {
      setMessage({ text: "Mật khẩu mới phải có ít nhất 8 ký tự.", type: "error" });
      return;
    }
    if (!otpSessionToken) {
      setMessage({ text: "Vui lòng xác thực mã OTP trước khi tiến hành cập nhật mật khẩu.", type: "error" });
      return;
    }

    setLoading(true);
    try {
      const tokens = getAuthTokens();
      if (!tokens?.accessToken) throw new Error("Chưa đăng nhập. Không có quyền.");

      // Submit tới API Backend thực
      await changePassword(tokens.accessToken, {
        currentPassword: currentPwd,
        newPassword: newPwd,
        otpSessionToken: otpSessionToken
      });

      setMessage({ text: "Đổi mật khẩu thành công! Hãy dùng mật khẩu mới trong lần đăng nhập tới.", type: "success" });
      setCurrentPwd("");
      setNewPwd("");
      setConfirmPwd("");
      setOtpCode("");
      setOtpSessionToken("");
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Đổi mật khẩu thất bại.";
      setMessage({ text: errorMsg, type: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-slate-100 bg-white p-4 lg:p-6 shadow-sm">
      <h3 className="curosr-pointer mb-4 text-base font-bold text-slate-800">Đổi mật khẩu bảo mật</h3>

      {/* BOX BẮT OTP */}
      <div className="mb-6 rounded-xl border border-slate-100 bg-slate-50 p-4">
        <label className="text-xs font-semibold text-slate-600 mb-1.5 block uppercase tracking-wide">1. Trích xuất Mail OTP</label>
        
        <div className="flex flex-col sm:flex-row gap-2 mt-2 border-b border-slate-200 pb-4 mb-4">
           <input
             readOnly
             value={email || "Đang tải email..."}
             className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-500 bg-slate-100 cursor-not-allowed"
           />
           <button
             type="button"
             onClick={handleSendOtp}
             disabled={sendingOtp || !email}
             className="cursor-pointer whitespace-nowrap rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm hover:bg-slate-100 disabled:opacity-60 font-medium"
           >
             {sendingOtp ? "Đang gửi đi..." : "Gửi lấy OTP"}
           </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
            <input
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-rose-400 focus:ring-1 focus:ring-rose-400 outline-none"
              placeholder="Nhập 6 số OTP (Gửi tới Mail)..."
            />
            <button
              type="button"
              onClick={handleVerifyOtp}
              disabled={verifyingOtp || otpCode.length < 6}
              className={`cursor-pointer whitespace-nowrap px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                otpSessionToken 
                  ? 'bg-emerald-100 text-emerald-700 pointer-events-none'
                  : 'bg-rose-500 text-white hover:bg-rose-600 disabled:opacity-60'
              }`}
            >
              {verifyingOtp ? "Đang dò..." : otpSessionToken ? "✔ OTP Hợp lệ" : "Kiểm tra OTP"}
            </button>
        </div>
      </div>

      {/* BOX NHẬP PASSWORD */}
      <div className="grid gap-4">
        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">2. Thiết lập mật khẩu mới</label>
        
        <div>
          <input
            type="password"
            value={currentPwd}
            onChange={(e) => setCurrentPwd(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-rose-400 focus:ring-1 focus:ring-rose-400 outline-none placeholder:text-slate-300"
            placeholder="Mật khẩu hiện tại..."
            required
          />
        </div>
        
        <div>
          <input
            type="password"
            value={newPwd}
            onChange={(e) => setNewPwd(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-rose-400 focus:ring-1 focus:ring-rose-400 outline-none placeholder:text-slate-300"
            placeholder="Mật khẩu mới (Tối thiểu 8 ký tự)..."
            required
            minLength={8}
          />
        </div>

        <div>
          <input
            type="password"
            value={confirmPwd}
            onChange={(e) => setConfirmPwd(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-rose-400 focus:ring-1 focus:ring-rose-400 outline-none placeholder:text-slate-300"
            placeholder="Gõ lại xác nhận mật khẩu mới..."
            required
            minLength={8}
          />
        </div>

        {message && (
          <p className={`text-sm mt-1 font-medium ${message.type === "error" ? "text-rose-600" : "text-emerald-600"}`}>
            {message.type === "error" ? "⚠ " : "✅"} {message.text}
          </p>
        )}

        <div className="mt-2 flex items-center gap-3">
          <button
            type="submit"
            disabled={loading || !otpSessionToken}
            className="cursor-pointer rounded-xl px-5 py-2.5 text-sm font-semibold bg-rose-500 text-white hover:bg-rose-600 disabled:opacity-60 transition-colors"
          >
            {loading ? "Hệ thống đang xoay..." : "Xác nhận đổi mật khẩu"}
          </button>
        </div>
      </div>
    </form>
  );
}