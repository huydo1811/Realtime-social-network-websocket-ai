"use client";

import { useEffect, useState } from "react";
import { getAuthTokens } from "@/lib/api/authToken";
import { onRead } from "@/lib/event/chatEvents";
import { initChatSocket, subscribeConversation } from "@/lib/socket/chatSocket";
import type { ChatRealtimeEvent } from "@/types/chat";

function parseUserId(token: string): number | null {
  try {
    const p = JSON.parse(atob(token.split(".")[1]));
    return Number(p.sub ?? p.userId ?? p.id) || null;
  } catch {
    return null;
  }
}

function safeParseOpenIds(raw: string | null): number[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr.map((x) => Number(x)).filter((x) => Number.isFinite(x));
  } catch {
    return [];
  }
}

export function useChatUnread() {
  const [unreadChat, setUnreadChat] = useState(0);

  useEffect(() => {
    return onRead(({ amount }) => {
      setUnreadChat((prev) => Math.max(0, prev - amount));
    });
  }, []);

  useEffect(() => {
    const tokens = getAuthTokens();
    if (!tokens?.accessToken) return;

    const actorId = parseUserId(tokens.accessToken);
    if (actorId == null) return;

    let unsubs: Array<() => void> = [];
    let cancelled = false;

    import("@/lib/api/chatApi")
      .then(({ chatApi }) => chatApi.listConversations())
      .then((convs) => {
        if (cancelled) return;
        setUnreadChat(convs.reduce((s, c) => s + c.unreadCount, 0));

        initChatSocket();

        unsubs = convs.map((c) =>
          subscribeConversation(c.id, (ev: ChatRealtimeEvent) => {
            if (ev.eventName !== "chat.message.sent") return;
            if (ev.senderId === actorId) return;

            const activeConversationId = Number(sessionStorage.getItem("chat:activeConversationId") || "0");
            if (activeConversationId && activeConversationId === ev.conversationId) return;

            const openPopupIds = safeParseOpenIds(sessionStorage.getItem("chat:openConversationIds"));
            if (openPopupIds.includes(ev.conversationId)) return;

            setUnreadChat((prev) => prev + 1);
          })
        );
      })
      .catch(console.error);

    return () => {
      cancelled = true;
      unsubs.forEach((u) => u());
    };
  }, []);

  return unreadChat;
}
