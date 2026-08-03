"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useNavBadgesContext } from "@/lib/nav/NavBadgesContext";

function formatBadge(n: number) {
  return n > 99 ? "99+" : String(n);
}

function NavBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute -right-1.5 -top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
      {formatBadge(count)}
    </span>
  );
}

const items = [
  {
    href: "/",
    label: "Trang chủ",
    badge: null as "chat" | "friends" | null,
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M11.47 3.84a.75.75 0 011.06 0l8.99 8.25a.75.75 0 11-1.04 1.1l-1.23-1.13v8.19c0 .97-.78 1.75-1.75 1.75h-5a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-2a.75.75 0 00-.75.75v4.5c0 .41-.34.75-.75.75h-5a.75.75 0 01-1.75-1.75v-8.19l-1.23 1.13a.75.75 0 11-1.04-1.1l8.99-8.25z" />
      </svg>
    ),
  },
  {
    href: "/messages",
    label: "Chat",
    badge: "chat" as const,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    ),
  },
  {
    href: "/friends",
    label: "Bạn bè",
    badge: "friends" as const,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
    ),
  },
  {
    href: "/discover",
    label: "Khám phá",
    badge: null,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
      </svg>
    ),
  },
  {
    href: "/pets",
    label: "Thú cưng",
    badge: null,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6c-2.2 0-4 1.3-4 3s1.8 3 4 3 4-1.3 4-3-1.8-3-4-3zm-7 9c0-2.2 2.7-4 7-4s7 1.8 7 4v1H5v-1zm14-6.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM7 8.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3z" />
      </svg>
    ),
  },
  {
    href: "/groups",
    label: "Nhóm",
    badge: null,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h10M7 12h10m-7 5h7M5 4h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" />
      </svg>
    ),
  },
  {
    href: "/profile",
    label: "Hồ sơ",
    badge: null,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    href: "/settings",
    label: "Cài đặt",
    badge: null,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function MobileBottomNav() {
  const pathname = usePathname() || "";
  const { friendBadge, unreadChat, dismissFriendBadge } = useNavBadgesContext();

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur">
      <div className="grid grid-cols-8">
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          const badgeCount =
            item.badge === "chat" ? unreadChat : item.badge === "friends" ? friendBadge : 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => {
                if (item.href === "/friends") dismissFriendBadge();
              }}
              className={`relative flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition ${
                active ? "text-rose-600" : "text-slate-500"
              }`}
            >
              <span className="relative">
                {item.icon}
                <NavBadge count={badgeCount} />
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
