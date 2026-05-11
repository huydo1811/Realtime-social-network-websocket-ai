"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ConversationResponse } from "@/types/chat";

type Props = {
  open: boolean;
  onClose: () => void;
  conversations: ConversationResponse[];
  currentUserId: number;
  onSelect: (c: ConversationResponse) => void;
  userNames: Record<number, string>;
};

export default function ChatCommandPalette({
  open,
  onClose,
  conversations,
  currentUserId,
  onSelect,
  userNames,
}: Props) {
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setQ("");
      return;
    }
    const t = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return conversations
      .map((c) => {
        const other = c.memberIds.find((id) => id !== currentUserId);
        const label =
          c.type === "GROUP"
            ? c.name || `Nhóm #${c.id}`
            : c.nickname?.trim() || (other != null ? userNames[other] : null) || `Chat #${c.id}`;
        return { c, label, haystack: `${label} ${c.id}`.toLowerCase() };
      })
      .filter((row) => !needle || row.haystack.includes(needle))
      .slice(0, 12);
  }, [conversations, currentUserId, q, userNames]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[12vh] px-3">
      <button type="button" className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" aria-label="Đóng" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2">
          <span className="text-xs font-semibold text-slate-400">⌘K</span>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm cuộc trò chuyện..."
            className="flex-1 py-2 text-sm outline-none bg-transparent"
          />
        </div>
        <ul className="max-h-72 overflow-y-auto py-1">
          {rows.length === 0 ? (
            <li className="px-4 py-6 text-center text-sm text-slate-400">Không có kết quả</li>
          ) : (
            rows.map(({ c, label }) => (
              <li key={c.id}>
                <button
                  type="button"
                  className="cursor-pointer w-full text-left px-4 py-2.5 text-sm hover:bg-rose-50 flex flex-col gap-0.5"
                  onClick={() => {
                    onSelect(c);
                    onClose();
                  }}
                >
                  <span className="font-semibold text-slate-800 truncate">{label}</span>
                  <span className="text-[11px] text-slate-400">
                    #{c.id} · {c.type === "GROUP" ? "Nhóm" : "Riêng tư"}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
        <p className="border-t border-slate-100 px-3 py-2 text-[10px] text-slate-400">Esc để đóng · Ctrl+K mở lại</p>
      </div>
    </div>
  );
}
