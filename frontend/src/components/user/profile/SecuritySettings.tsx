"use client";

import { useState } from "react";
import ChangePasswordForm from "./ChangePasswordForm";
import OTPForm from "./OTPForm";
import { ProfileInfo } from "./types";
import { getAuthTokens } from "@/lib/api/authToken";
import { requestOtp, verifyOtp, updateMyProfile } from "@/lib/api/authApi";

type Props = {
  initialEmail?: string;
  initialPhone?: string;
  onClose?: () => void;
  onOpenEdit?: () => void;
  onSaved?: (payload: Partial<ProfileInfo>) => void;
};

type ContactType = "email" | "phone";

export default function SecuritySettings({ initialEmail, initialPhone, onClose, onOpenEdit, onSaved }: Props) {
  const [mode, setMode] = useState<"main" | "change-email" | "change-phone">("main");

  return (
    <div>
      {mode === "main" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Bảo mật & Tài khoản</h2>
            <div className="flex items-center gap-3">
              {onOpenEdit && (
                <button
                  onClick={() => {
                    onOpenEdit?.();
                    onClose?.();
                  }}
                  className="cursor-pointer text-sm font-medium text-rose-600 hover:underline"
                >
                  Chỉnh sửa
                </button>
              )}
              {onClose && (
                <button onClick={onClose} className="cursor-pointer text-sm text-slate-500 hover:underline">
                  Đóng
                </button>
              )}
            </div>
          </div>

          <div className="grid gap-5">
            <section>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Email</label>
              <div className="flex items-center gap-3">
                <input
                  value={initialEmail ?? ""}
                  readOnly
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5"
                />
                <button onClick={() => setMode("change-email")} className="cursor-pointer rounded-xl bg-rose-500 px-4 py-2 text-white">
                  Đổi
                </button>
              </div>
              <p className="mt-2 text-sm text-slate-500">Xác thực OTP email hiện tại và email mới trước khi đổi.</p>
            </section>

            <section>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Số điện thoại</label>
              <div className="flex items-center gap-3">
                <input
                  value={initialPhone ?? ""}
                  readOnly
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5"
                />
                <button onClick={() => setMode("change-phone")} className="cursor-pointer rounded-xl bg-rose-500 px-4 py-2 text-white">
                  Đổi
                </button>
              </div>
              <p className="mt-2 text-sm text-slate-500">Xác thực OTP số cũ và số mới trước khi đổi.</p>
            </section>

            <div>
              <h3 className="mb-2 text-sm font-semibold">Đổi mật khẩu</h3>
              <ChangePasswordForm email={initialEmail} />
            </div>
          </div>
        </div>
      )}

      {mode === "change-email" && (
        <ChangeContactFlow
          type="email"
          currentContact={initialEmail ?? ""}
          onCancel={() => setMode("main")}
          onComplete={(newEmail) => {
            onSaved?.({ email: newEmail });
            setMode("main");
          }}
        />
      )}

      {mode === "change-phone" && (
        <ChangeContactFlow
          type="phone"
          currentContact={initialPhone ?? ""}
          onCancel={() => setMode("main")}
          onComplete={(newPhone) => {
            onSaved?.({ phone: newPhone });
            setMode("main");
          }}
        />
      )}
    </div>
  );
}

function ChangeContactFlow({
  type,
  currentContact,
  onCancel,
  onComplete,
}: {
  type: ContactType;
  currentContact: string;
  onCancel: () => void;
  onComplete: (newContact: string) => void;
}) {
  const [step, setStep] = useState<"enter-new" | "verify-old" | "verify-new">("enter-new");
  const [newContact, setNewContact] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const contactTypeApi = type === "email" ? "EMAIL" : "PHONE";
  const oldPurpose = "LOGIN";
  const newPurpose = type === "email" ? "REGISTER" : "LOGIN";

  function validateNew(v: string) {
    if (type === "email") return /\S+@\S+\.\S+/.test(v);
    return /^\+?\d{7,15}$/.test(v) || /^\d{7,15}$/.test(v);
  }

  async function sendOldOtp(contact: string) {
    await requestOtp(contact, contactTypeApi, oldPurpose);
  }

  async function verifyOldOtp(code: string) {
    try {
      await verifyOtp(currentContact, contactTypeApi, code, oldPurpose);
      await requestOtp(newContact, contactTypeApi, newPurpose);
      setStep("verify-new");
      setMessage("");
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err || "");
      setMessage(msg || "Xác thực OTP contact hiện tại thất bại.");
      return false;
    }
  }

  async function sendNewOtp(contact: string) {
    await requestOtp(contact, contactTypeApi, newPurpose);
  }

  async function verifyNewOtpAndSave(code: string) {
    setSaving(true);
    try {
      await verifyOtp(newContact, contactTypeApi, code, newPurpose);

      const tokens = getAuthTokens();
      if (!tokens?.accessToken) throw new Error("Chưa đăng nhập");

      if (type === "email") {
        await updateMyProfile(tokens.accessToken, { email: newContact.trim() });
        onComplete(newContact.trim());
      } else {
        await updateMyProfile(tokens.accessToken, { phone: newContact.trim() });
        onComplete(newContact.trim());
      }

      setMessage("Cập nhật thành công.");
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err || "");
      setMessage(msg || "Không thể cập nhật liên hệ.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function startOldVerification() {
    setMessage("");
    if (!validateNew(newContact)) {
      setMessage(type === "email" ? "Email mới không hợp lệ." : "Số điện thoại mới không hợp lệ.");
      return;
    }
    try {
      await sendOldOtp(currentContact);
      setStep("verify-old");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err || "");
      setMessage(msg || "Không gửi được OTP contact hiện tại.");
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">{type === "email" ? "Đổi email" : "Đổi số điện thoại"}</h2>
        <button onClick={onCancel} className="cursor-pointer text-sm text-slate-500 hover:underline">
          Hủy
        </button>
      </div>

      {step === "enter-new" && (
        <div className="grid gap-3">
          <label className="text-sm text-slate-600">Liên hệ hiện tại</label>
          <input value={currentContact} readOnly className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5" />

          <label className="text-sm text-slate-600">Liên hệ mới</label>
          <input
            value={newContact}
            onChange={(e) => setNewContact(e.target.value)}
            placeholder={type === "email" ? "Nhập email mới" : "Nhập số điện thoại mới"}
            className="rounded-xl border border-slate-200 px-3 py-2.5"
          />

          <div className="flex gap-3">
            <button onClick={startOldVerification} className="cursor-pointer rounded-xl bg-rose-500 px-4 py-2 text-white hover:bg-rose-600">
              Tiếp tục
            </button>
            <button onClick={onCancel} className="cursor-pointer rounded-xl border px-4 py-2 hover:bg-slate-100">
              Hủy
            </button>
          </div>
          {message && <p className="text-sm text-slate-600">{message}</p>}
        </div>
      )}

      {step === "verify-old" && (
        <div>
          <p className="mb-3 text-sm text-slate-600">Nhập OTP gửi tới contact hiện tại: <b>{currentContact}</b></p>
          <OTPForm
            contactLabel={type === "email" ? "Email hiện tại" : "SĐT hiện tại"}
            contactValue={currentContact}
            onSendOtp={sendOldOtp}
            onVerify={verifyOldOtp}
            onCancel={() => setStep("enter-new")}
          />
          {message && <p className="mt-2 text-sm text-slate-600">{message}</p>}
        </div>
      )}

      {step === "verify-new" && (
        <div>
          <p className="mb-3 text-sm text-slate-600">Nhập OTP gửi tới contact mới: <b>{newContact}</b></p>
          <OTPForm
            contactLabel={type === "email" ? "Email mới" : "SĐT mới"}
            contactValue={newContact}
            onSendOtp={sendNewOtp}
            onVerify={verifyNewOtpAndSave}
            onCancel={() => setStep("enter-new")}
          />
          {saving && <p className="mt-2 text-sm text-slate-600">Đang cập nhật...</p>}
          {message && <p className="mt-2 text-sm text-slate-600">{message}</p>}
        </div>
      )}
    </div>
  );
}