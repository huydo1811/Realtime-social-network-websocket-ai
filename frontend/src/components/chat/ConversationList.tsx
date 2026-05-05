// frontend/src/components/chat/ConversationList.tsx
"use client";
import { useEffect, useState } from "react";
import { ConversationResponse } from "@/types/chat";
import { getUserById } from "@/lib/api/userApi";
import { chatApi } from "@/lib/api/chatApi";
import { getAuthTokens } from "@/lib/api/authToken";
import { getMyProfile } from "@/lib/api/authApi";
import ConversationItem from "./ConversationItem";

interface Props {
  conversations: ConversationResponse[];
  loading: boolean;
  activeId: number | null;
  currentUserId: number;
  onSelect: (conv: ConversationResponse) => void;
  onConversationCreated?: (conv: ConversationResponse) => void;
}

export default function ConversationList({
  conversations,
  loading,
  activeId,
  currentUserId,
  onSelect,
  onConversationCreated,
}: Props) {
  const [search, setSearch] = useState("");
  const [userNames, setUserNames] = useState<Record<number, string>>({});
  const [openCreate, setOpenCreate] = useState(false);
  const [createType, setCreateType] = useState<"PRIVATE" | "GROUP">("PRIVATE");
  const [createName, setCreateName] = useState("");
  const [createQuery, setCreateQuery] = useState("");
  const [followedUsers, setFollowedUsers] = useState<Array<{ id: number; fullName: string; username?: string }>>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [creating, setCreating] = useState(false);

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

  useEffect(() => {
    if (!openCreate || followedUsers.length > 0) return;
    const tokens = getAuthTokens();
    if (!tokens?.accessToken) return;
    let cancelled = false;
    getMyProfile(tokens.accessToken)
      .then((profile) => {
        if (cancelled) return;
        const list = ((profile as { followingList?: Array<{ id: string | number; name?: string; username?: string }> }).followingList || [])
          .map((u) => ({
            id: Number(u.id),
            fullName: u.name || `Người dùng #${u.id}`,
            username: u.username,
          }))
          .filter((u) => Number.isFinite(u.id) && u.id !== currentUserId);
        setFollowedUsers(list);
      })
      .catch(console.error);
    return () => {
      cancelled = true;
    };
  }, [currentUserId, followedUsers.length, openCreate]);

  const handleCreateConversation = async () => {
    if (selectedIds.length === 0) return;
    if (createType === "GROUP" && !createName.trim()) return;
    setCreating(true);
    try {
      const created = await chatApi.createConversation({
        type: createType,
        name: createType === "GROUP" ? createName.trim() : undefined,
        participantIds: selectedIds,
        idempotencyKey: `create-${Date.now()}`,
      });
      onConversationCreated?.(created);
      setOpenCreate(false);
      setCreateName("");
      setCreateQuery("");
      setSelectedIds([]);
      setCreateType("PRIVATE");
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  const filtered = conversations.filter((c) => {
    const name =
      c.type === "GROUP"
        ? c.name ?? ""
        : userNames[c.memberIds.find((id) => id !== currentUserId) ?? -1] ||
          `Người dùng #${c.memberIds.find((id) => id !== currentUserId) ?? ""}`;

    return name.toLowerCase().includes(search.toLowerCase());
  });
  const filteredFollowedUsers = followedUsers.filter((u) => {
    const q = createQuery.toLowerCase();
    if (!q) return true;
    return u.fullName.toLowerCase().includes(q) || (u.username || "").toLowerCase().includes(q);
  });

  const formatTime = (raw?: string) => {
    if (!raw) return "";
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return "";
    const now = new Date();
    const todayKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
    const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

    if (todayKey === dateKey) {
      return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    }

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayKey = `${yesterday.getFullYear()}-${yesterday.getMonth()}-${yesterday.getDate()}`;
    if (dateKey === yesterdayKey) {
      return "Hôm qua";
    }

    const sameYear = date.getFullYear() === now.getFullYear();
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      ...(sameYear ? {} : { year: "numeric" }),
    });
  };

  const getConversationPreview = (conversation: ConversationResponse) => {
    const data = conversation as unknown as {
      lastMessageContent?: string;
      lastMessageAt?: string;
      lastMessage?: { content?: string; createdAt?: string };
    };
    const preview = data.lastMessageContent || data.lastMessage?.content || "";
    const time = data.lastMessageAt || data.lastMessage?.createdAt || "";
    return { preview, time };
  };

  return (
    <div className="relative flex flex-col h-full">
      <div className="px-4 pt-5 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-slate-900">Tin nhắn</h1>
          <button
            onClick={() => setOpenCreate(true)}
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
          <div className="space-y-2 px-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-2xl border border-slate-100 bg-white animate-pulse">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-200 to-slate-100 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-slate-200 rounded-full w-2/3" />
                  <div className="h-2.5 bg-slate-100 rounded-full w-5/6" />
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
            const { preview, time } = getConversationPreview(c);

            return (
              <ConversationItem
                key={c.id}
                conversation={c}
                isActive={c.id === activeId}
                currentUserId={currentUserId}
                resolvedName={resolvedName}
                preview={preview}
                timeLabel={formatTime(time)}
                onClick={() => onSelect(c)}
              />
            );
          })
        )}
      </div>

      {openCreate && (
        <div className="absolute inset-0 bg-black/30 z-20 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-slate-200">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <p className="font-semibold text-slate-900">Tạo cuộc trò chuyện</p>
              <button onClick={() => setOpenCreate(false)} className="text-slate-400 hover:text-slate-700">
                ×
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCreateType("PRIVATE")}
                  className={`px-3 py-1.5 rounded-full text-sm ${createType === "PRIVATE" ? "bg-rose-100 text-rose-600" : "bg-slate-100 text-slate-600"}`}
                >
                  Riêng tư
                </button>
                <button
                  type="button"
                  onClick={() => setCreateType("GROUP")}
                  className={`px-3 py-1.5 rounded-full text-sm ${createType === "GROUP" ? "bg-rose-100 text-rose-600" : "bg-slate-100 text-slate-600"}`}
                >
                  Nhóm
                </button>
              </div>

              {createType === "GROUP" && (
                <input
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="Tên nhóm"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-rose-100"
                />
              )}

              <input
                value={createQuery}
                onChange={(e) => setCreateQuery(e.target.value)}
                placeholder="Tìm người dùng..."
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-rose-100"
              />

              <div className="max-h-44 overflow-y-auto space-y-1">
                {filteredFollowedUsers.map((u) => {
                  const selected = selectedIds.includes(u.id);
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() =>
                        setSelectedIds((prev) =>
                          createType === "PRIVATE"
                            ? [u.id]
                            : selected
                              ? prev.filter((id) => id !== u.id)
                              : [...prev, u.id]
                        )
                      }
                      className={`w-full text-left px-3 py-2 rounded-xl border text-sm transition ${selected ? "bg-rose-50 border-rose-200 text-rose-600" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"}`}
                    >
                      <p className="font-medium">{u.fullName}</p>
                      <p className="text-xs text-slate-400">@{u.username || `user${u.id}`}</p>
                    </button>
                  );
                })}
                {filteredFollowedUsers.length === 0 && (
                  <p className="text-xs text-slate-400 px-1 py-2">
                    Không có người theo dõi phù hợp để tạo cuộc trò chuyện.
                  </p>
                )}
              </div>
            </div>
            <div className="px-4 py-3 border-t border-slate-100 flex justify-end gap-2">
              <button onClick={() => setOpenCreate(false)} className="px-3 py-2 text-sm rounded-xl bg-slate-100 text-slate-600">
                Hủy
              </button>
              <button
                onClick={() => void handleCreateConversation()}
                disabled={creating || selectedIds.length === 0 || (createType === "GROUP" && !createName.trim())}
                className="px-3 py-2 text-sm rounded-xl bg-rose-500 text-white disabled:opacity-50"
              >
                {creating ? "Đang tạo..." : "Tạo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}