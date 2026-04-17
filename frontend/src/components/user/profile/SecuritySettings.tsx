"use client";

import { useState } from "react";
import ChangePasswordForm from "./ChangePasswordForm";
import OTPForm from "./OTPForm";
import { ProfileInfo } from "./types";

type Props = {
  initialEmail?: string;
  initialPhone?: string;
  onClose?: () => void;
  onOpenEdit?: () => void;
  onSaved?: (payload: Partial<ProfileInfo>) => void;
};

export default function SecuritySettings({ initialEmail, initialPhone, onClose, onOpenEdit, onSaved }: Props) {
  const [mode, setMode] = useState<"main" | "change-email" | "change-phone">("main");

  // Demo helpers (simulate backend)
  async function sendOtpDemo(contact: string) {
    await new Promise((r) => setTimeout(r, 600));
  }
  async function verifyOtpDemo(code: string) {
    await new Promise((r) => setTimeout(r, 600));
    return true;
  }

  return (
    <div>
      {mode === "main" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Bảo mật & Tài khoản</h2>
            <div className="flex items-center gap-3">
              {onOpenEdit && (
                <button
                  onClick={() => {
                    onOpenEdit?.();
                    onClose?.();
                  }}
                  className="cursor-pointer text-sm text-rose-600 font-medium hover:underline"
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
                  className="flex-1 rounded-xl border border-slate-200 px-3 py-2.5 bg-slate-50"
                />
                <button onClick={() => setMode("change-email")} className="cursor-pointer rounded-xl bg-rose-500 px-4 py-2 text-white">
                  Đổi
                </button>
              </div>
              <p className="mt-2 text-sm text-slate-500">Đổi email sẽ yêu cầu xác nhận bằng OTP gửi tới email hiện tại và email mới.</p>
            </section>

            <section>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Số điện thoại</label>
              <div className="flex items-center gap-3">
                <input
                  value={initialPhone ?? ""}
                  readOnly
                  className="flex-1 rounded-xl border border-slate-200 px-3 py-2.5 bg-slate-50"
                />
                <button onClick={() => setMode("change-phone")} className="cursor-pointer rounded-xl bg-rose-500 px-4 py-2 text-white">
                  Đổi
                </button>
              </div>
              <p className="mt-2 text-sm text-slate-500">Đổi số điện thoại sẽ yêu cầu xác nhận bằng OTP gửi tới số hiện tại và số mới.</p>
            </section>

            <div>
              <h3 className="mb-2 text-sm font-semibold">Đổi mật khẩu</h3>
              <ChangePasswordForm />
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
          sendOtp={sendOtpDemo}
          verifyOtp={verifyOtpDemo}
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
          sendOtp={sendOtpDemo}
          verifyOtp={verifyOtpDemo}
        />
      )}
    </div>
  );
}

/* ----- Internal component: change flow (old-contact verify -> new contact -> verify new) ----- */

function ChangeContactFlow({
  type,
  currentContact,
  onCancel,
  onComplete,
  sendOtp,
  verifyOtp,
}: {
  type: "email" | "phone";
  currentContact: string;
  onCancel: () => void;
  onComplete: (newContact: string) => void;
  sendOtp: (contact: string) => Promise<void>;
  verifyOtp: (code: string) => Promise<boolean>;
}) {
  const [step, setStep] = useState<"enter-new" | "verify-old" | "verify-new">("enter-new");
  const [newContact, setNewContact] = useState("");
  const [message, setMessage] = useState("");

  function validateNew(v: string) {
    if (type === "email") {
      return /\S+@\S+\.\S+/.test(v);
    } else {
      return /^\+?\d{7,15}$/.test(v) || /^\d{7,15}$/.test(v);
    }
  }

  async function startOldVerification() {
    setMessage("");
    if (!validateNew(newContact)) {
      setMessage(type === "email" ? "Email không hợp lệ." : "Số điện thoại không hợp lệ (chỉ chữ số, 7-15 ký tự).");
      return;
    }
    try {
      await sendOtp(currentContact);
      setStep("verify-old");
    } catch {
      setMessage("Không thể gửi OTP tới contact hiện tại (demo).");
    }
  }

  async function handleOldVerified(code: string) {
    const ok = await verifyOtp(code);
    if (ok) {
      // send OTP to new contact then go to verify-new
      await sendOtp(newContact);
      setStep("verify-new");
    } else {
      setMessage("OTP xác thực contact hiện tại không đúng.");
    }
    return ok;
  }

  async function handleNewVerified(code: string) {
    const ok = await verifyOtp(code);
    if (ok) {
      onComplete(newContact);
    } else {
      setMessage("OTP xác thực contact mới không đúng.");
    }
    return ok;
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900">{type === "email" ? "Đổi email" : "Đổi số điện thoại"}</h2>
        <div className="flex items-center gap-3">
          <button onClick={onCancel} className="cursor-pointer text-sm text-slate-500 hover:underline">Hủy</button>
        </div>
      </div>

      {step === "enter-new" && (
        <div className="grid gap-3">
          <label className="text-sm text-slate-600">Liên hệ hiện tại</label>
          <input value={currentContact} readOnly className="rounded-xl border border-slate-200 px-3 py-2.5 bg-slate-50" />

          <label className="text-sm text-slate-600">Liên hệ mới</label>
          <input
            value={newContact}
            onChange={(e) => setNewContact(e.target.value)}
            placeholder={type === "email" ? "Nhập email mới" : "Nhập số điện thoại mới"}
            className="rounded-xl border border-slate-200 px-3 py-2.5"
          />

          <div className="flex gap-3">
            <button onClick={startOldVerification} className="cursor-pointer rounded-xl bg-rose-500 px-4 py-2 text-white hover:bg-rose-600">Tiếp tục</button>
            <button onClick={onCancel} className="cursor-pointer rounded-xl border px-4 py-2 hover:bg-slate-100">Hủy</button>
          </div>

          {message && <p className="text-sm text-slate-600">{message}</p>}
        </div>
      )}

      {step === "verify-old" && (
        <div>
          <p className="mb-3 text-sm text-slate-600">Một mã (OTP) đã được gửi tới contact hiện tại <b>{currentContact}</b>. Nhập mã để xác nhận trước khi gửi tới contact mới.</p>
          <OTPForm
            contactLabel={type === "email" ? "Email (hiện tại)" : "Số điện thoại (hiện tại)"}
            contactValue={currentContact}
            onSendOtp={sendOtp}
            onVerify={async (code) => {
              const ok = await handleOldVerified(code);
              return ok;
            }}
            onCancel={() => {
              setStep("enter-new");
            }}
          />
          {message && <p className="mt-2 text-sm text-slate-600">{message}</p>}
        </div>
      )}

      {step === "verify-new" && (
        <div>
          <p className="mb-3 text-sm text-slate-600">Đã gửi mã tới contact mới <b>{newContact}</b>. Nhập mã để hoàn tất thay đổi.</p>
          <OTPForm
            contactLabel={type === "email" ? "Email (mới)" : "Số điện thoại (mới)"}
            contactValue={newContact}
            onSendOtp={sendOtp}
            onVerify={async (code) => {
              const ok = await handleNewVerified(code);
              return ok;
            }}
            onCancel={() => {
              setStep("enter-new");
            }}
          />
          {message && <p className="mt-2 text-sm text-slate-600">{message}</p>}
        </div>
      )}
    </div>
  );
}