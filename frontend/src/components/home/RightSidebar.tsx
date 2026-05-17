"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { chatApi } from "@/lib/api/chatApi";
import { ConversationResponse, ChatRealtimeEvent } from "@/types/chat";
import { getAuthTokens } from "@/lib/api/authToken";
import { onRead, onPrivateThreadsSync } from "@/lib/event/chatEvents";
import FloatingChatWindow from "@/components/chat/FloatingChatWindow";
import { useRouter } from "next/navigation";
import { initChatSocket, subscribeConversation, subscribePresence } from "@/lib/socket/chatSocket";
import { getUserById } from "@/lib/api/userApi";
import { UserPresenceResponse } from "@/types/chat";
import { formatLastActiveSubtitle } from "@/lib/chat/presenceLabels";

const GRADS = [
  "from-rose-400 to-pink-500",
  "from-violet-400 to-purple-500",
  "from-sky-400 to-blue-500",
  "from-emerald-400 to-teal-500",
  "from-orange-400 to-amber-500",
  "from-fuchsia-400 to-pink-600",
];

function grad(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = s.charCodeAt(i) + ((h << 5) - h);
  return GRADS[Math.abs(h) % GRADS.length];
}

function parseUserId(token: string): number | null {
  try {
    const p = JSON.parse(atob(token.split(".")[1]));
    return Number(p.sub ?? p.userId ?? p.id) || null;
  } catch {
    return null;
  }
}

export default function RightSidebar() {
  const router = useRouter();
  const currentUserId = parseUserId(getAuthTokens()?.accessToken ?? "");

  const [contacts, setContacts] = useState<ConversationResponse[]>([]);
  const [privateThreads, setPrivateThreads] = useState<ConversationResponse[]>([]);
  const privateThreadsRef = useRef(privateThreads);

  useEffect(() => {
    privateThreadsRef.current = privateThreads;
  }, [privateThreads]);
  const [loading, setLoading] = useState(true);
  const [openChats, setOpenChats] = useState<ConversationResponse[]>([]);
  const [userNames, setUserNames] = useState<Record<number, string>>({});
  const [presenceMap, setPresenceMap] = useState<Record<number, UserPresenceResponse>>({});
  const [isDesktop, setIsDesktop] = useState(false);

  const openIds = useMemo(() => openChats.map((c) => c.id), [openChats]);
  const openIdsRef = useRef<number[]>([]);

  useEffect(() => {
    const syncViewport = () => setIsDesktop(window.innerWidth >= 1024);
    syncViewport();
    window.addEventListener("resize", syncViewport);
    return () => window.removeEventListener("resize", syncViewport);
  }, []);

  useEffect(() => {
    openIdsRef.current = openIds;
    sessionStorage.setItem("chat:openConversationIds", JSON.stringify(openIds));
    return () => {
      sessionStorage.removeItem("chat:openConversationIds");
    };
  }, [openIds]);

  const contactIdsKey = useMemo(
    () => contacts.map((c) => c.id).sort((a, b) => a - b).join(","),
    [contacts]
  );

  const privateIdsKey = useMemo(
    () => privateThreads.map((c) => c.id).sort((a, b) => a - b).join(","),
    [privateThreads]
  );

  const fetchSidebarData = useCallback(async () => {
    const tokens = getAuthTokens();
    if (!tokens?.accessToken) return;
    try {
      const data = await chatApi.listConversations();
      const privates = data.filter((c) => c.type === "PRIVATE");
      setPrivateThreads(privates);
      const enriched = await Promise.all(
        privates.map(async (c) => {
          try {
            const msgs = await chatApi.getMessages(c.id, undefined, 1);
            if (msgs.length === 0) return null;
            const msg = msgs[0];
            return {
              ...c,
              lastMessageContent: msg?.deleted ? "Tin nhắn đã bị xóa" : msg?.content,
              lastMessageAt: msg?.createdAt,
            } as ConversationResponse;
          } catch {
            return null;
          }
        })
      );
      setContacts(enriched.filter((x): x is ConversationResponse => x != null));
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void fetchSidebarData().finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [fetchSidebarData]);

  useEffect(() => {
    return onPrivateThreadsSync(() => {
      void fetchSidebarData();
    });
  }, [fetchSidebarData]);

  useEffect(() => {
    const ids = contacts
      .map((c) => c.memberIds.find((id) => id !== currentUserId))
      .filter((id): id is number => typeof id === "number");

    const missing = [...new Set(ids)].filter((id) => !userNames[id]);
    if (missing.length === 0) return;

    let cancelled = false;

    Promise.all(
      missing.map(async (id) => {
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
  }, [contacts, currentUserId, userNames]);

  useEffect(() => {
    if (currentUserId == null || !contacts.length) return;
    const peerIds = [
      ...new Set(
        contacts
          .map((c) => c.memberIds.find((id) => id !== currentUserId))
          .filter((id): id is number => typeof id === "number")
      ),
    ];
    if (!peerIds.length) return;
    chatApi
      .getPresence(peerIds)
      .then((list) => {
        setPresenceMap((prev) => {
          const next = { ...prev };
          list.forEach((p) => {
            next[p.userId] = p;
          });
          return next;
        });
      })
      .catch(() => undefined);
  }, [contactIdsKey, contacts, currentUserId]);

  useEffect(() => {
    initChatSocket();
    const unsub = subscribePresence((ev) => {
      if (ev.eventName !== "chat.user.presence" || ev.targetUserId == null) return;
      setPresenceMap((prev) => ({
        ...prev,
        [ev.targetUserId!]: {
          userId: ev.targetUserId!,
          online: Boolean(ev.online),
          lastSeenAt: ev.lastSeenAt || new Date().toISOString(),
        },
      }));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    return onRead(({ conversationId }) => {
      setContacts((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c))
      );
    });
  }, []);

  useEffect(() => {
    if (currentUserId == null || privateThreads.length === 0) return;
    initChatSocket();

    const unsubs = privateThreads.map((c) =>
      subscribeConversation(c.id, (ev: ChatRealtimeEvent) => {
        if (ev.eventName !== "chat.message.sent") return;
        if (openIdsRef.current.includes(ev.conversationId)) return;

        const fromPeer = ev.senderId !== currentUserId;

        setContacts((prev) => {
          const idx = prev.findIndex((x) => x.id === ev.conversationId);
          const base = privateThreadsRef.current.find((x) => x.id === ev.conversationId);
          if (!base) return prev;

          const bumpUnread = fromPeer ? 1 : 0;

          if (idx >= 0) {
            const cur = prev[idx];
            const updated = {
              ...cur,
              unreadCount: cur.unreadCount + bumpUnread,
              lastMessageContent: ev.content ?? cur.lastMessageContent,
              lastMessageAt: ev.createdAt ?? cur.lastMessageAt,
            };
            const rest = prev.filter((x) => x.id !== ev.conversationId);
            return [updated, ...rest];
          }

          return [
            {
              ...base,
              unreadCount: (base.unreadCount ?? 0) + bumpUnread,
              lastMessageContent: ev.content || "",
              lastMessageAt: ev.createdAt || new Date().toISOString(),
            },
            ...prev,
          ];
        });
      })
    );

    return () => {
      unsubs.forEach((u) => u());
    };
  }, [privateIdsKey, currentUserId]);

  const totalUnread = useMemo(() => contacts.reduce((s, c) => s + c.unreadCount, 0), [contacts]);

  const openChat = (conv: ConversationResponse) => {
    setContacts((prev) => {
      const idx = prev.findIndex((x) => x.id === conv.id);
      if (idx < 0) return prev;
      const updated = { ...prev[idx], unreadCount: 0 };
      const rest = prev.filter((x) => x.id !== conv.id);
      return [updated, ...rest];
    });
    void chatApi.markAsRead(conv.id).catch(console.error);

    setOpenChats((prev) => {
      if (prev.find((c) => c.id === conv.id)) return prev;
      return [...prev, conv].slice(-2);
    });
  };

  const closeChat = (id: number) => {
    setOpenChats((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <>
      <aside className="hidden lg:flex flex-col fixed inset-y-0 right-0 w-72 bg-white border-l border-slate-100 py-6 overflow-y-auto">
        <section className="px-5 flex-1">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Bạn bè</h3>
              {totalUnread > 0 && (
                <span className="bg-rose-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 leading-none">
                  {totalUnread > 99 ? "99+" : totalUnread}
                </span>
              )}
            </div>
            <button
              onClick={() => router.push("/messages")}
              className="cursor-pointer text-[11px] text-rose-400 hover:text-rose-600 font-semibold transition"
            >
              Tất cả
            </button>
          </div>

          <div className="space-y-0.5">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-1 py-2 animate-pulse">
                  <div className="w-9 h-9 rounded-full bg-slate-200 flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-2.5 bg-slate-200 rounded-full w-3/4" />
                    <div className="h-2 bg-slate-100 rounded-full w-1/2" />
                  </div>
                </div>
              ))
            ) : contacts.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                  </svg>
                </div>
                <p className="text-xs text-slate-400">Chưa có liên lạc nào</p>
              </div>
            ) : (
              contacts.slice(0, 8).map((c) => {
                const otherId = c.memberIds.find((id) => id !== currentUserId);
                const isSelfConversation = c.type === "PRIVATE" && otherId == null;
                const fallbackName =
                  (otherId ? userNames[otherId] : undefined) || "Bản thân";
                const displayName = c.nickname?.trim() || fallbackName;
                const presence = otherId != null ? presenceMap[otherId] : undefined;
                const online = presence ? Boolean(presence.online) : false;
                const presenceSubtitle = presence
                  ? online
                    ? "Đang hoạt động"
                    : formatLastActiveSubtitle(presence.lastSeenAt)
                  : "Đang tải...";
                const isOpen = openChats.some((o) => o.id === c.id);

                return (
                  <button
                    key={c.id}
                    onClick={() => openChat(c)}
                    className={`cursor-pointer w-full flex items-center gap-3 px-2 py-2 rounded-xl text-left transition-all group ${
                      isOpen ? "bg-rose-50" : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      <div
                        className={`w-9 h-9 rounded-full bg-gradient-to-br ${grad(displayName)}
                          flex items-center justify-center text-white text-xs font-bold shadow-sm`}
                      >
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                      {!isSelfConversation && (
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                            presence ? (online ? "bg-green-400" : "bg-slate-400") : "bg-slate-300"
                          }`}
                        />
                      )}
                      {c.unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 leading-none shadow">
                          {c.unreadCount > 9 ? "9+" : c.unreadCount}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm truncate font-medium transition ${
                          isOpen ? "text-rose-600" : "text-slate-800 group-hover:text-slate-900"
                        } ${c.unreadCount > 0 ? "font-semibold" : ""}`}
                      >
                        {displayName}
                      </p>
                      {!isSelfConversation && (
                        <p
                          className={`text-[11px] truncate ${
                            presence ? (online ? "text-green-600 font-medium" : "text-slate-500") : "text-slate-400"
                          }`}
                        >
                          {presenceSubtitle}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </section>
      </aside>

      {isDesktop && openChats.map((conv, idx) => (
        <FloatingChatWindow
          key={conv.id}
          conversation={conv}
          offsetIndex={idx}
          onClose={() => closeChat(conv.id)}
        />
      ))}
    </>
  );
}