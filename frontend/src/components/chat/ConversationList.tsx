// frontend/src/components/chat/ConversationList.tsx
"use client";
import { useEffect, useState } from "react";
import { ConversationResponse } from "@/types/chat";
import { getUserById } from "@/lib/api/userApi";
import ConversationItem from "./ConversationItem";

interface Props {
  conversations: ConversationResponse[];
  loading: boolean;
  activeId: number | null;
  currentUserId: number;
  onSelect: (conv: ConversationResponse) => void;
}

export default function ConversationList({
  conversations,
  loading,
  activeId,
  currentUserId,
  onSelect,
}: Props) {
  const [search, setSearch] = useState("");
  const [userNames, setUserNames] = useState<Record<number, string>>({});

  useEffect(() => {
    const ids = conversations
      .filter((c) => c.type === "PRIVATE")
      .map((c) => c.memberIds.find((id) => id !== currentUserId))
      .filter((id): id is number => typeof id === "number");

    const missing = ids.filter((id) => !userNames[id]);
    if (missing.length === 0) return;

    let cancelled = false;

    Promise.all(
      [...new Set(missing)].map(async (id) => {
        try {
          const u = await getUserById(String(id));
          return [id, u.fullName || `Người dùng #${id}`] as const;
        } catch {
          return [id, `Người dùng #${id}`] as const;
        }
      })
    ).then((pairs) => {
      if (cancelled) return;
      setUserNames((prev) => {
        const next = { ...prev };
        pairs.forEach(([id, name]) => {
          next[id] = name;
        });
        return next;
      });
    });

    return () => {
      cancelled = true;
    };
  }, [conversations, currentUserId, userNames]);

  const filtered = conversations.filter((c) => {
    const name =
      c.type === "GROUP"
        ? c.name ?? ""
        : userNames[c.memberIds.find((id) => id !== currentUserId) ?? -1] ||
          `Người dùng #${c.memberIds.find((id) => id !== currentUserId) ?? ""}`;

    return name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-5 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-slate-900">Tin nhắn</h1>
          <button
            className="w-9 h-9 flex items-center justify-center rounded-full
              bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-500 transition"
            title="Tạo cuộc trò chuyện mới"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm…"
            className="w-full pl-9 pr-4 py-2.5 bg-slate-100 rounded-full text-sm
              border-none outline-none focus:bg-slate-200 transition placeholder-slate-400"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {loading ? (
          <div className="space-y-1 px-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                <div className="w-12 h-12 rounded-full bg-slate-200 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-slate-200 rounded-full w-3/4" />
                  <div className="h-2.5 bg-slate-100 rounded-full w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-sm text-slate-400 text-center">
              {search ? "Không có kết quả" : "Chưa có cuộc trò chuyện nào"}
            </p>
          </div>
        ) : (
          filtered.map((c) => {
            const otherId = c.memberIds.find((id) => id !== currentUserId);
            const resolvedName =
              c.type === "GROUP" ? c.name || "Nhóm chat" : otherId ? userNames[otherId] : undefined;

            return (
              <ConversationItem
                key={c.id}
                conversation={c}
                isActive={c.id === activeId}
                currentUserId={currentUserId}
                resolvedName={resolvedName}
                onClick={() => onSelect(c)}
              />
            );
          })
        )}
      </div>
    </div>
  );
}