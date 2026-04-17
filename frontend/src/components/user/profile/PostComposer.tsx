"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type Props = {
  avatarUrl: string;
  onSubmit: (content: string) => Promise<void> | void;
};

export default function PostComposer({ avatarUrl, onSubmit }: Props) {
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // autosize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "0px";
    const scrollHeight = Math.min(ta.scrollHeight, 220); // limit max height
    ta.style.height = `${scrollHeight}px`;
  }, [text]);

  async function handleSubmit() {
    const content = text.trim();
    if (!content) return;
    setPosting(true);
    try {
      await onSubmit(content);
      setText("");
    } finally {
      setPosting(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className="mb-4 rounded-2xl border border-slate-200 bg-gradient-to-b from-white/60 to-slate-50 p-3 shadow-sm">
      <div className="flex gap-3">
        <Image
          src={avatarUrl}
          alt="avatar mini"
          width={44}
          height={44}
          className="h-11 w-11 rounded-full object-cover"
        />
        <div className="w-full">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Bạn đang nghĩ gì hôm nay?"
            aria-label="Viết bài"
            className="w-full resize-none overflow-hidden rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-5 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-100"
          />
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                aria-label="Thêm ảnh"
                className="cursor-pointer flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-600 hover:bg-slate-50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7M3 7l6 6 4-4 6 6" />
                </svg>
                Thêm ảnh
              </button>

              <button
                type="button"
                aria-label="Thêm video"
                className="cursor-pointer flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-600 hover:bg-slate-50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4 6h10v12H4z" />
                  <path d="M18 8l4-2v10l-4-2z" fill="#fff" />
                </svg>
                Thêm video
              </button>

              <button
                type="button"
                aria-label="Cảm xúc"
                className="cursor-pointer flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-600 hover:bg-slate-50"
              >
                <span className="text-lg">😊</span>
                Cảm xúc
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={posting || !text.trim()}
                className="cursor-pointer rounded-full bg-rose-500 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-600 disabled:opacity-60"
              >
                {posting ? "Đang đăng..." : "Đăng bài"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}