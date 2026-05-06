// frontend/src/components/chat/ChatWindow.tsx
"use client";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { chatApi } from "@/lib/api/chatApi";
import { initChatSocket, subscribeConversation, subscribePresence } from "@/lib/socket/chatSocket";
import {
  ChatRealtimeEvent,
  ConversationReadStatusResponse,
  ConversationResponse,
  MessageResponse,
  UserPresenceResponse,
} from "@/types/chat";
import { getUserById } from "@/lib/api/userApi";
import ChatInput from "./ChatInput";
import MessageBubble from "./MessageBubble";
import { formatLastActiveSubtitle } from "@/lib/chat/presenceLabels";
import { computeDeliveryFooterForMessage } from "@/lib/chat/deliveryFooterStatus";
type ChatTheme = "ROSE" | "OCEAN" | "FOREST" | "SUNSET";
type ChatBackground = "PLAIN" | "MESH" | "DOTS";

interface Props {
  conversation: ConversationResponse;
  currentUserId: number;
  onBack?: () => void;
  onNewMessage?: (conversationId: number) => void;
  onOwnMessage?: (conversationId: number) => void;
  onConversationAppearanceUpdated?: (conversation: ConversationResponse) => void;
}

const PAGE_SIZE = 30;
const GRADIENTS = [
  "from-rose-400 to-pink-500",
  "from-violet-400 to-purple-500",
  "from-blue-400 to-sky-500",
  "from-emerald-400 to-green-500",
  "from-orange-400 to-amber-500",
  "from-teal-400 to-cyan-500",
  "from-fuchsia-400 to-pink-500",
  "from-indigo-400 to-blue-500",
];
const THEME_OPTIONS: Array<{ value: ChatTheme; label: string; previewClass: string }> = [
  { value: "ROSE", label: "Rose", previewClass: "from-rose-400 to-pink-500" },
  { value: "OCEAN", label: "Ocean", previewClass: "from-sky-400 to-blue-500" },
  { value: "FOREST", label: "Forest", previewClass: "from-emerald-400 to-teal-500" },
  { value: "SUNSET", label: "Sunset", previewClass: "from-orange-400 to-amber-500" },
];
const BACKGROUND_OPTIONS: Array<{ value: ChatBackground; label: string; previewClass: string }> = [
  { value: "PLAIN", label: "Plain", previewClass: "bg-white" },
  {
    value: "MESH",
    label: "Mesh",
    previewClass:
      "bg-[radial-gradient(circle_at_20%_20%,rgba(244,63,94,0.14),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(99,102,241,0.14),transparent_35%),#ffffff]",
  },
  {
    value: "DOTS",
    label: "Dots",
    previewClass: "bg-[radial-gradient(rgba(148,163,184,0.22)_1px,transparent_1px)] [background-size:10px_10px] bg-white",
  },
];

function avatarGradient(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return GRADIENTS[Math.abs(h) % GRADIENTS.length];
}

export default function ChatWindow({
  conversation,
  currentUserId,
  onBack,
  onNewMessage,
  onOwnMessage,
  onConversationAppearanceUpdated,
}: Props) {
  const [messages, setMessages] = useState<MessageResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasOlder, setHasOlder] = useState(true);
  const [sending, setSending] = useState(false);
  const [socketReady, setSocketReady] = useState(false);
  const [userNames, setUserNames] = useState<Record<number, string>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [showJumpBottom, setShowJumpBottom] = useState(false);
  const [activeMatchIdx, setActiveMatchIdx] = useState(0);
  const [replyTo, setReplyTo] = useState<MessageResponse | null>(null);
  const [filterMode, setFilterMode] = useState<"ALL" | "MEDIA" | "FILES" | "LINKS" | "STARRED">("ALL");
  const [starPendingIds, setStarPendingIds] = useState<number[]>([]);
  const [focusedReplyTargetId, setFocusedReplyTargetId] = useState<number | null>(null);
  const [peerTyping, setPeerTyping] = useState(false);
  const [viewMode, setViewMode] = useState<"CHAT" | "CUSTOMIZE">("CHAT");
  const [appearanceSaving, setAppearanceSaving] = useState(false);
  const [readStatuses, setReadStatuses] = useState<ConversationReadStatusResponse[]>([]);
  const [presenceMap, setPresenceMap] = useState<Record<number, UserPresenceResponse>>({});
  const [draftNickname, setDraftNickname] = useState(conversation.nickname || "");
  const [draftTheme, setDraftTheme] = useState<ChatTheme>(conversation.bubbleTheme || "ROSE");
  const [draftBackground, setDraftBackground] = useState<ChatBackground>(conversation.backgroundTheme || "PLAIN");
  const typingTimerRef = useRef<number | null>(null);
  const lastTypingSentRef = useRef<number>(0);
  const typingStateRef = useRef<boolean>(false);

  const listRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const messageNodeRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const loadingOlderRef = useRef(false);
  const lastCursorRef = useRef<number | null>(null);
  const prependingRef = useRef(false);
  const restoringScrollRef = useRef(false);
  const shouldStickBottomRef = useRef(true);
  /** Tránh onScroll coi cuộn tự động là user kéo lên → tắt stick bottom */
  const programmaticScrollRef = useRef(false);

  const otherId = conversation.memberIds.find((id) => id !== currentUserId);
  const bubbleTheme: ChatTheme = conversation.bubbleTheme || "ROSE";
  const background: ChatBackground = conversation.backgroundTheme || "PLAIN";
  const displayName =
    conversation.nickname?.trim() ||
    (conversation.type === "GROUP"
      ? conversation.name || "Nhóm chat"
      : (otherId ? userNames[otherId] : undefined) || `Người dùng #${otherId ?? ""}`);
  const otherPresence = otherId ? presenceMap[otherId] : undefined;

  const gradient = avatarGradient(displayName);
  const ownBubbleClassName =
    bubbleTheme === "OCEAN"
      ? "bg-sky-600 text-white rounded-br-sm"
      : bubbleTheme === "FOREST"
        ? "bg-emerald-600 text-white rounded-br-sm"
        : bubbleTheme === "SUNSET"
          ? "bg-orange-500 text-white rounded-br-sm"
          : "bg-rose-500 text-white rounded-br-sm";
  const peerBubbleClassName = bubbleTheme === "OCEAN"
    ? "bg-sky-50 text-slate-800 rounded-bl-sm border border-sky-100"
    : bubbleTheme === "FOREST"
      ? "bg-emerald-50 text-slate-800 rounded-bl-sm border border-emerald-100"
      : bubbleTheme === "SUNSET"
        ? "bg-amber-50 text-slate-800 rounded-bl-sm border border-amber-100"
        : "bg-slate-100 text-slate-800 rounded-bl-sm";
  const bodyBgClassName =
    background === "MESH"
      ? "bg-[radial-gradient(circle_at_20%_20%,rgba(244,63,94,0.10),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(99,102,241,0.10),transparent_35%),#ffffff]"
      : background === "DOTS"
        ? "bg-[radial-gradient(rgba(148,163,184,0.18)_1px,transparent_1px)] [background-size:12px_12px] bg-white"
        : "bg-white";

  const isNearBottom = useCallback(() => {
    const el = listRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }, []);

  const scrollChatToBottom = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    programmaticScrollRef.current = true;
    restoringScrollRef.current = true;
    el.scrollTop = el.scrollHeight;
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
      restoringScrollRef.current = false;
      programmaticScrollRef.current = false;
    });
  }, []);

  const addOrUpdateMessage = useCallback((msg: MessageResponse) => {
    setMessages((prev) => {
      const idx = prev.findIndex((m) => m.id === msg.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], ...msg };
        return next;
      }
      return [...prev, msg];
    });
  }, []);

  const loadLatest = useCallback(async () => {
    setLoading(true);
    loadingOlderRef.current = false;
    lastCursorRef.current = null;
    prependingRef.current = false;
    restoringScrollRef.current = false;
    shouldStickBottomRef.current = true;

    try {
      const msgs = await chatApi.getMessages(conversation.id, undefined, PAGE_SIZE);
      const chronological = [...msgs].reverse();
      setMessages(chronological);
      setHasOlder(msgs.length >= PAGE_SIZE);
      const statuses = await chatApi.getConversationReadStatuses(conversation.id).catch(() => []);
      setReadStatuses(statuses);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [conversation.id]);

  useEffect(() => {
    const ids = conversation.memberIds.filter((id) => id !== currentUserId);
    if (!ids.length) return;
    chatApi
      .getPresence(ids)
      .then((items) => {
        setPresenceMap((prev) => {
          const next = { ...prev };
          items.forEach((item) => {
            next[item.userId] = item;
          });
          return next;
        });
      })
      .catch(() => undefined);
  }, [conversation.memberIds, currentUserId]);

  const loadOlder = useCallback(async () => {
    if (loadingOlderRef.current || restoringScrollRef.current || !hasOlder || messages.length === 0) return;

    const oldestId = messages[0].id;
    if (lastCursorRef.current === oldestId) return;

    lastCursorRef.current = oldestId;
    loadingOlderRef.current = true;
    setLoadingOlder(true);

    const el = listRef.current;
    const prevHeight = el?.scrollHeight ?? 0;
    const prevTop = el?.scrollTop ?? 0;

    try {
      const older = await chatApi.getMessages(conversation.id, oldestId, PAGE_SIZE);
      if (older.length === 0) {
        setHasOlder(false);
        return;
      }

      const olderChrono = [...older].reverse();

      setMessages((prev) => {
        const existed = new Set(prev.map((m) => m.id));
        const uniqueOlder = olderChrono.filter((m) => !existed.has(m.id));

        if (uniqueOlder.length > 0) {
          prependingRef.current = true;
          return [...uniqueOlder, ...prev];
        }
        return prev;
      });

      setHasOlder(older.length >= PAGE_SIZE);

      requestAnimationFrame(() => {
        const node = listRef.current;
        if (!node) return;

        restoringScrollRef.current = true;
        node.scrollTop = node.scrollHeight - prevHeight + prevTop;
        prependingRef.current = false;

        requestAnimationFrame(() => {
          restoringScrollRef.current = false;
        });
      });
    } catch (e) {
      console.error(e);
    } finally {
      loadingOlderRef.current = false;
      setLoadingOlder(false);
    }
  }, [conversation.id, hasOlder, messages]);

  const onScroll = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    if (restoringScrollRef.current) return;
    if (programmaticScrollRef.current) return;

    shouldStickBottomRef.current = isNearBottom();
    setShowJumpBottom(!shouldStickBottomRef.current);

    if (loading || loadingOlderRef.current || !hasOlder) return;
    if (el.scrollTop < 80) void loadOlder();
  }, [hasOlder, isNearBottom, loadOlder, loading]);

  useEffect(() => {
    void loadLatest();
  }, [loadLatest]);

  useEffect(() => {
    initChatSocket(undefined, () => setSocketReady(true));
  }, []);

  useEffect(() => {
    const ids = new Set<number>(conversation.memberIds);
    messages.forEach((m) => ids.add(m.senderId));

    const missing = [...ids].filter((id) => !userNames[id]);
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
  }, [conversation.memberIds, messages, userNames]);

  useEffect(() => {
    const handleEvent = (event: ChatRealtimeEvent) => {
      if (event.eventName === "chat.message.sent") {
        if (event.messageId == null || event.senderId == null || !event.content || !event.createdAt) return;
        shouldStickBottomRef.current = isNearBottom();

        const msg: MessageResponse = {
          id: event.messageId,
          conversationId: event.conversationId,
          senderId: event.senderId,
          content: event.content,
          deleted: false,
          createdAt: event.createdAt,
          editedAt: null,
          deletedAt: null,
          replyToMessageId: event.replyToMessageId ?? null,
          starred: Boolean(event.starred),
        };

        addOrUpdateMessage(msg);

        if (event.senderId !== currentUserId) {
          onNewMessage?.(event.conversationId);
          void chatApi.markAsRead(conversation.id).catch(console.error);
        } else {
          onOwnMessage?.(event.conversationId);
        }
      } else if (event.eventName === "chat.message.edited") {
        const editedContent = event.content;
        if (event.messageId == null || editedContent == null) return;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === event.messageId ? { ...m, content: editedContent, editedAt: event.editedAt } : m
          )
        );
      } else if (event.eventName === "chat.message.deleted") {
        setMessages((prev) =>
          prev.map((m) => (m.id === event.messageId ? { ...m, deleted: true } : m))
        );
      } else if (event.eventName === "chat.message.starred") {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === event.messageId ? { ...m, starred: Boolean(event.starred) } : m
          )
        );
      } else if (event.eventName === "chat.typing") {
        if (event.senderId === currentUserId) return;
        const nextTyping = Boolean(event.typing);
        setPeerTyping(nextTyping);
        if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
        if (nextTyping) {
          typingTimerRef.current = window.setTimeout(() => {
            setPeerTyping(false);
          }, 3200);
        }
      } else if (event.eventName === "chat.conversation.appearance.updated") {
        if (event.targetUserId && event.targetUserId !== currentUserId) return;
        onConversationAppearanceUpdated?.({
          ...conversation,
          nickname: event.nickname ?? conversation.nickname,
          bubbleTheme: event.bubbleTheme ?? conversation.bubbleTheme,
          backgroundTheme: event.backgroundTheme ?? conversation.backgroundTheme,
        });
        if (event.notice) {
          addOrUpdateMessage({
            id: Number(`${Date.now()}${Math.floor(Math.random() * 1000)}`),
            conversationId: conversation.id,
            senderId: event.senderId ?? currentUserId,
            content: `🔔 ${event.notice}`,
            deleted: false,
            createdAt: event.occurredAt || new Date().toISOString(),
            editedAt: null,
            deletedAt: null,
            replyToMessageId: null,
            starred: false,
          });
        }
      } else if (event.eventName === "chat.conversation.read") {
        const readerId = event.readerId;
        if (!readerId) return;
        setReadStatuses((prev) => {
          const idx = prev.findIndex((x) => x.userId === readerId);
          const nextItem: ConversationReadStatusResponse = {
            userId: readerId,
            lastReadMessageId: event.lastReadMessageId ?? null,
            readAt: event.occurredAt,
          };
          if (idx < 0) return [...prev, nextItem];
          const next = [...prev];
          next[idx] = nextItem;
          return next;
        });
      }
    };

    const unsub = subscribeConversation(conversation.id, handleEvent);
    return () => {
      unsub();
    };
  }, [addOrUpdateMessage, conversation, conversation.id, currentUserId, isNearBottom, onConversationAppearanceUpdated, onNewMessage, onOwnMessage]);

  useEffect(() => {
    const unsub = subscribePresence((event) => {
      if (event.eventName !== "chat.user.presence" || !event.targetUserId) return;
      setPresenceMap((prev) => ({
        ...prev,
        [event.targetUserId!]: {
          userId: event.targetUserId!,
          online: Boolean(event.online),
          lastSeenAt: event.lastSeenAt || new Date().toISOString(),
        },
      }));
    });
    return () => unsub();
  }, []);

  const getMessageStatus = useCallback(
    (message: MessageResponse) =>
      computeDeliveryFooterForMessage(message, {
        currentUserId,
        conversation,
        readStatuses,
        presenceMap,
        userNames,
      }),
    [conversation, currentUserId, presenceMap, readStatuses, userNames]
  );
  const latestOwnMessage = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const msg = messages[i];
      if (msg.senderId === currentUserId && !msg.deleted) return msg;
    }
    return null;
  }, [currentUserId, messages]);
  const footerStatus = useMemo(
    () => (latestOwnMessage ? getMessageStatus(latestOwnMessage) : null),
    [getMessageStatus, latestOwnMessage]
  );

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
      if (typingStateRef.current) {
        void chatApi.sendTyping(conversation.id, false).catch(() => undefined);
      }
    };
  }, [conversation.id]);

  useLayoutEffect(() => {
    if (viewMode !== "CHAT") return;
    if (loading) return;
    if (prependingRef.current) return;
    if (!shouldStickBottomRef.current) return;
    if (messages.length === 0) return;

    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scrollChatToBottom();
      });
    });
    return () => cancelAnimationFrame(id);
  }, [conversation.id, loading, messages.length, scrollChatToBottom, viewMode]);

  useEffect(() => {
    if (viewMode !== "CHAT") return;
    if (loading) return;
    if (!shouldStickBottomRef.current) return;
    if (messages.length === 0) return;
    const t = window.setTimeout(() => scrollChatToBottom(), 80);
    return () => window.clearTimeout(t);
  }, [footerStatus, loading, messages.length, scrollChatToBottom, viewMode]);

  const handleSend = async (content: string) => {
    setSending(true);
    try {
      const sent = await chatApi.sendMessage(
        conversation.id,
        content,
        `${Date.now()}`,
        replyTo?.id ?? null
      );
      addOrUpdateMessage(sent);
      setReplyTo(null);
      shouldStickBottomRef.current = true;
      requestAnimationFrame(() => scrollChatToBottom());
      onOwnMessage?.(conversation.id);
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  const handleEdit = async (messageId: number, content: string) => {
    try {
      const updated = await chatApi.editMessage(messageId, content);
      addOrUpdateMessage(updated);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (messageId: number) => {
    try {
      await chatApi.deleteMessage(messageId);
      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, deleted: true } : m)));
    } catch (e) {
      console.error(e);
    }
  };

  const grouped = useMemo(() => {
    const g: { dateLabel: string; msgs: MessageResponse[] }[] = [];
    const withFilter = messages.filter((msg) => {
      const content = msg.content.toLowerCase();
      if (filterMode === "STARRED") return Boolean(msg.starred);
      if (filterMode === "MEDIA") return /(https?:\/\/\S+\.(png|jpg|jpeg|gif|webp|svg|mp4|mov))/i.test(content);
      if (filterMode === "FILES") return /(https?:\/\/\S+\.(pdf|doc|docx|xls|xlsx|ppt|pptx|zip|rar|txt))/i.test(content);
      if (filterMode === "LINKS") return /https?:\/\/\S+/i.test(content);
      return true;
    });
    withFilter.forEach((msg) => {
      const date = new Date(msg.createdAt);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);

      let label = date.toLocaleDateString("vi-VN");
      if (date.toDateString() === today.toDateString()) label = "Hôm nay";
      else if (date.toDateString() === yesterday.toDateString()) label = "Hôm qua";

      const last = g[g.length - 1];
      if (last?.dateLabel === label) last.msgs.push(msg);
      else g.push({ dateLabel: label, msgs: [msg] });
    });
    return g;
  }, [filterMode, messages]);

  const matchedMessageIds = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return [];
    return grouped.flatMap((group) => group.msgs).filter((m) => m.content.toLowerCase().includes(q)).map((m) => m.id);
  }, [grouped, searchTerm]);

  useEffect(() => {
    setActiveMatchIdx(0);
  }, [searchTerm, conversation.id]);

  useEffect(() => {
    if (matchedMessageIds.length === 0) return;
    if (activeMatchIdx >= matchedMessageIds.length) {
      setActiveMatchIdx(0);
      return;
    }
    const id = matchedMessageIds[activeMatchIdx];
    messageNodeRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeMatchIdx, matchedMessageIds]);

  const jumpToMessage = useCallback((messageId: number) => {
    messageNodeRefs.current[messageId]?.scrollIntoView({ behavior: "smooth", block: "center" });
    setFocusedReplyTargetId(messageId);
    window.setTimeout(() => setFocusedReplyTargetId((prev) => (prev === messageId ? null : prev)), 1400);
  }, []);

  const handleTypingChange = useCallback(
    (typing: boolean) => {
      const now = Date.now();
      if (typing === typingStateRef.current && now - lastTypingSentRef.current < 1200) return;
      typingStateRef.current = typing;
      lastTypingSentRef.current = now;
      void chatApi.sendTyping(conversation.id, typing).catch(() => undefined);
    },
    [conversation.id]
  );

  const saveAppearance = async (patch: { nickname?: string | null; bubbleTheme?: ChatTheme; backgroundTheme?: ChatBackground }) => {
    setAppearanceSaving(true);
    try {
      const updated = await chatApi.updateConversationAppearance(conversation.id, {
        nickname: patch.nickname ?? conversation.nickname ?? null,
        bubbleTheme: patch.bubbleTheme ?? bubbleTheme,
        backgroundTheme: patch.backgroundTheme ?? background,
      });
      onConversationAppearanceUpdated?.(updated);
      setViewMode("CHAT");
    } catch (e) {
      console.error(e);
    } finally {
      setAppearanceSaving(false);
    }
  };

  const saveAllAppearance = async () => {
    await saveAppearance({
      nickname: draftNickname.trim() || null,
      bubbleTheme: draftTheme,
      backgroundTheme: draftBackground,
    });
  };

  useEffect(() => {
    setDraftNickname(conversation.nickname || "");
    setDraftTheme(conversation.bubbleTheme || "ROSE");
    setDraftBackground(conversation.backgroundTheme || "PLAIN");
  }, [conversation.backgroundTheme, conversation.bubbleTheme, conversation.id, conversation.nickname]);

  return (
    <div className="relative flex flex-col h-full bg-white">
      <div className="flex items-center gap-3 px-5 py-3.5 border-b shadow-sm z-10 bg-white border-slate-100">
        {onBack && (
          <button
            onClick={onBack}
            className="md:hidden -ml-1 p-2 rounded-full transition hover:bg-slate-100 text-slate-500"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
        )}

        <div
          className={`w-10 h-10 rounded-full bg-gradient-to-br ${gradient}
            flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow`}
        >
          {displayName.charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm leading-tight truncate text-slate-900">{displayName}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span
              className={`w-2 h-2 rounded-full ${
                conversation.type === "PRIVATE" && otherPresence
                  ? otherPresence.online
                    ? "bg-green-400"
                    : "bg-slate-400"
                  : socketReady
                    ? "bg-green-400"
                    : "bg-amber-400"
              }`}
            />
            <span
              className={`text-[11px] font-medium ${
                conversation.type === "PRIVATE" && otherPresence
                  ? otherPresence.online
                    ? "text-green-500"
                    : "text-slate-500"
                  : socketReady
                    ? "text-green-500"
                    : "text-amber-500"
              }`}
            >
              {conversation.type === "PRIVATE" && otherPresence
                ? otherPresence.online
                  ? "Đang hoạt động"
                  : formatLastActiveSubtitle(otherPresence.lastSeenAt)
                : socketReady
                  ? "Đang hoạt động"
                  : "Đang kết nối..."}
            </span>
          </div>
        </div>
        <div className="w-64 hidden sm:flex items-center gap-1">
          {viewMode === "CHAT" && (
            <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm trong cuộc trò chuyện..."
            className="flex-1 px-3 py-1.5 text-xs rounded-full border outline-none bg-slate-100 border-slate-200 focus:ring-2 focus:ring-rose-100"
            />
          )}
          {viewMode === "CHAT" && searchTerm.trim() && (
            <>
              <span className="text-[10px] text-slate-500 px-1">
                {matchedMessageIds.length ? `${activeMatchIdx + 1}/${matchedMessageIds.length}` : "0/0"}
              </span>
              <button
                type="button"
                onClick={() =>
                  setActiveMatchIdx((idx) =>
                    matchedMessageIds.length ? (idx - 1 + matchedMessageIds.length) % matchedMessageIds.length : 0
                  )
                }
                className="cursor-pointer text-slate-500 hover:text-slate-700 text-xs px-1"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() =>
                  setActiveMatchIdx((idx) =>
                    matchedMessageIds.length ? (idx + 1) % matchedMessageIds.length : 0
                  )
                }
                className="cursor-pointer text-slate-500 hover:text-slate-700 text-xs px-1"
              >
                ↓
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => setViewMode((prev) => (prev === "CHAT" ? "CUSTOMIZE" : "CHAT"))}
            className="cursor-pointer ml-1 p-1.5 rounded-full transition text-slate-500 hover:text-slate-700 hover:bg-slate-100"
            title={viewMode === "CHAT" ? "Tùy chỉnh cuộc trò chuyện" : "Quay lại chat"}
          >
            {viewMode === "CHAT" ? "⚙" : "←"}
          </button>
        </div>
      </div>
      {viewMode === "CHAT" && (
      <div className="px-4 py-2 border-b flex items-center gap-1 overflow-x-auto border-slate-100 bg-white">
        {(["ALL", "MEDIA", "FILES", "LINKS", "STARRED"] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setFilterMode(mode)}
            className={`cursor-pointer text-[11px] px-2.5 py-1 rounded-full border transition ${
              filterMode === mode ? "bg-rose-50 border-rose-200 text-rose-600" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
            }`}
          >
            {mode === "ALL" ? "Tất cả" : mode === "MEDIA" ? "Ảnh" : mode === "FILES" ? "Files" : mode === "LINKS" ? "Links" : "Đã ghim"}
          </button>
        ))}
      </div>
      )}

      {viewMode === "CUSTOMIZE" ? (
        <div className="flex-1 overflow-y-auto bg-gradient-to-b from-slate-50 to-white p-5 sm:p-7">
          <div className="max-w-3xl mx-auto rounded-[28px] border border-slate-200 bg-white p-5 sm:p-7 shadow-[0_12px_40px_-20px_rgba(15,23,42,0.35)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Tùy chỉnh cuộc trò chuyện</h2>
                <p className="text-sm text-slate-500 mt-1">Cập nhật biệt danh, màu bong bóng và hình nền theo phong cách hiện đại.</p>
              </div>
              <div className={`h-10 min-w-10 px-3 rounded-full text-xs font-semibold flex items-center justify-center ${appearanceSaving ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"}`}>
                {appearanceSaving ? "Đang lưu" : "Sẵn sàng"}
              </div>
            </div>

            <div className="mt-6 grid lg:grid-cols-[1.1fr_0.9fr] gap-5">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Biệt danh người này (chỉ bạn thấy)</label>
                  <input
                    value={draftNickname}
                    onChange={(e) => setDraftNickname(e.target.value)}
                    placeholder="Đặt tên riêng cho người này"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-rose-100 focus:border-rose-300"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Màu bong bóng</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {THEME_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setDraftTheme(option.value)}
                        className={`rounded-2xl border p-2 transition ${draftTheme === option.value ? "border-rose-300 ring-2 ring-rose-100 bg-rose-50/50" : "border-slate-200 hover:border-slate-300"}`}
                      >
                        <div className={`h-8 rounded-xl bg-gradient-to-r ${option.previewClass}`} />
                        <p className="text-[11px] font-semibold text-slate-700 mt-1.5">{option.label}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Nền đoạn chat</label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {BACKGROUND_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setDraftBackground(option.value)}
                        className={`rounded-2xl border p-2 transition ${draftBackground === option.value ? "border-rose-300 ring-2 ring-rose-100 bg-rose-50/50" : "border-slate-200 hover:border-slate-300"}`}
                      >
                        <div className={`h-8 rounded-xl border border-slate-200 ${option.previewClass}`} />
                        <p className="text-[11px] font-semibold text-slate-700 mt-1.5">{option.label}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <p className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wide">Xem trước</p>
                <div className={`rounded-2xl border border-slate-200 p-3 space-y-2 min-h-44 ${draftBackground === "MESH" ? "bg-[radial-gradient(circle_at_20%_20%,rgba(244,63,94,0.10),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(99,102,241,0.10),transparent_35%),#ffffff]" : draftBackground === "DOTS" ? "bg-[radial-gradient(rgba(148,163,184,0.18)_1px,transparent_1px)] [background-size:12px_12px] bg-white" : "bg-white"}`}>
                  <div className="flex justify-start">
                    <div className="rounded-2xl rounded-bl-sm px-3 py-2 text-xs border border-slate-200 bg-slate-100 text-slate-700">Xin chao, day la preview.</div>
                  </div>
                  <div className="flex justify-end">
                    <div className={`rounded-2xl rounded-br-sm px-3 py-2 text-xs text-white ${draftTheme === "OCEAN" ? "bg-sky-600" : draftTheme === "FOREST" ? "bg-emerald-600" : draftTheme === "SUNSET" ? "bg-orange-500" : "bg-rose-500"}`}>Giao dien moi trong dep hon.</div>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-3">
                  Tên hiển thị: <span className="font-semibold text-slate-700">{draftNickname.trim() || displayName}</span>
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button className="cursor-pointer px-4 py-2.5 text-sm rounded-xl border border-slate-200 hover:bg-slate-50 transition" onClick={() => setViewMode("CHAT")}>Hủy</button>
              <button
                className="cursor-pointer px-4 py-2.5 text-sm rounded-xl bg-rose-500 text-white disabled:opacity-60 hover:bg-rose-600 transition"
                disabled={appearanceSaving}
                onClick={() => void saveAllAppearance()}
              >
                {appearanceSaving ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </div>
        </div>
      ) : (
      <div ref={listRef} onScroll={onScroll} className={`flex-1 overflow-y-auto px-2 py-4 ${bodyBgClassName}`}>
        {loadingOlder && (
          <div className="flex justify-center pb-2">
            <div className="w-5 h-5 border-2 border-rose-300 border-t-rose-500 rounded-full animate-spin" />
          </div>
        )}

        {loading ? (
          <div className="space-y-3 px-3 py-2 animate-pulse">
            {[...Array(6)].map((_, idx) => (
              <div key={idx} className={`flex ${idx % 2 ? "justify-end" : "justify-start"}`}>
                <div
                  className={`rounded-2xl ${idx % 2 ? "w-52 bg-rose-100" : "w-40 bg-slate-100"} h-10`}
                />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <div
              className={`w-16 h-16 rounded-full bg-gradient-to-br ${gradient}
                flex items-center justify-center text-white text-2xl font-bold shadow`}
            >
              {displayName.charAt(0).toUpperCase()}
            </div>
            <p className="font-semibold text-slate-700">{displayName}</p>
            <p className="text-sm text-slate-400">Hãy bắt đầu cuộc trò chuyện!</p>
          </div>
        ) : (
          grouped.map(({ dateLabel, msgs }) => (
            <div key={dateLabel}>
              <div className="flex items-center gap-3 my-4 px-4">
                <div className="flex-1 h-px bg-slate-100" />
                <span className="text-[11px] text-slate-400 font-medium">{dateLabel}</span>
                <div className="flex-1 h-px bg-slate-100" />
              </div>

              <div className="space-y-1">
                {msgs.map((msg, i) => {
                  const isOwn = msg.senderId === currentUserId;
                  const prev = msgs[i - 1];
                  const showAvatar = !isOwn && (!prev || prev.senderId !== msg.senderId);

                  return (
                    <div
                      key={msg.id}
                      ref={(node) => {
                        messageNodeRefs.current[msg.id] = node;
                      }}
                      className={focusedReplyTargetId === msg.id ? "rounded-2xl ring-2 ring-sky-300 bg-sky-50/40 transition" : ""}
                    >
                      <MessageBubble
                        message={msg}
                        isOwn={isOwn}
                        showAvatar={showAvatar}
                        senderGradient={gradient}
                        senderName={userNames[msg.senderId]}
                        highlightTerm={searchTerm}
                        isActiveSearchHit={matchedMessageIds[activeMatchIdx] === msg.id}
                        isStarred={Boolean(msg.starred)}
                        replyPreview={
                          msg.replyToMessageId
                            ? messages.find((m) => m.id === msg.replyToMessageId)?.content.slice(0, 80) || "Tin nhắn gốc"
                            : undefined
                        }
                        replyToMessageId={msg.replyToMessageId ?? null}
                        onJumpToReplyTarget={jumpToMessage}
                        onReply={(message) => setReplyTo(message)}
                        onToggleStar={async (messageId) => {
                          if (starPendingIds.includes(messageId)) return;
                          setStarPendingIds((prev) => [...prev, messageId]);
                          try {
                            const updated = await chatApi.toggleStar(messageId);
                            addOrUpdateMessage(updated);
                          } catch (e) {
                            console.error(e);
                          } finally {
                            setStarPendingIds((prev) => prev.filter((id) => id !== messageId));
                          }
                        }}
                        onEdit={isOwn ? handleEdit : undefined}
                        onDelete={isOwn ? handleDelete : undefined}
                        ownBubbleClassName={ownBubbleClassName}
                        peerBubbleClassName={peerBubbleClassName}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}

        {peerTyping && (
          <div className="flex items-end justify-start px-3 py-1">
            <div className="w-8 mr-2 flex-shrink-0" />
            <div className="rounded-2xl rounded-bl-sm px-3 py-2 shadow-sm border bg-slate-100 border-slate-200">
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:120ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:240ms]" />
              </div>
            </div>
          </div>
        )}

        {footerStatus && (footerStatus.statusLabel || footerStatus.readByLabel) && (
          <div className="px-6 pt-2 text-[11px] text-slate-400 text-right">
            {footerStatus.statusLabel}
            {footerStatus.readByLabel ? ` · ${footerStatus.readByLabel}` : ""}
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      )}

      {showJumpBottom && (
        <button
          type="button"
          onClick={() => {
            shouldStickBottomRef.current = true;
            scrollChatToBottom();
            setShowJumpBottom(false);
          }}
          className="cursor-pointer absolute bottom-24 right-6 bg-rose-500 text-white text-xs px-3 py-2 rounded-full shadow-lg hover:bg-rose-600 transition"
        >
          Tin mới nhất
        </button>
      )}

      <ChatInput
        onSend={handleSend}
        sending={sending}
        replyPreview={replyTo?.content.slice(0, 100)}
        onCancelReply={() => setReplyTo(null)}
        onTypingChange={handleTypingChange}
      />
    </div>
  );
}