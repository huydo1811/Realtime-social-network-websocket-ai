"use client";
import { KeyboardEvent, useEffect, useRef, useState } from "react";

interface Props {
  onSend: (content: string) => Promise<void> | void;
  disabled?: boolean;
  sending?: boolean;
  replyPreview?: string;
  onCancelReply?: () => void;
  onTypingChange?: (typing: boolean) => void;
}

export default function ChatInput({
  onSend,
  disabled,
  sending,
  replyPreview,
  onCancelReply,
  onTypingChange,
}: Props) {
  const [value, setValue] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  const handleSend = async () => {
    const trimmed = value.trim();
    if (!trimmed || disabled || sending) return;
    setValue("");
    if (ref.current) ref.current.style.height = "auto";
    onTypingChange?.(false);
    await onSend(trimmed);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  useEffect(() => {
    onTypingChange?.(value.trim().length > 0);
  }, [onTypingChange, value]);

  return (
    <div className="px-4 py-3 border-t bg-white border-slate-100">
      {replyPreview && (
        <div className="mb-2 rounded-xl px-3 py-2 flex items-start gap-2 border bg-rose-50 border-rose-100">
          <div className="w-1 self-stretch rounded-full bg-rose-300" />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-rose-500">Đang trả lời</p>
            <p className="text-xs truncate text-slate-600">{replyPreview}</p>
          </div>
          <button
            type="button"
            onClick={onCancelReply}
            className="text-slate-400 hover:text-slate-700 transition"
          >
            ×
          </button>
        </div>
      )}
      <div
        className="flex items-end gap-3 rounded-2xl px-4 py-2 border transition-all bg-slate-50 border-slate-200 focus-within:border-rose-300 focus-within:ring-2 focus-within:ring-rose-100"
      >
        <textarea
          ref={ref}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onInput={() => {
            if (!ref.current) return;
            ref.current.style.height = "auto";
            ref.current.style.height = `${Math.min(ref.current.scrollHeight, 120)}px`;
          }}
          onKeyDown={handleKeyDown}
          placeholder="Nhập tin nhắn… (Enter để gửi)"
          disabled={disabled}
          rows={1}
          className="flex-1 bg-transparent resize-none outline-none text-sm max-h-30 py-1.5 leading-relaxed text-slate-800 placeholder-slate-400"
        />
        <button
          onClick={() => void handleSend()}
          disabled={!value.trim() || disabled || sending}
          className="cursor-pointer mb-1 w-9 h-9 flex items-center justify-center rounded-xl
            bg-rose-500 text-white hover:bg-rose-600 active:scale-95
            disabled:opacity-40 disabled:cursor-not-allowed transition-all flex-shrink-0"
        >
          {sending ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}