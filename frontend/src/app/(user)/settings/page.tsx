"use client";

import Link from "next/link";
import UserLayout from "@/components/layout/UserLayout";

const sections: {
  title: string;
  items: { href: string; label: string; description: string; disabled?: boolean }[];
}[] = [
  {
    title: "Tài khoản & hồ sơ",
    items: [
      {
        href: "/profile",
        label: "Chỉnh sửa hồ sơ",
        description: "Tên, ảnh đại diện, tiểu sử và thông tin cá nhân.",
      },
      {
        href: "/profile",
        label: "Đổi mật khẩu",
        description: "Mở hồ sơ → mục Bảo mật để xác thực OTP email và đặt mật khẩu mới.",
      },
    ],
  },
  {
    title: "Chat & tương tác",
    items: [
      {
        href: "/settings/chat",
        label: "Người dùng đã chặn",
        description: "Xem và bỏ chặn người dùng trong tin nhắn.",
      },
      {
        href: "/messages",
        label: "Giao diện chat",
        description: "Tùy chỉnh ảnh nền và chủ đề trong từng cuộc trò chuyện.",
      },
    ],
  },
  {
    title: "Quyền riêng tư & thông báo",
    items: [
      {
        href: "/profile",
        label: "Quyền riêng tư hồ sơ",
        description: "Chỉnh thông tin hiển thị công khai trên trang cá nhân.",
      },
      {
        href: "#",
        label: "Mặc định quyền xem bài viết",
        description: "Sắp ra mắt — chọn PUBLIC / Bạn bè / Riêng tư mặc định khi đăng.",
        disabled: true,
      },
      {
        href: "#",
        label: "Thông báo",
        description: "Sắp ra mắt — bật/tắt thông báo bạn bè, nhóm, thú cưng.",
        disabled: true,
      },
    ],
  },
  {
    title: "Ngôn ngữ & hệ thống",
    items: [
      {
        href: "#",
        label: "Ngôn ngữ giao diện",
        description: "Hiện tại: Tiếng Việt. Hỗ trợ thêm ngôn ngữ sẽ có trong bản cập nhật sau.",
        disabled: true,
      },
    ],
  },
];

export default function SettingsHubPage() {
  return (
    <UserLayout>
      <div className="mx-auto max-w-2xl px-4 py-6">
        <h1 className="text-2xl font-bold text-slate-900">Cài đặt</h1>
        <p className="mt-1 text-sm text-slate-600">Quản lý tài khoản, chat, quyền riêng tư và tùy chọn hệ thống.</p>

        <div className="mt-6 space-y-6">
          {sections.map((section) => (
            <div key={section.title}>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {section.title}
              </h2>
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                {section.items.map((item, idx) => {
                  const inner = (
                    <div
                      className={`flex flex-col gap-0.5 px-4 py-3.5 ${
                        item.disabled ? "cursor-not-allowed opacity-60" : "hover:bg-slate-50"
                      } ${idx > 0 ? "border-t border-slate-100" : ""}`}
                    >
                      <span className="text-sm font-semibold text-slate-900">{item.label}</span>
                      <span className="text-xs text-slate-500">{item.description}</span>
                    </div>
                  );
                  if (item.disabled || item.href === "#") {
                    return <div key={item.label}>{inner}</div>;
                  }
                  return (
                    <Link key={item.href + item.label} href={item.href} className="block transition">
                      {inner}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </UserLayout>
  );
}
