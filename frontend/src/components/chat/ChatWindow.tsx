// frontend/src/components/chat/ChatWindow.tsx
"use client";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { chatApi } from "@/lib/api/chatApi";
import { initChatSocket, subscribeConversation, subscribePresence } from "@/lib/socket/chatSocket";
import {
  ChatBackgroundPresetResponse,
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
import { decodeMessageContent, encodeMessageContent } from "@/lib/chat/messageAttachment";
import { useCall } from "@/components/call/CallProvider";
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
  const { callInfo, startCall } = useCall();
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
  const [draftBackgroundImageUrl, setDraftBackgroundImageUrl] = useState(conversation.backgroundImageUrl || "");
  const [backgroundPresets, setBackgroundPresets] = useState<ChatBackgroundPresetResponse[]>([]);
  const [uploadingBackground, setUploadingBackground] = useState(false);
  const [blockStatus, setBlockStatus] = useState<{ blockedByMe: boolean; blockedMe: boolean }>({
    blockedByMe: false,
    blockedMe: false,
  });
  const [updatingBlock, setUpdatingBlock] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [forwardPayload, setForwardPayload] = useState<{ tick: number; text: string }>({ tick: 0, text: "" });
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
  const isSelfConversation =
    conversation.type === "PRIVATE" &&
    (conversation.memberIds.length === 1 || otherId == null);
  const bubbleTheme: ChatTheme = conversation.bubbleTheme || "ROSE";
  const background: ChatBackground = conversation.backgroundTheme || "PLAIN";
  const displayName =
    conversation.nickname?.trim() ||
    (conversation.type === "GROUP"
      ? conversation.name || "Nhóm chat"
      : (otherId ? userNames[otherId] : undefined) || "Bản thân");
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
  const bodyBackgroundStyle = conversation.backgroundImageUrl
    ? {
        backgroundImage: `linear-gradient(rgba(255,255,255,0.85), rgba(255,255,255,0.85)), url(${conversation.backgroundImageUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : undefined;

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

  useEffect(() => {
    chatApi.listBackgroundPresets().then(setBackgroundPresets).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (conversation.type !== "PRIVATE" || !otherId) return;
    chatApi
      .getBlockStatus(otherId)
      .then((status) => setBlockStatus(status))
      .catch(() => undefined);
  }, [conversation.type, otherId]);

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
          nickname: event.nickname !== undefined ? event.nickname : conversation.nickname,
          bubbleTheme: event.bubbleTheme ?? conversation.bubbleTheme,
          backgroundTheme: event.backgroundTheme ?? conversation.backgroundTheme,
          backgroundImageUrl:
            event.backgroundImageUrl !== undefined ? event.backgroundImageUrl : conversation.backgroundImageUrl,
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

  const handleForwardFromMessage = useCallback(
    (message: MessageResponse) => {
      const parsed = decodeMessageContent(message.content);
      const who = userNames[message.senderId] || `Người gửi #${message.senderId}`;
      const body =
        `──────── Chuyển tiếp từ ${who} ────────\n` +
        (parsed.text.trim() || (parsed.attachments.length ? "[Tin có đính kèm — xem trong lịch sử]" : ""));
      setForwardPayload((p) => ({ tick: p.tick + 1, text: body }));
    },
    [userNames]
  );

  const handleSend = async ({ text, files }: { text: string; files: File[] }) => {
    setSending(true);
    setSendError(null);
    try {
      const idempotencyKey = `${Date.now()}`;
      const sent =
        files.length > 0
          ? await chatApi.sendMessageWithFiles(conversation.id, {
              content: text,
              files,
              idempotencyKey,
              replyToMessageId: replyTo?.id ?? null,
            })
          : await chatApi.sendMessage(
              conversation.id,
              encodeMessageContent(text, []),
              idempotencyKey,
              replyTo?.id ?? null
            );
      addOrUpdateMessage(sent);
      setReplyTo(null);
      shouldStickBottomRef.current = true;
      requestAnimationFrame(() => scrollChatToBottom());
      onOwnMessage?.(conversation.id);
    } catch (e) {
      console.error(e);
      setSendError(e instanceof Error ? e.message : "Không thể gửi tin nhắn. Kiểm tra kết nối và thử lại.");
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
      if (msg.deleted && (filterMode === "MEDIA" || filterMode === "FILES" || filterMode === "STARRED")) {
        return false;
      }
      const parsed = decodeMessageContent(msg.content);
      const content = parsed.text.toLowerCase();
      const hasMediaAttachment = parsed.attachments.some((item) => item.kind === "image" || item.kind === "video");
      const hasFileAttachment = parsed.attachments.some((item) => item.kind === "file" || item.kind === "audio");
      if (filterMode === "STARRED") return Boolean(msg.starred);
      if (filterMode === "MEDIA") return hasMediaAttachment || /(https?:\/\/\S+\.(png|jpg|jpeg|gif|webp|svg|mp4|mov))/i.test(content);
      if (filterMode === "FILES") return hasFileAttachment || /(https?:\/\/\S+\.(pdf|doc|docx|xls|xlsx|ppt|pptx|zip|rar|txt))/i.test(content);
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
    return grouped
      .flatMap((group) => group.msgs)
      .filter((m) => decodeMessageContent(m.content).text.toLowerCase().includes(q))
      .map((m) => m.id);
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

  const handleRecallCall = useCallback(
    (mediaType: "voice" | "video") => {
      if (conversation.type !== "PRIVATE" || otherId == null || isSelfConversation) return;
      if (callInfo.status !== "IDLE") return;
      startCall(otherId, mediaType, displayName, conversation.id);
    },
    [callInfo.status, conversation.id, conversation.type, displayName, isSelfConversation, otherId, startCall]
  );

  const saveAppearance = async (patch: { nickname?: string | null; bubbleTheme?: ChatTheme; backgroundTheme?: ChatBackground; backgroundImageUrl?: string | null }) => {
    setAppearanceSaving(true);
    try {
      const updated = await chatApi.updateConversationAppearance(conversation.id, {
        nickname: patch.nickname ?? conversation.nickname ?? null,
        bubbleTheme: patch.bubbleTheme ?? bubbleTheme,
        backgroundTheme: patch.backgroundTheme ?? background,
        backgroundImageUrl: patch.backgroundImageUrl ?? conversation.backgroundImageUrl ?? null,
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
      backgroundImageUrl: draftBackgroundImageUrl.trim() || null,
    });
  };

  const toggleBlock = async () => {
    if (!otherId || updatingBlock) return;
    setUpdatingBlock(true);
    try {
      if (blockStatus.blockedByMe) {
        await chatApi.unblockUser(otherId);
        setBlockStatus((prev) => ({ ...prev, blockedByMe: false }));
      } else {
        await chatApi.blockUser(otherId);
        setBlockStatus((prev) => ({ ...prev, blockedByMe: true }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingBlock(false);
    }
  };

  const handleUploadBackground = async (file: File | null) => {
    if (!file) return;
    setUploadingBackground(true);
    try {
      const uploaded = await chatApi.uploadAttachment(file);
      setDraftBackgroundImageUrl(uploaded.url);
    } catch (e) {
      console.error(e);
    } finally {
      setUploadingBackground(false);
    }
  };

  useEffect(() => {
    setDraftNickname(conversation.nickname || "");
    setDraftTheme(conversation.bubbleTheme || "ROSE");
    setDraftBackground(conversation.backgroundTheme || "PLAIN");
    setDraftBackgroundImageUrl(conversation.backgroundImageUrl || "");
  }, [conversation.backgroundImageUrl, conversation.backgroundTheme, conversation.bubbleTheme, conversation.id, conversation.nickname]);

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
          {!isSelfConversation && (
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
          )}
        </div>
        <div className="flex items-center gap-1">
          {viewMode === "CHAT" && (
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm..."
              className="hidden md:block w-52 lg:w-64 px-3 py-1.5 text-xs rounded-full border outline-none bg-slate-100 border-slate-200 focus:ring-2 focus:ring-rose-100"
            />
          )}
          {viewMode === "CHAT" && searchTerm.trim() && (
            <>
              <span className="hidden md:inline text-[10px] text-slate-500 px-1">
                {matchedMessageIds.length ? `${activeMatchIdx + 1}/${matchedMessageIds.length}` : "0/0"}
              </span>
              <button
                type="button"
                onClick={() =>
                  setActiveMatchIdx((idx) =>
                    matchedMessageIds.length ? (idx - 1 + matchedMessageIds.length) % matchedMessageIds.length : 0
                  )
                }
                className="hidden md:inline cursor-pointer text-slate-500 hover:text-slate-700 text-xs px-1"
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
                className="hidden md:inline cursor-pointer text-slate-500 hover:text-slate-700 text-xs px-1"
              >
                ↓
              </button>
            </>
          )}
          {/* Call buttons — only for private conversations */}
          {conversation.type === "PRIVATE" && otherId != null && !isSelfConversation && (
            <>
              <button
                type="button"
                title="Gọi thoại"
                onClick={() => {
                  if (callInfo.status !== "IDLE") return;
                  startCall(otherId, "voice", displayName, conversation.id);
                }}
                disabled={callInfo.status !== "IDLE"}
                className="cursor-pointer p-2 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed transition active:scale-90"
              >
                <svg className="w-4.5 h-4.5" style={{ width: "1.125rem", height: "1.125rem" }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 7V5z" />
                </svg>
              </button>
              <button
                type="button"
                title="Gọi video"
                onClick={() => {
                  if (callInfo.status !== "IDLE") return;
                  startCall(otherId, "video", displayName, conversation.id);
                }}
                disabled={callInfo.status !== "IDLE"}
                className="cursor-pointer p-2 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition active:scale-90"
              >
                <svg className="w-4.5 h-4.5" style={{ width: "1.125rem", height: "1.125rem" }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M4 8h8a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4a2 2 0 012-2z" />
                </svg>
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
      {conversation.type === "PRIVATE" && (blockStatus.blockedByMe || blockStatus.blockedMe) && (
        <div className="border-b border-slate-100 bg-amber-50 px-4 py-2 text-xs text-amber-700">
          {blockStatus.blockedByMe
            ? "Bạn đã chặn người dùng này. Bỏ chặn để tiếp tục nhắn tin."
            : "Bạn không thể gửi tin nhắn vì đã bị người dùng này chặn."}
        </div>
      )}
      {viewMode === "CHAT" && (
      <div className="px-4 py-2 border-b flex items-center gap-1 overflow-x-auto border-slate-100 bg-white">
        {(["ALL", "MEDIA", "FILES", "LINKS", "STARRED"] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => {
              setFilterMode(mode);
              shouldStickBottomRef.current = true;
              setShowJumpBottom(false);
              requestAnimationFrame(() => scrollChatToBottom());
            }}
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
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Background ảnh (tùy chọn)</label>
                  <input
                    value={draftBackgroundImageUrl}
                    onChange={(e) => setDraftBackgroundImageUrl(e.target.value)}
                    placeholder="https://... hoặc chọn preset bên dưới"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-rose-100 focus:border-rose-300"
                  />
                  <div className="flex flex-wrap gap-2">
                    <label className="cursor-pointer text-[11px] px-2.5 py-1 rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50">
                      {uploadingBackground ? "Đang tải..." : "Tải ảnh nền"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploadingBackground}
                        onChange={(e) => void handleUploadBackground(e.target.files?.[0] || null)}
                      />
                    </label>
                    {draftBackgroundImageUrl.trim() ? (
                      <button
                        type="button"
                        onClick={() => setDraftBackgroundImageUrl("")}
                        className="cursor-pointer text-[11px] px-2.5 py-1 rounded-full border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                      >
                        Gỡ ảnh nền
                      </button>
                    ) : null}
                  </div>
                  {backgroundPresets.length > 0 && (
                    <div className="mt-3">
                      <p className="text-[11px] font-semibold text-slate-600 mb-2">Preset ảnh nền</p>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {backgroundPresets.slice(0, 12).map((preset) => (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => setDraftBackgroundImageUrl(preset.imageUrl)}
                            title={preset.name}
                            className={`relative aspect-square rounded-xl overflow-hidden border-2 transition ${
                              draftBackgroundImageUrl.trim() === preset.imageUrl.trim()
                                ? "border-rose-400 ring-2 ring-rose-100"
                                : "border-slate-200 hover:border-rose-200"
                            }`}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={preset.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                            <span className="absolute bottom-0 inset-x-0 bg-black/45 text-[10px] text-white px-1 py-0.5 truncate">
                              {preset.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <p className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wide">Xem trước</p>
                <div
                  className={`rounded-2xl border border-slate-200 p-3 space-y-2 min-h-44 ${draftBackground === "MESH" ? "bg-[radial-gradient(circle_at_20%_20%,rgba(244,63,94,0.10),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(99,102,241,0.10),transparent_35%),#ffffff]" : draftBackground === "DOTS" ? "bg-[radial-gradient(rgba(148,163,184,0.18)_1px,transparent_1px)] [background-size:12px_12px] bg-white" : "bg-white"}`}
                  style={
                    draftBackgroundImageUrl.trim()
                      ? {
                          backgroundImage: `linear-gradient(rgba(255,255,255,0.84), rgba(255,255,255,0.84)), url(${draftBackgroundImageUrl.trim()})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }
                      : undefined
                  }
                >
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

            {conversation.type === "PRIVATE" && otherId && (
              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/90 p-4">
                <p className="text-sm font-semibold text-slate-800">Quyền riêng tư</p>
                <p className="text-xs text-slate-500 mt-1">
                  Chặn người này để không gửi hoặc nhận tin nhắn cho đến khi bạn bỏ chặn.
                </p>
                <button
                  type="button"
                  onClick={() => void toggleBlock()}
                  disabled={updatingBlock}
                  className={`cursor-pointer mt-3 rounded-xl px-4 py-2 text-xs font-semibold border ${
                    blockStatus.blockedByMe
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-rose-200 bg-rose-50 text-rose-600"
                  } disabled:opacity-60`}
                >
                  {updatingBlock ? "Đang xử lý..." : blockStatus.blockedByMe ? "Bỏ chặn" : "Chặn người này"}
                </button>
              </div>
            )}

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
      <div ref={listRef} onScroll={onScroll} className={`flex-1 overflow-y-auto px-2 py-4 ${bodyBgClassName}`} style={bodyBackgroundStyle}>
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
                            ? decodeMessageContent(messages.find((m) => m.id === msg.replyToMessageId)?.content || "").text.slice(0, 80) || "Tin nhắn gốc"
                            : undefined
                        }
                        replyToMessageId={msg.replyToMessageId ?? null}
                        onJumpToReplyTarget={jumpToMessage}
                        onReply={(message) => setReplyTo(message)}
                        onForward={handleForwardFromMessage}
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
                        onRecallCall={handleRecallCall}
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
        disabled={blockStatus.blockedByMe || blockStatus.blockedMe}
        sending={sending}
        sendError={sendError}
        forwardPayload={forwardPayload}
        replyPreview={decodeMessageContent(replyTo?.content || "").text.slice(0, 100)}
        onCancelReply={() => setReplyTo(null)}
        onTypingChange={handleTypingChange}
      />
    </div>
  );
}