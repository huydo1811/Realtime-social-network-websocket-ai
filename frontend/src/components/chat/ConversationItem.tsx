// frontend/src/components/chat/ConversationItem.tsx
"use client";
import { ConversationResponse } from "@/types/chat";

interface Props {
  conversation: ConversationResponse;
  isActive: boolean;
  currentUserId: number;
  onClick: () => void;
  resolvedName?: string;
  preview?: string;
  hasImagePreview?: boolean;
  timeLabel?: string;
  isOnline?: boolean;
}

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

function getFallbackName(conv: ConversationResponse, uid: number) {
  if (conv.type === "GROUP") return conv.name || "Nhóm chat";
  const other = conv.memberIds.find((id) => id !== uid);
  return other ? `Người dùng #${other}` : "Chat";
}

export default function ConversationItem({
  conversation,
  isActive,
  currentUserId,
  onClick,
  resolvedName,
  preview,
  hasImagePreview = false,
  timeLabel,
  isOnline = false,
}: Props) {
  const name = resolvedName || getFallbackName(conversation, currentUserId);
  const gradient = avatarGradient(name);
  const initials = name.charAt(0).toUpperCase();
  const unread = conversation.unreadCount;

  return (
    <button
      onClick={onClick}
      className={`
        cursor-pointer w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-left transition-all duration-150
        ${isActive ? "bg-rose-50" : "hover:bg-slate-50 active:bg-slate-100"}
      `}
    >
      <div className="relative flex-shrink-0">
        <div
          className={`
          w-12 h-12 rounded-full bg-gradient-to-br ${gradient}
          flex items-center justify-center text-white font-bold text-base shadow-sm
        `}
        >
          {conversation.type === "GROUP" ? (
            <svg className="w-6 h-6" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          ) : (
            initials
          )}
        </div>
        {conversation.type === "PRIVATE" && (
          <span
            className={`absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full border-2 border-white ${
              isOnline ? "bg-green-400" : "bg-slate-300"
            }`}
          />
        )}
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p
            className={`
            text-sm truncate font-semibold flex-1 min-w-0
            ${isActive ? "text-rose-600" : "text-slate-900"}
            ${unread > 0 ? "font-bold" : ""}
          `}
          >
            {name}
          </p>
          {timeLabel && <span className="text-[10px] text-slate-400">{timeLabel}</span>}
        </div>
        <div className={`mt-0.5 flex items-center gap-1.5 min-w-0 ${unread > 0 ? "text-slate-700 font-medium" : "text-slate-400"}`}>
          {hasImagePreview && (
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" className="flex-shrink-0" viewBox="0 0 16 16">
              <path d="M6.002 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0"/>
              <path d="M1.5 2A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 14.5 2zm13 1a.5.5 0 0 1 .5.5v6l-3.775-1.947a.5.5 0 0 0-.577.093l-3.71 3.71-2.66-1.772a.5.5 0 0 0-.63.062L1.002 12v.54L1 12.5v-9a.5.5 0 0 1 .5-.5z"/>
            </svg>
          )}
          <p className="text-xs truncate min-w-0">
            {preview || (conversation.type === "GROUP" ? `${conversation.memberIds.length} thành viên` : "Tin nhắn riêng tư")}
          </p>
        </div>
      </div>
    </button>
  );
}