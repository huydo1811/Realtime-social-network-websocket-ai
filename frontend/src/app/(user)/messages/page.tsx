"use client";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { getAuthTokens } from "@/lib/api/authToken";
import { chatApi } from "@/lib/api/chatApi";
import { ConversationResponse, UserPresenceResponse } from "@/types/chat";
import ConversationList from "@/components/chat/ConversationList";
import ChatWindow from "@/components/chat/ChatWindow";
import ChatCommandPalette from "@/components/chat/ChatCommandPalette";
import LeftSidebar from "@/components/home/LeftSidebar";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import { dispatchPrivateThreadsSync, dispatchRead } from "@/lib/event/chatEvents";
import { shouldShowInThreadList } from "@/lib/chat/conversationVisibility";
import { initChatSocket, subscribeConversation, subscribePresence } from "@/lib/socket/chatSocket";

function parseUserIdFromToken(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return Number(payload.sub ?? payload.userId ?? payload.id) || null;
  } catch {
    return null;
  }
}

export default function MessagesPage() {
  const router = useRouter();
  const currentUserId = useSyncExternalStore<number | null | undefined>(
    () => () => {},
    () => {
      const tokens = getAuthTokens();
      if (!tokens?.accessToken) return null;
      return parseUserIdFromToken(tokens.accessToken);
    },
    () => undefined
  );
  const [conversations, setConversations] = useState<ConversationResponse[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [active, setActive] = useState<ConversationResponse | null>(null);
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");
  const [incomingBanner, setIncomingBanner] = useState<string | null>(null);
  const [presenceMap, setPresenceMap] = useState<Record<number, UserPresenceResponse>>({});
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteNameMap, setPaletteNameMap] = useState<Record<number, string>>({});
  const activeIdRef = useRef<number | null>(null);
  const conversationIdsKey = useMemo(
    () => conversations.map((c) => c.id).sort((a, b) => a - b).join(","),
    [conversations]
  );

  const sidebarConversations = useMemo(() => conversations.filter(shouldShowInThreadList), [conversations]);


  useEffect(() => {
    activeIdRef.current = active?.id ?? null;
    if (active?.id != null) {
      sessionStorage.setItem("chat:activeConversationId", String(active.id));
    } else {
      sessionStorage.removeItem("chat:activeConversationId");
    }
    return () => {
      sessionStorage.removeItem("chat:activeConversationId");
    };
  }, [active?.id]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onStorage = (event: StorageEvent) => {
      if (event.key !== "chat:activeConversationId") return;
      const nextId = Number(event.newValue || "0");
      if (!nextId) return;
      setActive((prev) => {
        if (prev?.id === nextId) return prev;
        const found = conversations.find((c) => c.id === nextId);
        return found ?? prev;
      });
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [conversations]);

  useEffect(() => {
    if (currentUserId === undefined) return;

    if (currentUserId === null) {
      router.replace("/login");
      return;
    }

    chatApi
      .listConversations()
      .then(async (list) => {
        const enriched = await Promise.all(
          list.map(async (c) => {
            try {
              const latest = await chatApi.getMessages(c.id, undefined, 1);
              const msg = latest[0];
              return {
                ...c,
                lastMessageContent: msg?.deleted ? "Tin nhắn đã bị xóa" : msg?.content,
                lastMessageAt: msg?.createdAt,
              };
            } catch {
              return c;
            }
          })
        );
        setConversations(enriched);
      })
      .catch(console.error)
      .finally(() => setLoadingConvs(false));
  }, [currentUserId, router]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (currentUserId == null) return;
    const ids = new Set<number>();
    conversations.forEach((c) => c.memberIds.forEach((id) => ids.add(id)));
    ids.delete(currentUserId);
    const missing = [...ids].filter((id) => !paletteNameMap[id]);
    if (missing.length === 0) return;
    let cancelled = false;
    import("@/lib/api/userApi")
      .then(({ getUserById }) =>
        Promise.all(
          missing.map(async (id) => {
            try {
              const u = await getUserById(String(id));
              return [id, u.fullName || `Người dùng #${id}`] as const;
            } catch {
              return [id, `Người dùng #${id}`] as const;
            }
          })
        )
      )
      .then((pairs) => {
        if (cancelled) return;
        setPaletteNameMap((prev) => {
          const next = { ...prev };
          pairs.forEach(([id, name]) => {
            next[id] = name;
          });
          return next;
        });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [conversationIdsKey, conversations, currentUserId, paletteNameMap]);

  useEffect(() => {
    if (currentUserId == null || !conversationIdsKey) return;
    initChatSocket();
    const ids = conversationIdsKey
      .split(",")
      .map((id) => Number(id))
      .filter((id) => Number.isFinite(id) && id > 0);
    const unsubs = ids.map((conversationId) =>
      subscribeConversation(conversationId, (ev) => {
        setConversations((prev) =>
          prev.map((c) =>
            c.id !== ev.conversationId
              ? c
              : ev.eventName === "chat.message.sent"
                ? {
                    ...c,
                    unreadCount: ev.senderId === currentUserId || activeIdRef.current === ev.conversationId
                      ? c.unreadCount
                      : c.unreadCount + 1,
                    lastMessageContent: ev.content || c.lastMessageContent,
                    lastMessageAt: ev.createdAt || c.lastMessageAt,
                  }
                : ev.eventName === "chat.conversation.appearance.updated"
                  ? ev.targetUserId && ev.targetUserId !== currentUserId
                    ? c
                    : {
                        ...c,
                        nickname: ev.nickname !== undefined ? ev.nickname : c.nickname,
                        bubbleTheme: ev.bubbleTheme ?? c.bubbleTheme,
                        backgroundTheme: ev.backgroundTheme ?? c.backgroundTheme,
                        backgroundImageUrl:
                          ev.backgroundImageUrl !== undefined ? ev.backgroundImageUrl : c.backgroundImageUrl,
                      }
                  : c
          )
        );
      })
    );
    return () => {
      unsubs.forEach((u) => u());
    };
  }, [conversationIdsKey, currentUserId]);

  useEffect(() => {
    if (!conversations.length) return;
    const ids = new Set<number>();
    conversations.forEach((c) => c.memberIds.forEach((id) => ids.add(id)));
    if (currentUserId != null) ids.delete(currentUserId);
    if (!ids.size) return;
    chatApi
      .getPresence([...ids])
      .then((list) => {
        setPresenceMap((prev) => {
          const next = { ...prev };
          list.forEach((item) => (next[item.userId] = item));
          return next;
        });
      })
      .catch(() => undefined);
  }, [conversations, currentUserId]);

  useEffect(() => {
    const unsub = subscribePresence((ev) => {
      if (ev.eventName !== "chat.user.presence" || !ev.targetUserId) return;
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

  const promoteConversation = useCallback((conversationId: number, unreadDelta = 0) => {
    setConversations((prev) => {
      const idx = prev.findIndex((c) => c.id === conversationId);
      if (idx < 0) return prev;

      const updated = {
        ...prev[idx],
        unreadCount: Math.max(0, prev[idx].unreadCount + unreadDelta),
      };
      const rest = prev.filter((c) => c.id !== conversationId);
      return [updated, ...rest];
    });
  }, []);

  const applyConversationAppearance = useCallback((updated: ConversationResponse) => {
    setConversations((prev) => prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)));
    setActive((prev) => (prev?.id === updated.id ? { ...prev, ...updated } : prev));
  }, []);

  const handleSelect = async (conv: ConversationResponse) => {
    setActive(conv);
    setMobileView("chat");

    // Clear unread tại chỗ, KHÔNG reorder list khi click
    setConversations((prev) =>
      prev.map((c) => (c.id === conv.id ? { ...c, unreadCount: 0 } : c))
    );

    if (conv.unreadCount > 0) {
      dispatchRead(conv.id, conv.unreadCount);
      void chatApi.markAsRead(conv.id).catch(console.error);
    }
  };

  const handleNewMessage = useCallback(
    (conversationId: number) => {
      // Nếu đang mở conversation này thì không tăng unread
      if (activeIdRef.current === conversationId) return;
      const conv = conversations.find((c) => c.id === conversationId);
      setIncomingBanner(
        conv?.nickname || conv?.name
          ? `Tin nhắn mới từ ${conv?.nickname || conv?.name}`
          : `Bạn có tin nhắn mới ở cuộc trò chuyện #${conversationId}`
      );
      promoteConversation(conversationId, 1);
    },
    [conversations, promoteConversation]
  );

  const handleOwnMessage = useCallback(
    (conversationId: number) => {
      // Tin của bản thân: chỉ đẩy conversation lên đầu, không tăng unread
      promoteConversation(conversationId, 0);
    },
    [promoteConversation]
  );

  const handleConversationCreated = useCallback((conv: ConversationResponse) => {
    setConversations((prev) => {
      const existed = prev.find((c) => c.id === conv.id);
      if (existed) {
        return [existed, ...prev.filter((c) => c.id !== conv.id)];
      }
      return [conv, ...prev];
    });
    setActive(conv);
    setMobileView("chat");
    dispatchPrivateThreadsSync();
  }, []);

  if (currentUserId === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-rose-200 border-t-rose-500" />
      </div>
    );
  }

  if (currentUserId === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-rose-200 border-t-rose-500" />
      </div>
    );
  }

  const listPanel = (
    <div
      className={`
      w-full lg:w-80 flex-shrink-0 border-slate-200 h-full flex flex-col
      border-t lg:border-l lg:border-t-0 bg-white
      ${mobileView === "chat" ? "hidden lg:flex" : "flex"}
    `}
    >
      <ConversationList
        conversations={sidebarConversations}
        loading={loadingConvs}
        activeId={active?.id ?? null}
        currentUserId={currentUserId}
        onSelect={handleSelect}
        onConversationCreated={handleConversationCreated}
        presenceMap={presenceMap}
      />
    </div>
  );

  const chatPanel = (
    <div
      className={`
      flex-1 min-w-0 h-full flex flex-col bg-slate-50
      ${mobileView === "list" ? "hidden lg:flex" : "flex"}
    `}
    >
      {active ? (
        <ChatWindow
          key={active.id}
          conversation={active}
          currentUserId={currentUserId}
          onBack={() => setMobileView("list")}
          onNewMessage={handleNewMessage}
          onOwnMessage={handleOwnMessage}
          onConversationAppearanceUpdated={applyConversationAppearance}
        />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-5 bg-slate-50">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center shadow-inner">
            <svg className="w-12 h-12 text-rose-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <div className="text-center px-4">
            <p className="font-semibold text-slate-700">Tin nhắn của bạn</p>
            <p className="text-sm text-slate-400 mt-1">Chọn một cuộc trò chuyện bên phải để bắt đầu</p>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <ChatCommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        conversations={sidebarConversations}
        currentUserId={currentUserId}
        userNames={paletteNameMap}
        onSelect={handleSelect}
      />
      <LeftSidebar />
      <div className="lg:ml-64 xl:ml-72 h-screen pb-16 lg:pb-0 flex overflow-hidden">
        {incomingBanner && (
          <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs px-3 py-2 rounded-full shadow-lg flex items-center gap-2">
            <span>{incomingBanner}</span>
            <button
              onClick={() => setIncomingBanner(null)}
              className="text-slate-300 hover:text-white transition"
              type="button"
            >
              ×
            </button>
          </div>
        )}
        {chatPanel}
        {listPanel}
      </div>
      <MobileBottomNav />
    </div>
  );
}