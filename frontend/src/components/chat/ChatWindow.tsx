// frontend/src/components/chat/ChatWindow.tsx
"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { chatApi } from "@/lib/api/chatApi";
import { initChatSocket, subscribeConversation } from "@/lib/socket/chatSocket";
import { ChatRealtimeEvent, ConversationResponse, MessageResponse } from "@/types/chat";
import { getUserById } from "@/lib/api/userApi";
import ChatInput from "./ChatInput";
import MessageBubble from "./MessageBubble";

interface Props {
  conversation: ConversationResponse;
  currentUserId: number;
  onBack?: () => void;
  onNewMessage?: (conversationId: number) => void;
  onOwnMessage?: (conversationId: number) => void;
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

  const listRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const messageNodeRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const loadingOlderRef = useRef(false);
  const lastCursorRef = useRef<number | null>(null);
  const prependingRef = useRef(false);
  const restoringScrollRef = useRef(false);
  const shouldStickBottomRef = useRef(true);

  const otherId = conversation.memberIds.find((id) => id !== currentUserId);
  const displayName =
    conversation.type === "GROUP"
      ? conversation.name || "Nhóm chat"
      : (otherId ? userNames[otherId] : undefined) || `Người dùng #${otherId ?? ""}`;

  const gradient = avatarGradient(displayName);

  const isNearBottom = useCallback(() => {
    const el = listRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 80;
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
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [conversation.id]);

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
        setMessages((prev) =>
          prev.map((m) =>
            m.id === event.messageId ? { ...m, content: event.content, editedAt: event.editedAt } : m
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
      }
    };

    const unsub = subscribeConversation(conversation.id, handleEvent);
    return () => {
      unsub();
    };
  }, [addOrUpdateMessage, conversation.id, currentUserId, isNearBottom, onNewMessage, onOwnMessage]);

  useEffect(() => {
    if (prependingRef.current) return;
    if (!shouldStickBottomRef.current) return;
    bottomRef.current?.scrollIntoView({ behavior: "auto" });
  }, [messages.length]);

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

  return (
    <div className="relative flex flex-col h-full bg-white">
      <div className="flex items-center gap-3 px-5 py-3.5 bg-white border-b border-slate-100 shadow-sm z-10">
        {onBack && (
          <button
            onClick={onBack}
            className="md:hidden -ml-1 p-2 rounded-full hover:bg-slate-100 text-slate-500 transition"
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
          <p className="font-bold text-slate-900 text-sm leading-tight truncate">{displayName}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`w-2 h-2 rounded-full ${socketReady ? "bg-green-400" : "bg-amber-400"}`} />
            <span className={`text-[11px] font-medium ${socketReady ? "text-green-500" : "text-amber-500"}`}>
              {socketReady ? "Đang hoạt động" : "Đang kết nối..."}
            </span>
          </div>
        </div>
        <div className="w-64 hidden sm:flex items-center gap-1">
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm trong cuộc trò chuyện..."
            className="flex-1 px-3 py-1.5 text-xs rounded-full bg-slate-100 border border-slate-200 outline-none focus:ring-2 focus:ring-rose-100"
          />
          {searchTerm.trim() && (
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
        </div>
      </div>
      <div className="px-4 py-2 border-b border-slate-100 bg-white flex items-center gap-1 overflow-x-auto">
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

      <div ref={listRef} onScroll={onScroll} className="flex-1 overflow-y-auto bg-white px-2 py-4">
        {loadingOlder && (
          <div className="flex justify-center pb-2">
            <div className="w-5 h-5 border-2 border-rose-300 border-t-rose-500 rounded-full animate-spin" />
          </div>
        )}

        {loading ? (
          <div className="space-y-3 px-3 py-2 animate-pulse">
            {[...Array(6)].map((_, idx) => (
              <div key={idx} className={`flex ${idx % 2 ? "justify-end" : "justify-start"}`}>
                <div className={`h-10 rounded-2xl ${idx % 2 ? "w-52 bg-rose-100" : "w-40 bg-slate-100"}`} />
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
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}

        <div ref={bottomRef} />
      </div>

      {showJumpBottom && (
        <button
          type="button"
          onClick={() => {
            shouldStickBottomRef.current = true;
            bottomRef.current?.scrollIntoView({ behavior: "smooth" });
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
      />
    </div>
  );
}