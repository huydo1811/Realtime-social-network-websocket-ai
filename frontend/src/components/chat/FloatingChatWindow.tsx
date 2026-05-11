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
import { formatLastActiveSubtitle } from "@/lib/chat/presenceLabels";
import { computeDeliveryFooterForMessage } from "@/lib/chat/deliveryFooterStatus";
import { getAuthTokens } from "@/lib/api/authToken";
import { dispatchRead } from "@/lib/event/chatEvents";
import { getUserById } from "@/lib/api/userApi";
import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";
import { decodeMessageContent, encodeMessageContent } from "@/lib/chat/messageAttachment";
import { useCall } from "@/components/call/CallProvider";
type ChatTheme = "ROSE" | "OCEAN" | "FOREST" | "SUNSET";
type ChatBackground = "PLAIN" | "MESH" | "DOTS";

interface Props {
  conversation: ConversationResponse;
  offsetIndex?: number;
  onClose: () => void;
}

const PAGE_SIZE = 20;
const GRADIENTS = [
  "from-rose-400 to-pink-500",
  "from-violet-400 to-purple-500",
  "from-blue-400 to-sky-500",
  "from-emerald-400 to-green-500",
  "from-orange-400 to-amber-500",
  "from-teal-400 to-cyan-500",
];

function parseUserId(token: string): number | null {
  try {
    const p = JSON.parse(atob(token.split(".")[1]));
    return Number(p.sub ?? p.userId ?? p.id) || null;
  } catch {
    return null;
  }
}

function grad(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return GRADIENTS[Math.abs(h) % GRADIENTS.length];
}

export default function FloatingChatWindow({
  conversation,
  offsetIndex = 0,
  onClose,
}: Props) {
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState<MessageResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasOlder, setHasOlder] = useState(true);
  const [sending, setSending] = useState(false);
  const [userNames, setUserNames] = useState<Record<number, string>>({});
  const [showJumpBottom, setShowJumpBottom] = useState(false);
  const [replyTo, setReplyTo] = useState<MessageResponse | null>(null);
  const [starPendingIds, setStarPendingIds] = useState<number[]>([]);
  const [focusedReplyTargetId, setFocusedReplyTargetId] = useState<number | null>(null);
  const [filterMode, setFilterMode] = useState<"ALL" | "MEDIA" | "FILES" | "LINKS" | "STARRED">("ALL");
  const [peerTyping, setPeerTyping] = useState(false);
  const [viewMode, setViewMode] = useState<"CHAT" | "CUSTOMIZE">("CHAT");
  const [appearanceSaving, setAppearanceSaving] = useState(false);
  const [nickname, setNickname] = useState(conversation.nickname || "");
  const [bubbleTheme, setBubbleTheme] = useState<ChatTheme>(conversation.bubbleTheme || "ROSE");
  const [backgroundTheme, setBackgroundTheme] = useState<ChatBackground>(conversation.backgroundTheme || "PLAIN");
  const [backgroundImageUrl, setBackgroundImageUrl] = useState(conversation.backgroundImageUrl || "");
  const [uploadingBackground, setUploadingBackground] = useState(false);
  const [readStatuses, setReadStatuses] = useState<ConversationReadStatusResponse[]>([]);
  const [presenceMap, setPresenceMap] = useState<Record<number, UserPresenceResponse>>({});
  const [blockStatus, setBlockStatus] = useState<{ blockedByMe: boolean; blockedMe: boolean }>({
    blockedByMe: false,
    blockedMe: false,
  });
  const [updatingBlock, setUpdatingBlock] = useState(false);
  const [backgroundPresets, setBackgroundPresets] = useState<ChatBackgroundPresetResponse[]>([]);
  const [sendError, setSendError] = useState<string | null>(null);
  const [forwardPayload, setForwardPayload] = useState<{ tick: number; text: string }>({ tick: 0, text: "" });

  const listRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const messageNodeRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const typingTimerRef = useRef<number | null>(null);
  const lastTypingSentRef = useRef<number>(0);
  const typingStateRef = useRef<boolean>(false);

  const loadingOlderRef = useRef(false);
  const lastCursorRef = useRef<number | null>(null);
  const prependingRef = useRef(false);
  const restoringScrollRef = useRef(false);
  const shouldStickBottomRef = useRef(true);
  const programmaticScrollRef = useRef(false);

  const { callInfo, startCall } = useCall();
  const currentUserId = parseUserId(getAuthTokens()?.accessToken ?? "") ?? -1;
  const otherId = conversation.memberIds.find((id) => id !== currentUserId);
  const isSelfConversation =
    conversation.type === "PRIVATE" &&
    (conversation.memberIds.length === 1 || otherId == null);

  const displayName =
    nickname.trim() ||
    (conversation.type === "GROUP"
      ? conversation.name || "Nhóm"
      : (otherId ? userNames[otherId] : undefined) || "Bản thân");

  const otherPresence = otherId != null ? presenceMap[otherId] : undefined;

  const gradient = grad(displayName);
  const ownBubbleClassName =
    bubbleTheme === "OCEAN"
      ? "bg-sky-600 text-white rounded-br-sm"
      : bubbleTheme === "FOREST"
        ? "bg-emerald-600 text-white rounded-br-sm"
        : bubbleTheme === "SUNSET"
          ? "bg-orange-500 text-white rounded-br-sm"
          : "bg-rose-500 text-white rounded-br-sm";
  const peerBubbleClassName =
    bubbleTheme === "OCEAN"
      ? "bg-sky-50 text-slate-800 rounded-bl-sm border border-sky-100"
      : bubbleTheme === "FOREST"
        ? "bg-emerald-50 text-slate-800 rounded-bl-sm border border-emerald-100"
        : bubbleTheme === "SUNSET"
          ? "bg-amber-50 text-slate-800 rounded-bl-sm border border-amber-100"
          : "bg-slate-100 text-slate-800 rounded-bl-sm";
  const bodyBgClassName =
    backgroundTheme === "MESH"
      ? "bg-[radial-gradient(circle_at_20%_20%,rgba(244,63,94,0.10),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(99,102,241,0.10),transparent_35%),#ffffff]"
      : backgroundTheme === "DOTS"
        ? "bg-[radial-gradient(rgba(148,163,184,0.18)_1px,transparent_1px)] [background-size:12px_12px] bg-white"
        : "bg-white";
  const bodyBackgroundStyle = backgroundImageUrl.trim()
    ? {
        backgroundImage: `linear-gradient(rgba(255,255,255,0.85), rgba(255,255,255,0.85)), url(${backgroundImageUrl.trim()})`,
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

  const addOrUpdate = useCallback((msg: MessageResponse) => {
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
      if (conversation.unreadCount > 0) {
        dispatchRead(conversation.id, conversation.unreadCount);
        await chatApi.markAsRead(conversation.id);
      }

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
  }, [conversation.id, conversation.unreadCount]);

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
    if (el.scrollTop < 80) {
      void loadOlder();
    }
  }, [hasOlder, isNearBottom, loadOlder, loading]);

  useEffect(() => {
    void loadLatest();
  }, [loadLatest]);

  useEffect(() => {
    const ids = conversation.memberIds.filter((id) => id !== currentUserId);
    if (!ids.length || currentUserId < 0) return;
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
    if (conversation.type !== "PRIVATE" || otherId == null) return;
    chatApi.getBlockStatus(otherId).then(setBlockStatus).catch(() => undefined);
  }, [conversation.type, otherId]);

  useEffect(() => {
    chatApi.listBackgroundPresets().then(setBackgroundPresets).catch(() => undefined);
  }, []);

  useEffect(() => {
    setNickname(conversation.nickname || "");
    setBubbleTheme((conversation.bubbleTheme as ChatTheme) || "ROSE");
    setBackgroundTheme((conversation.backgroundTheme as ChatBackground) || "PLAIN");
    setBackgroundImageUrl(conversation.backgroundImageUrl || "");
  }, [
    conversation.id,
    conversation.nickname,
    conversation.bubbleTheme,
    conversation.backgroundTheme,
    conversation.backgroundImageUrl,
  ]);

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

  const jumpToMessage = useCallback((messageId: number) => {
    messageNodeRefs.current[messageId]?.scrollIntoView({ behavior: "smooth", block: "center" });
    setFocusedReplyTargetId(messageId);
    window.setTimeout(() => setFocusedReplyTargetId((prev) => (prev === messageId ? null : prev)), 1400);
  }, []);

  useEffect(() => {
    const unsubPresence = subscribePresence((event) => {
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
    return () => unsubPresence();
  }, []);

  useEffect(() => {
    initChatSocket();
    const unsub = subscribeConversation(conversation.id, (event: ChatRealtimeEvent) => {
      if (event.eventName === "chat.message.sent") {
        if (event.messageId == null || event.senderId == null || !event.content || !event.createdAt) return;
        shouldStickBottomRef.current = isNearBottom();

        addOrUpdate({
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
        });

        if (event.senderId !== currentUserId) {
          void chatApi.markAsRead(conversation.id).catch(console.error);
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
          prev.map((m) => (m.id === event.messageId ? { ...m, starred: Boolean(event.starred) } : m))
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
        if (event.nickname !== undefined) setNickname(event.nickname ?? "");
        setBubbleTheme((event.bubbleTheme as ChatTheme) || "ROSE");
        setBackgroundTheme((event.backgroundTheme as ChatBackground) || "PLAIN");
        if (event.backgroundImageUrl !== undefined) setBackgroundImageUrl(event.backgroundImageUrl ?? "");
        if (event.notice) {
          addOrUpdate({
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
    });

    return () => {
      unsub();
    };
  }, [addOrUpdate, conversation.id, currentUserId, isNearBottom]);

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
      if (typingStateRef.current) {
        void chatApi.sendTyping(conversation.id, false).catch(() => undefined);
      }
    };
  }, [conversation.id]);

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
    if ((!text.trim() && files.length === 0) || sending) return;
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
      addOrUpdate(sent);
      setReplyTo(null);
      typingStateRef.current = false;
      void chatApi.sendTyping(conversation.id, false).catch(() => undefined);
      shouldStickBottomRef.current = true;
      requestAnimationFrame(() => scrollChatToBottom());
    } catch (e) {
      console.error(e);
      setSendError(e instanceof Error ? e.message : "Không thể gửi tin nhắn.");
    } finally {
      setSending(false);
    }
  };

  const handleEdit = async (messageId: number, content: string) => {
    try {
      const updated = await chatApi.editMessage(messageId, content);
      addOrUpdate(updated);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (messageId: number) => {
    try {
      await chatApi.deleteMessage(messageId);
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, deleted: true } : m))
      );
    } catch (e) {
      console.error(e);
    }
  };

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

  const saveAppearance = async () => {
    setAppearanceSaving(true);
    try {
      await chatApi.updateConversationAppearance(conversation.id, {
        nickname: nickname.trim() || null,
        bubbleTheme,
        backgroundTheme,
        backgroundImageUrl: backgroundImageUrl.trim() || null,
      });
      setViewMode("CHAT");
    } catch (e) {
      console.error(e);
    } finally {
      setAppearanceSaving(false);
    }
  };

  const toggleBlock = async () => {
    if (otherId == null || updatingBlock) return;
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
      setBackgroundImageUrl(uploaded.url);
    } catch (e) {
      console.error(e);
    } finally {
      setUploadingBackground(false);
    }
  };

  const rightOffset = 288 + 8 + offsetIndex * (320 + 8);

  const grouped = useMemo(() => {
    const g: { dateLabel: string; msgs: MessageResponse[] }[] = [];
    const withFilter = messages.filter((msg) => {
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

  useLayoutEffect(() => {
    if (viewMode !== "CHAT") return;
    if (minimized) return;
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
  }, [conversation.id, loading, messages.length, minimized, scrollChatToBottom, viewMode]);

  useEffect(() => {
    if (viewMode !== "CHAT") return;
    if (minimized) return;
    if (loading) return;
    if (!shouldStickBottomRef.current) return;
    if (messages.length === 0) return;
    const t = window.setTimeout(() => scrollChatToBottom(), 80);
    return () => window.clearTimeout(t);
  }, [footerStatus, loading, messages.length, minimized, scrollChatToBottom, viewMode]);

  return (
    <div
      className="fixed bottom-0 z-50 w-80 flex flex-col rounded-t-2xl shadow-2xl border border-slate-200 overflow-hidden bg-white"
      style={{ right: `${rightOffset}px` }}
    >
      <div
        className="flex items-center gap-2.5 px-3 py-2.5 bg-white border-b border-slate-100 cursor-pointer"
        onClick={() => setMinimized((v) => !v)}
      >
        <div
          className={`w-8 h-8 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}
        >
          {displayName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-slate-900 truncate">{displayName}</p>
          {!isSelfConversation && conversation.type === "PRIVATE" && otherId != null && (
            <div className="flex items-center gap-1 mt-0.5">
              <span
                className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                  otherPresence?.online ? "bg-green-400" : "bg-slate-400"
                }`}
              />
              <span
                className={`text-[10px] font-medium truncate ${
                  otherPresence?.online ? "text-green-600" : "text-slate-500"
                }`}
              >
                {otherPresence?.online
                  ? "Đang hoạt động"
                  : formatLastActiveSubtitle(otherPresence?.lastSeenAt)}
              </span>
            </div>
          )}
          {conversation.type === "GROUP" && (
            <p className="text-[10px] text-slate-500 mt-0.5 truncate">
              {conversation.memberIds.length} thành viên
            </p>
          )}
        </div>

        {/* Call buttons — only for private conversations */}
        {conversation.type === "PRIVATE" && otherId != null && !isSelfConversation && (
          <>
            <button
              type="button"
              title="Gọi thoại"
              onClick={(e) => {
                e.stopPropagation();
                if (callInfo.status !== "IDLE") return;
                startCall(otherId, "voice", displayName, conversation.id);
              }}
              disabled={callInfo.status !== "IDLE"}
              className="cursor-pointer p-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed transition active:scale-90"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 7V5z" />
              </svg>
            </button>
            <button
              type="button"
              title="Gọi video"
              onClick={(e) => {
                e.stopPropagation();
                if (callInfo.status !== "IDLE") return;
                startCall(otherId, "video", displayName, conversation.id);
              }}
              disabled={callInfo.status !== "IDLE"}
              className="cursor-pointer p-1.5 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition active:scale-90"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M4 8h8a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4a2 2 0 012-2z" />
              </svg>
            </button>
          </>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setViewMode((prev) => (prev === "CHAT" ? "CUSTOMIZE" : "CHAT"));
          }}
          className="cursor-pointer p-1 rounded-full hover:bg-slate-100 text-slate-400 transition"
          type="button"
          title={viewMode === "CHAT" ? "Tùy chỉnh cuộc trò chuyện" : "Quay lại chat"}
        >
          {viewMode === "CHAT" ? "⚙" : "←"}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setMinimized((v) => !v);
          }}
          className="cursor-pointer p-1 rounded-full hover:bg-slate-100 text-slate-400 transition"
          type="button"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d={minimized ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
          </svg>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="cursor-pointer p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-red-400 transition"
          type="button"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {!minimized && (
        <>
          {viewMode === "CHAT" && (
          <div className="px-2 py-1.5 border-b border-slate-100 bg-white flex items-center gap-1 overflow-x-auto">
            {(["ALL", "MEDIA", "FILES", "LINKS", "STARRED"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setFilterMode(mode)}
                className={`cursor-pointer text-[10px] px-2 py-0.5 rounded-full border transition whitespace-nowrap ${
                  filterMode === mode ? "bg-rose-50 border-rose-200 text-rose-600" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                }`}
              >
                {mode === "ALL" ? "Tất cả" : mode === "MEDIA" ? "Ảnh" : mode === "FILES" ? "Files" : mode === "LINKS" ? "Links" : "Đã ghim"}
              </button>
            ))}
          </div>
          )}
          {conversation.type === "PRIVATE" && (blockStatus.blockedByMe || blockStatus.blockedMe) && (
            <div className="border-b border-slate-100 bg-amber-50 px-2.5 py-1.5 text-[11px] text-amber-700">
              {blockStatus.blockedByMe
                ? "Bạn đã chặn người dùng này."
                : "Bạn đã bị người dùng này chặn."}
            </div>
          )}
          {viewMode === "CUSTOMIZE" ? (
            <div className="h-80 overflow-y-auto bg-slate-50 p-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-3 space-y-3">
                <p className="text-sm font-semibold text-slate-800">Tùy chỉnh đoạn chat</p>
                <input
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Biệt danh..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-rose-100"
                />
                <div className="grid grid-cols-4 gap-1.5">
                  {(["ROSE", "OCEAN", "FOREST", "SUNSET"] as const).map((theme) => (
                    <button
                      key={theme}
                      type="button"
                      onClick={() => setBubbleTheme(theme)}
                      className={`text-[10px] rounded-lg border px-1.5 py-1.5 ${bubbleTheme === theme ? "border-rose-300 bg-rose-50 text-rose-600" : "border-slate-200 text-slate-600"}`}
                    >
                      {theme}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {(["PLAIN", "MESH", "DOTS"] as const).map((bg) => (
                    <button
                      key={bg}
                      type="button"
                      onClick={() => setBackgroundTheme(bg)}
                      className={`text-[10px] rounded-lg border px-1.5 py-1.5 ${backgroundTheme === bg ? "border-rose-300 bg-rose-50 text-rose-600" : "border-slate-200 text-slate-600"}`}
                    >
                      {bg}
                    </button>
                  ))}
                </div>
                <input
                  value={backgroundImageUrl}
                  onChange={(e) => setBackgroundImageUrl(e.target.value)}
                  placeholder="URL background ảnh..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-rose-100"
                />
                <label className="cursor-pointer inline-flex items-center justify-center w-full text-[10px] rounded-lg border border-slate-200 px-1.5 py-1.5 text-slate-600 hover:bg-slate-50">
                  {uploadingBackground ? "Đang tải ảnh..." : "Upload background"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadingBackground}
                    onChange={(e) => void handleUploadBackground(e.target.files?.[0] || null)}
                  />
                </label>
                {backgroundImageUrl.trim() ? (
                  <button
                    type="button"
                    onClick={() => setBackgroundImageUrl("")}
                    className="cursor-pointer w-full text-[10px] rounded-lg border border-slate-300 px-1.5 py-1.5 text-slate-700 hover:bg-slate-50"
                  >
                    Gỡ ảnh nền
                  </button>
                ) : null}
                {backgroundPresets.length > 0 && (
                  <div className="grid grid-cols-3 gap-1.5">
                    {backgroundPresets.slice(0, 9).map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setBackgroundImageUrl(preset.imageUrl)}
                        title={preset.name}
                        className="relative aspect-square rounded-lg overflow-hidden border border-slate-200"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={preset.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
                {conversation.type === "PRIVATE" && otherId != null && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 space-y-1.5">
                    <p className="text-[10px] font-semibold text-slate-700">Quyền riêng tư</p>
                    <button
                      type="button"
                      onClick={() => void toggleBlock()}
                      disabled={updatingBlock}
                      className={`cursor-pointer w-full text-[10px] rounded-lg px-2 py-1.5 font-semibold border ${
                        blockStatus.blockedByMe
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-rose-200 bg-rose-50 text-rose-600"
                      } disabled:opacity-60`}
                    >
                      {updatingBlock ? "..." : blockStatus.blockedByMe ? "Bỏ chặn" : "Chặn người này"}
                    </button>
                  </div>
                )}
                <div className={`rounded-xl border border-slate-200 p-2 ${bodyBgClassName}`} style={bodyBackgroundStyle}>
                  <div className="text-[10px] mb-1 text-slate-500">Preview</div>
                  <div className="flex justify-start mb-1">
                    <div className="text-[10px] px-2 py-1 rounded-xl bg-slate-100 border border-slate-200">Xin chao</div>
                  </div>
                  <div className="flex justify-end">
                    <div className={`text-[10px] px-2 py-1 rounded-xl text-white ${ownBubbleClassName}`}>Giao dien moi</div>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={appearanceSaving}
                  onClick={() => void saveAppearance()}
                  className="cursor-pointer w-full text-xs rounded-xl bg-rose-500 text-white py-2 disabled:opacity-60"
                >
                  {appearanceSaving ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </div>
          ) : (
          <div ref={listRef} onScroll={onScroll} className={`h-80 overflow-y-auto px-2 py-3 space-y-1.5 ${bodyBgClassName}`} style={bodyBackgroundStyle}>
            {loadingOlder && (
              <div className="flex justify-center py-1">
                <div className="w-4 h-4 border-2 border-rose-300 border-t-rose-500 rounded-full animate-spin" />
              </div>
            )}

            {loading ? (
              <div className="flex justify-center items-center h-full">
                <div className="w-5 h-5 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : grouped.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-8">Chưa có tin nhắn</p>
            ) : (
              grouped.map(({ dateLabel, msgs }) => (
                <div key={dateLabel}>
                  <div className="flex items-center gap-2 my-2 px-3">
                    <div className="flex-1 h-px bg-slate-100" />
                    <span className="text-[10px] text-slate-400 font-medium">{dateLabel}</span>
                    <div className="flex-1 h-px bg-slate-100" />
                  </div>

                  <div className="space-y-1.5">
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
                                addOrUpdate(updated);
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
              <div className="flex items-end justify-start px-2 py-1">
                <div className="w-8 mr-2 flex-shrink-0" />
                <div className="bg-slate-100 border border-slate-200 rounded-2xl rounded-bl-sm px-3 py-2 shadow-sm">
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:120ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:240ms]" />
                  </div>
                </div>
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
              className="cursor-pointer absolute bottom-24 right-3 bg-rose-500 text-white text-[11px] px-2.5 py-1.5 rounded-full shadow hover:bg-rose-600 transition"
            >
              Tin mới nhất
            </button>
          )}

          <div className="bg-white border-t border-slate-100">
            <div className="flex-1">
              {footerStatus && (footerStatus.statusLabel || footerStatus.readByLabel) && (
                <div className="mb-1 pr-3 text-[10px] text-slate-400 text-right">
                  {footerStatus.statusLabel}
                  {footerStatus.readByLabel ? ` · ${footerStatus.readByLabel}` : ""}
                </div>
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
          </div>
        </>
      )}
    </div>
  );
}