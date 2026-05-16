"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { chatApi } from "@/lib/api/chatApi";
import { initChatSocket, subscribePresence } from "@/lib/socket/chatSocket";
import type { ConversationResponse, UserPresenceResponse } from "@/types/chat";
import { getAuthTokens } from "@/lib/api/authToken";
import { getUserById } from "@/lib/api/userApi";
import { encodeMessageContent } from "@/lib/chat/messageAttachment";
import { formatLastActiveSubtitle } from "@/lib/chat/presenceLabels";
import ChatInput from "./ChatInput";

function parseUserId(token: string): number | null {
  try {
    const p = JSON.parse(atob(token.split(".")[1]));
    return Number(p.sub ?? p.userId ?? p.id) || null;
  } catch {
    return null;
  }
}

const GRADIENTS = [
  "from-rose-400 to-pink-500",
  "from-violet-400 to-purple-500",
  "from-blue-400 to-sky-500",
  "from-emerald-400 to-green-500",
];

function grad(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return GRADIENTS[Math.abs(h) % GRADIENTS.length];
}

type Props = {
  peerUserId: number;
  offsetIndex?: number;
  onClose: () => void;
  onPromoted: (conversation: ConversationResponse) => void;
};

export default function FloatingDraftChat({ peerUserId, offsetIndex = 0, onClose, onPromoted }: Props) {
  const [minimized, setMinimized] = useState(false);
  const [peerName, setPeerName] = useState<string>("");
  const [loadingPeer, setLoadingPeer] = useState(true);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [presence, setPresence] = useState<UserPresenceResponse | undefined>(undefined);
  const [blocked, setBlocked] = useState<{ byMe: boolean; me: boolean }>({ byMe: false, me: false });

  const currentUserId = parseUserId(getAuthTokens()?.accessToken ?? "") ?? -1;

  const [desktopLayout, setDesktopLayout] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => setDesktopLayout(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const rightOffset = 288 + 8 + offsetIndex * (320 + 8);

  useEffect(() => {
    initChatSocket();
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoadingPeer(true);
    getUserById(String(peerUserId))
      .then((u) => {
        if (!cancelled) setPeerName(u.fullName?.trim() || `Người dùng #${peerUserId}`);
      })
      .catch(() => {
        if (!cancelled) setPeerName(`Người dùng #${peerUserId}`);
      })
      .finally(() => {
        if (!cancelled) setLoadingPeer(false);
      });
    return () => {
      cancelled = true;
    };
  }, [peerUserId]);

  useEffect(() => {
    chatApi
      .getPresence([peerUserId])
      .then((list) => {
        const p = list.find((x) => x.userId === peerUserId);
        if (p) setPresence(p);
      })
      .catch(() => undefined);
  }, [peerUserId]);

  useEffect(() => {
    const unsub = subscribePresence((event) => {
      if (event.eventName !== "chat.user.presence" || event.targetUserId !== peerUserId) return;
      setPresence({
        userId: peerUserId,
        online: Boolean(event.online),
        lastSeenAt: event.lastSeenAt || new Date().toISOString(),
      });
    });
    return () => unsub();
  }, [peerUserId]);

  useEffect(() => {
    chatApi
      .getBlockStatus(peerUserId)
      .then((s) => setBlocked({ byMe: s.blockedByMe, me: s.blockedMe }))
      .catch(() => undefined);
  }, [peerUserId]);

  const displayName = peerName || `Người dùng #${peerUserId}`;
  const gradient = useMemo(() => grad(displayName), [displayName]);

  const handleSend = useCallback(
    async ({ text, files }: { text: string; files: File[] }) => {
      if ((!text.trim() && files.length === 0) || sending) return;
      if (blocked.byMe || blocked.me) {
        setSendError("Không thể gửi tin nhắn do trạng thái chặn.");
        return;
      }
      if (currentUserId < 0 || peerUserId === currentUserId) return;

      setSending(true);
      setSendError(null);
      try {
        const conv = await chatApi.createConversation({
          type: "PRIVATE",
          participantIds: [peerUserId],
          idempotencyKey: `draft-dm-${Math.min(currentUserId, peerUserId)}-${Math.max(currentUserId, peerUserId)}`,
        });

        const idempotencyKey = `${Date.now()}`;
        if (files.length > 0) {
          await chatApi.sendMessageWithFiles(conv.id, {
            content: text,
            files,
            idempotencyKey,
            replyToMessageId: null,
          });
        } else {
          await chatApi.sendMessage(conv.id, encodeMessageContent(text, []), idempotencyKey, null);
        }

        onPromoted(conv);
      } catch (e) {
        console.error(e);
        setSendError(e instanceof Error ? e.message : "Không gửi được tin nhắn.");
      } finally {
        setSending(false);
      }
    },
    [blocked.byMe, blocked.me, currentUserId, onPromoted, peerUserId, sending]
  );

  return (
    <div
      className={`fixed z-[60] flex w-[min(20rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-2xl sm:w-80 ${
        desktopLayout ? "bottom-0" : "bottom-20 left-1/2 -translate-x-1/2"
      }`}
      style={desktopLayout ? { right: `${rightOffset}px` } : undefined}
    >
      <div className="flex cursor-pointer items-center gap-2.5 border-b border-slate-100 bg-white px-3 py-2.5">
        <button type="button" className="flex min-w-0 flex-1 items-center gap-2.5 text-left" onClick={() => setMinimized((v) => !v)}>
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${gradient} text-xs font-bold text-white`}
          >
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900">{loadingPeer ? "…" : displayName}</p>
            <div className="mt-0.5 flex items-center gap-1">
              <span
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                  presence ? (presence.online ? "bg-green-400" : "bg-slate-400") : "animate-pulse bg-slate-300"
                }`}
              />
              <span
                className={`truncate text-[10px] font-medium ${presence ? (presence.online ? "text-green-600" : "text-slate-500") : "text-slate-400"}`}
              >
                {presence ? (presence.online ? "Đang hoạt động" : formatLastActiveSubtitle(presence.lastSeenAt)) : "Đang tải trạng thái..."}
              </span>
            </div>
          </div>
        </button>
        <button type="button" onClick={() => setMinimized((v) => !v)} className="cursor-pointer rounded-full p-1 text-slate-400 hover:bg-slate-100">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d={minimized ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
          </svg>
        </button>
        <button type="button" onClick={onClose} className="cursor-pointer rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-red-400">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {!minimized && (
        <>
          {(blocked.byMe || blocked.me) && (
            <div className="border-b border-amber-100 bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
              {blocked.byMe ? "Bạn đã chặn người này." : "Bạn bị chặn — không thể gửi tin."}
            </div>
          )}
          <div className="flex h-72 flex-col justify-center bg-slate-50 px-4">
            <p className="text-center text-xs leading-relaxed text-slate-500">
              Soạn tin nhắn đầu tiên. Cuộc trò chuyện chỉ được tạo sau khi bạn gửi — đóng cửa sổ nếu chưa gửi sẽ không lưu liên hệ.
            </p>
          </div>
          <div className="border-t border-slate-100 bg-white p-2">
            <ChatInput onSend={(p) => handleSend(p)} disabled={blocked.byMe || blocked.me} sending={sending} sendError={sendError} />
          </div>
        </>
      )}
    </div>
  );
}
