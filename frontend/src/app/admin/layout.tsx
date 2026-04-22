"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import AdminSidebar from "../../components/admin/dashboard/AdminSidebar";

type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  savedAt: number;
};

type AuthStatus = "unknown" | "admin" | "not-admin";

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

  if (isAdminLoginPage) {
    return <>{children}</>;
  }

  if (authStatus !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-8">
        <div className="grid grid-cols-[16rem_1fr] gap-6">
          <aside className="hidden md:block">
            <div className="w-64 flex-shrink-0">
              <AdminSidebar />
            </div>
          </aside>
          <main>{children}</main>
        </div>
      </div>
    </div>
  );
}