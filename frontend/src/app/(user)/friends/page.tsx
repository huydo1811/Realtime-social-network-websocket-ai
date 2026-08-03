"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import UserLayout from "@/components/layout/UserLayout";
import DiscoverFriendshipPanels, { type DiscoverFriendshipTab } from "@/components/friendship/DiscoverFriendshipPanels";
import FollowingListPanel from "@/components/friendship/FollowingListPanel";
import { listIncomingRequests } from "@/lib/api/friendshipApi";

type TabId = DiscoverFriendshipTab | "following";

const tabs: { id: TabId; label: string }[] = [
  { id: "friends", label: "Bạn bè" },
  { id: "following", label: "Đang theo dõi" },
  { id: "incoming", label: "Lời mời đến" },
  { id: "outgoing", label: "Đã gửi" },
  { id: "blocked", label: "Đã chặn" },
];

export default function FriendsPage() {
  const [tab, setTab] = useState<TabId>("friends");
  const [incomingCount, setIncomingCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    const loadIncoming = async () => {
      try {
        const rows = await listIncomingRequests();
        if (!mounted) return;
        setIncomingCount(rows.length);
      } catch {
        if (!mounted) return;
        setIncomingCount(0);
      }
    };
    void loadIncoming();
    const onChanged = () => void loadIncoming();
    window.addEventListener("friendship-changed", onChanged);
    return () => {
      mounted = false;
      window.removeEventListener("friendship-changed", onChanged);
    };
  }, []);

  return (
    <UserLayout>
      <div className="w-full animate-in fade-in slide-in-from-bottom-4 pb-20 pt-2 duration-500">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4 px-1">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Bạn bè</h1>
            <p className="mt-1 font-medium text-slate-500">
              Lời mời, đang theo dõi, bạn bè và chặn — tìm thêm người ở{" "}
              <Link href="/discover" className="font-semibold text-rose-600 underline-offset-2 hover:underline">
                Khám phá
              </Link>
            </p>
          </div>
        </div>

        <div className="mb-6 flex gap-2 overflow-x-auto pb-1 scrollbar-thin [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`shrink-0 cursor-pointer rounded-full px-4 py-2 text-sm font-bold transition-all ${
                tab === t.id
                  ? "bg-rose-500 text-white shadow-md shadow-rose-200"
                  : "border border-slate-200 bg-white text-slate-600 hover:border-rose-100 hover:text-rose-600"
              }`}
            >
              <span className="inline-flex items-center gap-2">
                {t.label}
                {t.id === "incoming" && incomingCount > 0 && (
                  <span
                    className={`inline-flex min-w-[1.15rem] items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                      tab === t.id ? "bg-white/20 text-white" : "bg-rose-500 text-white"
                    }`}
                  >
                    {incomingCount > 99 ? "99+" : incomingCount}
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>

        {tab === "following" ? (
          <FollowingListPanel />
        ) : (
          <DiscoverFriendshipPanels tab={tab} />
        )}
      </div>
    </UserLayout>
  );
}
