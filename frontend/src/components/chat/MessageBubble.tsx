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
            ${isOwn ? "bg-rose-500 text-white rounded-br-sm" : "bg-slate-100 text-slate-800 rounded-bl-sm"}`}
          >
            {message.content}
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

          {isOwn && hovered && !editing && (
            <div className="flex items-center gap-1">
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}