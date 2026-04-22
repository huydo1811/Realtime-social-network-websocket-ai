"use client";

import { useState } from "react";
import { getAuthTokens } from "@/lib/api/authToken";
import { updateMyProfile } from "@/lib/api/authApi";

export type EditProfileFormValue = {
  email: string;
  phone: string;
  username?: string;
  fullName: string;
  bio: string;
  location?: string;
  website?: string;
  avatarUrl?: string;
  coverUrl?: string;
};

type Props = {
  initialValue: EditProfileFormValue;
  onClose?: () => void;
  onSaved?: (v: EditProfileFormValue) => void;
  onOpenSecurity?: () => void;
};

export default function EditProfileForm({ initialValue, onClose, onSaved, onOpenSecurity }: Props) {
  const [form, setForm] = useState<EditProfileFormValue>(initialValue);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

async function onSubmit(e: React.FormEvent) {
  e.preventDefault();
  setMessage("");
  setSaving(true);

  try {
    const tokens = getAuthTokens();
    if (!tokens?.accessToken) throw new Error("Chưa đăng nhập");

    const username = (form.username || "").trim();
    const updated = (await updateMyProfile(tokens.accessToken, {
      username: username || undefined,
      fullName: form.fullName.trim() || undefined,
      phone: form.phone.trim() || undefined,
      bio: form.bio.trim() || undefined,
      avatarUrl: (form.avatarUrl || "").trim() || undefined,
      coverUrl: (form.coverUrl || "").trim() || undefined,
    })) as {
      username?: string;
      email?: string;
      phone?: string;
      fullName?: string;
      bio?: string;
      avatarUrl?: string;
      coverUrl?: string;
    };

    const merged: EditProfileFormValue = {
      ...form,
      username: updated.username ?? form.username,
      email: updated.email ?? form.email,
      phone: updated.phone ?? form.phone,
      fullName: updated.fullName ?? form.fullName,
      bio: updated.bio ?? form.bio,
      avatarUrl: updated.avatarUrl ?? form.avatarUrl,
      coverUrl: updated.coverUrl ?? form.coverUrl,
    };

    setForm(merged);
    setMessage("Cập nhật hồ sơ thành công!");
    onSaved?.(merged);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err || "");
    setMessage(msg || "Cập nhật thất bại.");
  } finally {
    setSaving(false);
  }
}

  return (
    <div className="">
      <form onSubmit={onSubmit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Chỉnh sửa hồ sơ</h2>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => onOpenSecurity?.()} className="cursor-pointer text-sm font-medium text-rose-600 hover:underline">
              Bảo mật
            </button>
            {onClose && (
              <button type="button" onClick={onClose} className="cursor-pointer text-sm text-slate-500 hover:underline">
                Đóng
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-slate-600">Email</label>
            <div className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700">
              <span>{form.email}</span>
              <button type="button" onClick={() => onOpenSecurity?.()} className="cursor-pointer font-medium text-primary hover:underline">Đổi</button>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-600">Số điện thoại</label>
            <div className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700">
              <span>{form.phone}</span>
              <button type="button" onClick={() => onOpenSecurity?.()} className="cursor-pointer font-medium text-primary hover:underline">Đổi</button>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm text-slate-600">Username</label>
            <input
              value={form.username || ""}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:ring-2 focus:ring-rose-100"
              placeholder="quanghuy"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm text-slate-600">Họ tên</label>
            <input
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:ring-2 focus:ring-rose-100"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="mb-1 block text-sm text-slate-600">Bio</label>
          <textarea
            className="min-h-28 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:ring-2 focus:ring-rose-100"
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
          />
        </div>

        <div className="mt-5 flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="cursor-pointer rounded-xl bg-rose-500 px-5 py-2.5 font-medium text-white hover:bg-rose-600 disabled:opacity-60"
          >
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
          {message && <p className="text-sm text-emerald-600">{message}</p>}
        </div>
      </form>
    </div>
  );
}