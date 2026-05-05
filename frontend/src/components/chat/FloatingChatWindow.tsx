"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { chatApi } from "@/lib/api/chatApi";
import { initChatSocket, subscribeConversation } from "@/lib/socket/chatSocket";
import { ChatRealtimeEvent, ConversationResponse, MessageResponse } from "@/types/chat";
import { getAuthTokens } from "@/lib/api/authToken";
import { dispatchRead } from "@/lib/event/chatEvents";
import { getUserById } from "@/lib/api/userApi";
import MessageBubble from "./MessageBubble";

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
  const [inputVal, setInputVal] = useState("");
  const [sending, setSending] = useState(false);
  const [userNames, setUserNames] = useState<Record<number, string>>({});
  const [showJumpBottom, setShowJumpBottom] = useState(false);
  const [replyTo, setReplyTo] = useState<MessageResponse | null>(null);
  const [starPendingIds, setStarPendingIds] = useState<number[]>([]);
  const [focusedReplyTargetId, setFocusedReplyTargetId] = useState<number | null>(null);
  const [filterMode, setFilterMode] = useState<"ALL" | "MEDIA" | "FILES" | "LINKS" | "STARRED">("ALL");

  const listRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const messageNodeRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const loadingOlderRef = useRef(false);
  const lastCursorRef = useRef<number | null>(null);
  const prependingRef = useRef(false);
  const restoringScrollRef = useRef(false);
  const shouldStickBottomRef = useRef(true);

  const currentUserId = parseUserId(getAuthTokens()?.accessToken ?? "") ?? -1;
  const otherId = conversation.memberIds.find((id) => id !== currentUserId);

  const displayName =
    conversation.type === "GROUP"
      ? conversation.name || "Nhóm"
      : (otherId ? userNames[otherId] : undefined) || `Người dùng #${otherId ?? ""}`;

  const gradient = grad(displayName);

  const isNearBottom = useCallback(() => {
    const el = listRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 80;
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
    initChatSocket();
    const unsub = subscribeConversation(conversation.id, (event: ChatRealtimeEvent) => {
      if (event.eventName === "chat.message.sent") {
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
          prev.map((m) => (m.id === event.messageId ? { ...m, starred: Boolean(event.starred) } : m))
        );
      }
    });

    return () => {
      unsub();
    };
  }, [addOrUpdate, conversation.id, currentUserId, isNearBottom]);

  useEffect(() => {
    if (prependingRef.current) return;
    if (minimized) return;
    if (!shouldStickBottomRef.current) return;
    bottomRef.current?.scrollIntoView({ behavior: "auto" });
  }, [messages.length, minimized]);

  const handleSend = async () => {
    if (!inputVal.trim() || sending) return;
    const content = inputVal.trim();
    setInputVal("");
    setSending(true);

    try {
      const sent = await chatApi.sendMessage(conversation.id, content, `${Date.now()}`, replyTo?.id ?? null);
      addOrUpdate(sent);
      setReplyTo(null);
      shouldStickBottomRef.current = true;
    } catch (e) {
      console.error(e);
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

  const rightOffset = 288 + 8 + offsetIndex * (320 + 8);

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
        <p className="flex-1 font-semibold text-sm text-slate-900 truncate">{displayName}</p>

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
          <div ref={listRef} onScroll={onScroll} className="h-80 overflow-y-auto bg-white px-2 py-3 space-y-1.5">
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
                                addOrUpdate(updated);
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
              className="cursor-pointer absolute bottom-16 right-3 bg-rose-500 text-white text-[11px] px-2.5 py-1.5 rounded-full shadow hover:bg-rose-600 transition"
            >
              Tin mới nhất
            </button>
          )}

          <div className="px-3 py-2 bg-white border-t border-slate-100 flex items-center gap-2">
            <div className="flex-1">
              {replyTo && (
                <div className="mb-1.5 bg-rose-50 border border-rose-100 rounded-lg px-2 py-1 flex items-start gap-2">
                  <div className="w-1 self-stretch rounded-full bg-rose-300" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-rose-500 font-semibold">Đang trả lời</p>
                    <p className="text-[11px] text-slate-600 truncate">{replyTo.content}</p>
                  </div>
                  <button type="button" onClick={() => setReplyTo(null)} className="text-slate-400 hover:text-slate-700">×</button>
                </div>
              )}
              <div className="flex items-center gap-2">
                <input
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void handleSend();
                    }
                  }}
                  placeholder="Nhập tin nhắn..."
                  className="flex-1 text-sm bg-slate-100 rounded-full px-4 py-2 outline-none focus:bg-slate-200 transition placeholder-slate-400"
                />
                <button
                  type="button"
                  onClick={() => void handleSend()}
                  disabled={!inputVal.trim() || sending}
                  className="cursor-pointer w-8 h-8 flex items-center justify-center rounded-full bg-rose-500 text-white hover:bg-rose-600 disabled:opacity-40 active:scale-95 transition flex-shrink-0"
                >
                  {sending ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}