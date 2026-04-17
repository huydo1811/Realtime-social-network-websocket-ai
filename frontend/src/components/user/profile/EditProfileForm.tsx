"use client";

import { useState } from "react";

type EditProfileFormValue = {
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
    await new Promise((r) => setTimeout(r, 650));
    setSaving(false);
    setMessage("Lưu thay đổi thành công (UI demo).");
    onSaved?.(form);
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
      <form onSubmit={onSubmit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Chỉnh sửa hồ sơ</h2>
          <div className="flex items-center gap-3">
            
            <button type="button" onClick={() => onOpenSecurity?.()} className="cursor-pointer text-sm text-rose-600 font-medium hover:underline">
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
            <div className="w-full rounded-xl border border-slate-200 px-3 py-2.5 bg-slate-50 text-sm text-slate-700 flex items-center justify-between">
              <span>{form.email}</span>
              <button type="button" onClick={() => onOpenSecurity?.()} className="cursor-pointer text-primary font-medium hover:underline">Đổi</button>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-600">Số điện thoại</label>
            <div className="w-full rounded-xl border border-slate-200 px-3 py-2.5 bg-slate-50 text-sm text-slate-700 flex items-center justify-between">
              <span>{form.phone}</span>
              <button type="button" onClick={() => onOpenSecurity?.()} className="cursor-pointer text-primary font-medium hover:underline">Đổi</button>
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

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-slate-600">Vị trí</label>
            <input
              value={form.location || ""}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="Ho Chi Minh City"
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:ring-2 focus:ring-rose-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-600">Website</label>
            <input
              value={form.website || ""}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
              placeholder="https://..."
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:ring-2 focus:ring-rose-100"
            />
          </div>
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

      <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
        <p className="text-sm font-medium text-slate-700">Preview</p>
        <div className="mt-3 rounded-xl bg-slate-50 p-3 flex items-start gap-3">
          <img src={form.avatarUrl || "/hype.png"} alt="avatar preview" className="h-16 w-16 rounded-xl object-cover" />
          <div>
            <p className="font-semibold text-slate-800">{form.fullName || "Họ tên"}</p>
            <p className="text-sm text-slate-600">@{form.username || "username"}</p>
            <p className="text-sm text-slate-600">{form.email || "email@example.com"}</p>
            <p className="mt-2 text-sm text-slate-600">{form.bio || "Bio..."}</p>
            <p className="text-sm text-slate-600 mt-2">{form.location || ""}</p>
            <a className="text-rose-600 text-sm" href={form.website || "#"}>{form.website || ""}</a>
          </div>
        </div>
      </aside>
    </div>
  );
}