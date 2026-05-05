// frontend/src/components/chat/MessageBubble.tsx
"use client";
import { useEffect, useRef, useState } from "react";
import { MessageResponse } from "@/types/chat";

interface Props {
  message: MessageResponse;
  isOwn: boolean;
  showAvatar?: boolean;
  senderGradient?: string;
  senderName?: string;
  highlightTerm?: string;
  isActiveSearchHit?: boolean;
  isStarred?: boolean;
  replyPreview?: string;
  replyToMessageId?: number | null;
  onJumpToReplyTarget?: (messageId: number) => void;
  onReply?: (message: MessageResponse) => void;
  onToggleStar?: (messageId: number) => void;
  onEdit?: (id: number, content: string) => void;
  onDelete?: (id: number) => void;
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MessageBubble({
  message,
  isOwn,
  showAvatar,
  senderGradient = "from-slate-400 to-slate-500",
  senderName,
  highlightTerm,
  isActiveSearchHit,
  isStarred,
  replyPreview,
  replyToMessageId,
  onJumpToReplyTarget,
  onReply,
  onToggleStar,
  onEdit,
  onDelete,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [editVal, setEditVal] = useState("");
  const [hovered, setHovered] = useState(false);
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) return;
    editInputRef.current?.focus({ preventScroll: true });
  }, [editing]);

  if (message.deleted) {
    return (
      <div className={`flex ${isOwn ? "justify-end" : "justify-start"} px-3 py-0.5`}>
        <span className="text-xs text-slate-400 italic bg-slate-50 rounded-2xl px-3 py-1.5 border border-slate-100">
          Tin nhắn đã bị xóa
        </span>
      </div>
    );
  }

  const renderHighlightedContent = () => {
    const content = message.content;
    const term = highlightTerm?.trim();
    if (!term) return content;
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escaped})`, "ig");
    const parts = content.split(regex);
    const lowerTerm = term.toLowerCase();
    return parts.map((part, idx) =>
      part.toLowerCase() === lowerTerm ? (
        <mark key={`${part}-${idx}`} className="bg-yellow-200 text-inherit rounded px-0.5">
          {part}
        </mark>
      ) : (
        <span key={`${part}-${idx}`}>{part}</span>
      )
    );
  };

  return (
    <div
      className={`flex items-end ${isOwn ? "justify-end" : "justify-start"} px-3 py-0.5 group`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {!isOwn && (
        <div className="w-8 mr-2 flex-shrink-0">
          {showAvatar && (
            <div
              className={`w-8 h-8 rounded-full bg-gradient-to-br ${senderGradient}
              flex items-center justify-center text-white text-xs font-bold shadow-sm`}
            >
              {(senderName?.trim()?.charAt(0) || message.senderId.toString().charAt(0)).toUpperCase()}
            </div>
          )}
        </div>
      )}

      <div className={`flex flex-col max-w-[78%] ${isOwn ? "items-end ml-10" : "items-start"}`}>
        {editing ? (
          <div className="flex gap-2 items-center w-full">
            <input
              ref={editInputRef}
              value={editVal}
              onChange={(e) => setEditVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const next = editVal.trim();
                  if (next) onEdit?.(message.id, next);
                  setEditing(false);
                }
                if (e.key === "Escape") {
                  setEditVal(message.content);
                  setEditing(false);
                }
              }}
              className="flex-1 text-sm px-3 py-2 rounded-xl border border-rose-300 outline-none focus:ring-2 focus:ring-rose-100"
            />
            <button
              onClick={() => {
                setEditVal(message.content);
                setEditing(false);
              }}
              className="cursor-pointer text-xs text-slate-400"
            >
              Hủy
            </button>
          </div>
        ) : (
          <div
            className={`relative px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words shadow-sm
            ${isOwn ? "bg-rose-500 text-white rounded-br-sm" : "bg-slate-100 text-slate-800 rounded-bl-sm"}
            ${isActiveSearchHit ? "ring-2 ring-amber-300" : ""}`}
          >
            {replyPreview && (
              <button
                type="button"
                onClick={() => {
                  if (replyToMessageId) onJumpToReplyTarget?.(replyToMessageId);
                }}
                className={`cursor-pointer mb-1.5 w-full text-left text-[11px] rounded-lg px-2.5 py-1.5 border transition
                ${isOwn ? "bg-rose-400/40 border-rose-300 text-rose-100 hover:bg-rose-400/55" : "bg-white/85 border-slate-200 text-slate-500 hover:bg-slate-50"}`}
              >

                {replyPreview}
              </button>
            )}
            {renderHighlightedContent()}
            {message.editedAt && (
              <span className={`text-[10px] ml-1.5 ${isOwn ? "text-rose-200" : "text-slate-400"}`}>
                (đã sửa)
              </span>
            )}
          </div>
        )}

        <div className={`flex items-center gap-2 mt-0.5 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
          <span className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity px-1">
            {fmtTime(message.createdAt)}
          </span>

          {hovered && !editing && (
            <div className="flex items-center gap-1">
              {onReply && (
                <button
                  onClick={() => onReply(message)}
                  className="cursor-pointer p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
                  title="Trả lời"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v3m0 0l-3-3m3 3l3-3" />
                  </svg>
                </button>
              )}
              {onToggleStar && (
                <button
                  onClick={() => onToggleStar(message.id)}
                  className={`cursor-pointer p-1 rounded-full transition ${
                    isStarred ? "text-amber-500 hover:bg-amber-50" : "text-slate-400 hover:bg-slate-100 hover:text-amber-500"
                  }`}
                  title={isStarred ? "Bỏ ghim sao" : "Ghim sao"}
                >
                  <svg className="w-3.5 h-3.5" fill={isStarred ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l2.033 6.26a1 1 0 00.95.69h6.58c.969 0 1.371 1.24.588 1.81l-5.322 3.867a1 1 0 00-.364 1.118l2.033 6.26c.3.922-.755 1.688-1.538 1.118l-5.322-3.866a1 1 0 00-1.176 0l-5.322 3.866c-.783.57-1.838-.196-1.539-1.118l2.034-6.26a1 1 0 00-.364-1.118L.898 11.687c-.783-.57-.38-1.81.588-1.81h6.58a1 1 0 00.95-.69l2.033-6.26z" />
                  </svg>
                </button>
              )}
              {isOwn && (
                <>
              <button
                onClick={() => {
                  setEditVal(message.content);
                  setEditing(true);
                }}
                className="cursor-pointer p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
                title="Sửa"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>

              <button
                onClick={() => onDelete?.(message.id)}
                className="cursor-pointer p-1 rounded-full hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition"
                title="Xóa"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}