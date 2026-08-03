"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import AdminSidebar from "../../components/admin/dashboard/AdminSidebar";
import { adminApi } from "@/lib/api/adminApi";

type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  savedAt: number;
};

type AuthStatus = "unknown" | "admin" | "not-admin";

const DRAWER_LINKS = [
  { href: "/admin", label: "Tổng quan" },
  { href: "/admin/profile", label: "Hồ sơ admin" },
  { href: "/admin/user", label: "Người dùng" },
  { href: "/admin/post", label: "Bài viết" },
  { href: "/admin/reports", label: "Báo cáo" },
  { href: "/admin/pet", label: "Thú cưng" },
  { href: "/admin/call", label: "Cuộc gọi" },
  { href: "/admin/moderation", label: "Quản lý AI" },
  { href: "/admin/audit", label: "Nhật ký thao tác" },
  { href: "/admin/groups", label: "Nhóm" },
  { href: "/admin/chat", label: "Nội dung chat" },
  { href: "/admin/chat-appearance", label: "Giao diện chat" },
  { href: "/admin/friendship", label: "Quan hệ bạn bè" },
];

const ADMIN_PAGE_LABELS: Record<string, string> = {
  "/admin": "Tổng quan",
  "/admin/profile": "Hồ sơ admin",
  "/admin/user": "Người dùng",
  "/admin/post": "Bài viết",
  "/admin/reports": "Báo cáo nội dung",
  "/admin/pet": "Thú cưng",
  "/admin/call": "Cuộc gọi",
  "/admin/moderation": "Quản lý AI",
  "/admin/audit": "Nhật ký thao tác",
  "/admin/groups": "Nhóm cộng đồng",
  "/admin/chat": "Nội dung chat",
  "/admin/chat-appearance": "Giao diện chat",
  "/admin/friendship": "Quan hệ bạn bè",
};

function resolveAdminPageLabel(pathname: string): string {
  if (ADMIN_PAGE_LABELS[pathname]) return ADMIN_PAGE_LABELS[pathname];
  const match = Object.keys(ADMIN_PAGE_LABELS)
    .filter((key) => key !== "/admin")
    .sort((a, b) => b.length - a.length)
    .find((key) => pathname.startsWith(key));
  return match ? ADMIN_PAGE_LABELS[match] : pathname;
}

function parseJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;

    const payload = parts[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(Math.ceil(parts[1].length / 4) * 4, "=");

    const decoded = atob(payload);
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function getRoleFromStorage(): string | null {
  try {
    const raw = localStorage.getItem("auth_tokens");
    if (!raw) return null;

    const tokens = JSON.parse(raw) as AuthTokens;
    if (!tokens?.accessToken) return null;

    const payload = parseJwtPayload(tokens.accessToken);
    return String(payload?.role ?? "").toUpperCase() || null;
  } catch {
    return null;
  }
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const isAdminLoginPage = useMemo(() => pathname === "/admin/login", [pathname]);
  const [authStatus, setAuthStatus] = useState<AuthStatus>("unknown");
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      const role = getRoleFromStorage();
      const ok = role === "ADMIN" || role === "ROLE_ADMIN";
      setAuthStatus(ok ? "admin" : "not-admin");
    });
  }, [pathname]);

  useEffect(() => {
    if (authStatus === "unknown") return;

    if (isAdminLoginPage && authStatus === "admin") {
      router.replace("/admin");
      return;
    }

    if (!isAdminLoginPage && authStatus !== "admin") {
      router.replace("/admin/login");
    }
  }, [authStatus, isAdminLoginPage, router]);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  const lastLoggedVisitRef = useRef<{ page: string; at: number } | null>(null);

  useEffect(() => {
    if (authStatus !== "admin" || isAdminLoginPage) return;

    const page = pathname || "/admin";
    const label = resolveAdminPageLabel(page);
    const now = Date.now();
    const last = lastLoggedVisitRef.current;
    if (last && last.page === page && now - last.at < 1500) return;

    lastLoggedVisitRef.current = { page, at: now };
    void adminApi.logPageVisit({ page, label }).catch(() => {
      // ignore logging failures
    });
  }, [authStatus, isAdminLoginPage, pathname]);

  if (isAdminLoginPage) {
    return <>{children}</>;
  }

  if (authStatus !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <div className="flex min-h-screen w-full">
        <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white md:block">
          <div className="sticky top-0 p-4 md:py-6 md:pl-4 md:pr-3">
            <AdminSidebar />
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-slate-50/95 px-4 py-3 backdrop-blur md:hidden">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="rounded-xl border border-slate-200 bg-white p-2 text-slate-700 shadow-sm"
              aria-label="Mở menu quản trị"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
              <p className="text-xs text-slate-500">Trang quản trị</p>
              <p className="text-sm font-bold text-slate-900">Hype Admin</p>
            </div>
          </header>

          <main className="min-w-0 flex-1 overflow-x-hidden px-3 py-4 sm:px-5 md:px-6 md:py-6 lg:px-8">
            <div className="mx-auto w-full max-w-[1400px]">{children}</div>
          </main>
        </div>
      </div>

      {drawerOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/45"
            aria-label="Đóng menu"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="absolute left-0 top-0 flex h-full w-[min(18rem,85vw)] flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
              <p className="text-sm font-bold text-slate-900">Menu quản trị</p>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="rounded-lg px-2 py-1 text-sm text-slate-500 hover:bg-slate-100"
              >
                Đóng
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-3">
              {DRAWER_LINKS.map((item) => {
                const active =
                  item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`mb-1 block rounded-xl px-3 py-2.5 text-sm font-medium ${
                      active
                        ? "bg-rose-50 text-rose-700"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
