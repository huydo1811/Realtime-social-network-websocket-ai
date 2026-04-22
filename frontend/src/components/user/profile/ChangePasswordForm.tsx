"use client";

import { useMemo, useState } from "react";
import { getAuthTokens } from "@/lib/api/authToken";
import { changePassword, requestOtp, verifyOtp } from "@/lib/api/authApi";

type Props = {
  email?: string;
};

export default function ChangePasswordForm({ email }: Props) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSessionToken, setOtpSessionToken] = useState("");
  const [saving, setSaving] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [message, setMessage] = useState("");

  const score = useMemo(() => {
    let s = 0;
    if (newPassword.length >= 8) s += 1;
    if (/[A-Z]/.test(newPassword)) s += 1;
    if (/[0-9]/.test(newPassword)) s += 1;
    if (/[^A-Za-z0-9]/.test(newPassword)) s += 1;
    return s;
  }, [newPassword]);

  async function handleSendOtp() {
    setMessage("");
    if (!email?.trim()) {
      setMessage("Không tìm thấy email để gửi OTP.");
      return;
    }

    setSendingOtp(true);
    try {
      await requestOtp(email.trim(), "EMAIL", "RESET_PASSWORD");
      setOtpSessionToken("");
      setMessage("Đã gửi OTP tới email của bạn. Kiểm tra MailHog.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err || "");
      setMessage(msg || "Gửi OTP thất bại.");
    } finally {
      setSendingOtp(false);
    }
  }

  async function handleVerifyOtp() {
    setMessage("");
    if (!email?.trim()) {
      setMessage("Không tìm thấy email để xác thực OTP.");
      return;
    }
    if (otpCode.trim().length < 6) {
      setMessage("Vui lòng nhập đủ 6 số OTP.");
      return;
    }

    setVerifyingOtp(true);
    try {
      const verify = await verifyOtp(email.trim(), "EMAIL", otpCode.trim(), "RESET_PASSWORD");
      setOtpSessionToken(verify.otpSessionToken);
      setMessage("OTP hợp lệ. Bây giờ bạn có thể đổi mật khẩu.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err || "");
      setOtpSessionToken("");
      setMessage(msg || "OTP không hợp lệ.");
    } finally {
      setVerifyingOtp(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");

    if (!currentPassword || !newPassword || !confirm) {
      setMessage("Vui lòng điền đầy đủ thông tin.");
      return;
    }
    if (newPassword !== confirm) {
      setMessage("Mật khẩu xác nhận chưa khớp.");
      return;
    }
    if (!otpSessionToken) {
      setMessage("Bạn phải xác thực OTP email trước khi đổi mật khẩu.");
      return;
    }

    setSaving(true);
    try {
      const tokens = getAuthTokens();
      if (!tokens?.accessToken) throw new Error("Chưa đăng nhập");

      await changePassword(tokens.accessToken, {
        currentPassword,
        newPassword,
        otpSessionToken
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirm("");
      setOtpCode("");
      setOtpSessionToken("");
      setMessage("Đổi mật khẩu thành công!");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err || "");
      setMessage(msg || "Đổi mật khẩu thất bại.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
      <h2 className="mb-4 text-lg font-semibold text-slate-900">Đổi mật khẩu</h2>

      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm text-slate-600">Email xác thực OTP</label>
          <input
            readOnly
            value={email || ""}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-700"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleSendOtp}
            disabled={sendingOtp}
            className="cursor-pointer rounded-xl border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-60"
          >
            {sendingOtp ? "Đang gửi OTP..." : "Gửi OTP qua email"}
          </button>
        </div>

        <div>
          <label className="mb-1 block text-sm text-slate-600">Mã OTP (6 số)</label>
          <div className="flex gap-2">
            <input
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:ring-2 focus:ring-rose-100"
              placeholder="Nhập OTP"
            />
            <button
              type="button"
              onClick={handleVerifyOtp}
              disabled={verifyingOtp}
              className="cursor-pointer rounded-xl bg-rose-500 px-2 py-2 font-medium text-white hover:bg-rose-600 disabled:opacity-60"
            >
              {verifyingOtp ? "Đang xác thực..." : "Xác thực OTP"}
            </button>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Trạng thái OTP: {otpSessionToken ? "Đã xác thực" : "Chưa xác thực"}
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm text-slate-600">Mật khẩu hiện tại</label>
          <input
            type="password"
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:ring-2 focus:ring-rose-100"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-slate-600">Mật khẩu mới</label>
          <input
            type="password"
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:ring-2 focus:ring-rose-100"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <div className="mt-2 flex gap-2">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className={"h-1.5 flex-1 rounded-full " + (n <= score ? "bg-rose-500" : "bg-slate-200")} />
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm text-slate-600">Xác nhận mật khẩu mới</label>
          <input
            type="password"
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:ring-2 focus:ring-rose-100"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <button
          type="submit"
          disabled={saving || !otpSessionToken}
          className="cursor-pointer rounded-xl bg-rose-500 px-5 py-2.5 font-medium text-white hover:bg-rose-600 disabled:opacity-60"
        >
          {saving ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
        </button>
        {message && <p className="text-sm text-slate-600">{message}</p>}
      </div>
    </form>
  );
}