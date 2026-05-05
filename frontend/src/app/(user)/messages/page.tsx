"use client";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { getAuthTokens } from "@/lib/api/authToken";
import { chatApi } from "@/lib/api/chatApi";
import { ConversationResponse } from "@/types/chat";
import ConversationList from "@/components/chat/ConversationList";
import ChatWindow from "@/components/chat/ChatWindow";
import LeftSidebar from "@/components/home/LeftSidebar";
import { dispatchRead } from "@/lib/event/chatEvents";

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
  const activeIdRef = useRef<number | null>(null);


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
    if (currentUserId === undefined) return;

    if (currentUserId === null) {
      router.replace("/login");
      return;
    }

    chatApi
      .listConversations()
      .then(setConversations)
      .catch(console.error)
      .finally(() => setLoadingConvs(false));
  }, [currentUserId, router]);

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
      promoteConversation(conversationId, 1);
    },
    [promoteConversation]
  );

  const handleOwnMessage = useCallback(
    (conversationId: number) => {
      // Tin của bản thân: chỉ đẩy conversation lên đầu, không tăng unread
      promoteConversation(conversationId, 0);
    },
    [promoteConversation]
  );

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
        {chatPanel}
        {listPanel}
      </div>
    </div>
  );
}