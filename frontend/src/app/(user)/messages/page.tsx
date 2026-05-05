"use client";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { getAuthTokens } from "@/lib/api/authToken";
import { chatApi } from "@/lib/api/chatApi";
import { ConversationResponse } from "@/types/chat";
import ConversationList from "@/components/chat/ConversationList";
import ChatWindow from "@/components/chat/ChatWindow";
import LeftSidebar from "@/components/home/LeftSidebar";
import { dispatchRead } from "@/lib/event/chatEvents";
import { initChatSocket, subscribeConversation } from "@/lib/socket/chatSocket";

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
    () => undefined // snapshot khi SSR
  );
  const [conversations, setConversations] = useState<ConversationResponse[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [active, setActive] = useState<ConversationResponse | null>(null);
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");
  const [incomingBanner, setIncomingBanner] = useState<string | null>(null);
  const activeIdRef = useRef<number | null>(null);
  const conversationIdsKey = useMemo(
    () => conversations.map((c) => c.id).sort((a, b) => a - b).join(","),
    [conversations]
  );


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
    if (currentUserId == null || !conversationIdsKey) return;
    initChatSocket();
    const ids = conversationIdsKey
      .split(",")
      .map((id) => Number(id))
      .filter((id) => Number.isFinite(id) && id > 0);
    const unsubs = ids.map((conversationId) =>
      subscribeConversation(conversationId, (ev) => {
        if (ev.eventName !== "chat.message.sent") return;
        setConversations((prev) =>
          prev.map((c) =>
            c.id === ev.conversationId
              ? {
                  ...c,
                  unreadCount: ev.senderId === currentUserId || activeIdRef.current === ev.conversationId
                    ? c.unreadCount
                    : c.unreadCount + 1,
                  lastMessageContent: ev.content,
                  lastMessageAt: ev.createdAt,
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
        conv?.name
          ? `Tin nhắn mới từ ${conv.name}`
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
      w-full sm:w-72 md:w-80 flex-shrink-0 bg-white border-slate-200 h-full flex flex-col
      border-l md:border-l border-t md:border-t-0
      ${mobileView === "chat" ? "hidden md:flex" : "flex"}
    `}
    >
      <ConversationList
        conversations={conversations}
        loading={loadingConvs}
        activeId={active?.id ?? null}
        currentUserId={currentUserId}
        onSelect={handleSelect}
        onConversationCreated={handleConversationCreated}
      />
    </div>
  );

  const chatPanel = (
    <div
      className={`
      flex-1 min-w-0 h-full flex flex-col bg-slate-50
      ${mobileView === "list" ? "hidden md:flex" : "flex"}
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
      <LeftSidebar />
      <div className="md:ml-64 lg:ml-72 h-screen flex overflow-hidden">
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
    </div>
  );
}