"use client";

import { useCallback, useEffect, useState } from "react";

type ViolationItem = {
  id: number;
  message: string;
  reason?: string;
};

let pushViolationImpl: ((message: string, reason?: string) => void) | null = null;

export function showModerationViolation(message: string, reason?: string) {
  pushViolationImpl?.(message, reason);
}

export function isModerationViolation(message: string): boolean {
  const m = (message || "").toLowerCase();
  return (
    m.includes("moderation") ||
    m.includes("không phù hợp") ||
    m.includes("khong phu hop") ||
    m.includes("hard_reject") ||
    m.includes("hard reject") ||
    m.includes("từ ngữ") ||
    m.includes("tu ngu") ||
    m.includes("ảnh không") ||
    m.includes("anh khong") ||
    m.includes("nội dung chứa") ||
    m.includes("noi dung chua") ||
    m.includes("vi phạm") ||
    m.includes("vi pham") ||
    m.includes("bị từ chối") ||
    m.includes("bi tu choi") ||
    m.includes("content moderation") ||
    m.includes("image moderation") ||
    m.includes("pet image") ||
    m.includes("nsfw") ||
    m.includes("toxic")
  );
}

export function handleModerationAwareError(err: unknown, fallback: string): boolean {
  const message = err instanceof Error ? err.message : fallback;
  if (isModerationViolation(message) || isModerationViolation(fallback)) {
    showModerationViolation(
      "Hệ thống kiểm duyệt đã chặn nội dung của bạn.",
      message || fallback
    );
    return true;
  }
  return false;
}

export default function ModerationViolationModalHost() {
  const [items, setItems] = useState<ViolationItem[]>([]);

  const push = useCallback((message: string, reason?: string) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setItems([{ id, message, reason }]);
  }, []);

  const dismiss = useCallback((id: number) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  useEffect(() => {
    pushViolationImpl = push;
    return () => {
      pushViolationImpl = null;
    };
  }, [push]);

  useEffect(() => {
    if (!items.length) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setItems([]);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [items.length]);

  if (!items.length) return null;

  return (
    <>
      {items.map((item) => (
        <div
          key={item.id}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby={`mod-violation-title-${item.id}`}
        >
          <div className="relative w-full max-w-lg animate-[pulse_1.2s_ease-in-out_1] overflow-hidden rounded-3xl border-4 border-rose-500 bg-gradient-to-b from-rose-950 via-red-950 to-black p-7 text-center shadow-[0_0_60px_rgba(225,29,72,0.55)]">
            <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-rose-600/30 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-orange-600/20 blur-3xl" />
            <div className="relative">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border-4 border-rose-400 bg-rose-600 text-4xl shadow-lg shadow-rose-900/60">
                ⛔
              </div>
              <p className="text-[11px] font-black uppercase tracking-[0.25em] text-rose-300">
                Cảnh báo nghiêm trọng
              </p>
              <h2
                id={`mod-violation-title-${item.id}`}
                className="mt-2 text-2xl font-black uppercase leading-tight tracking-wide text-white"
              >
                Nội dung bị từ chối
              </h2>
              <p className="mt-4 text-sm font-semibold leading-relaxed text-rose-50">
                {item.message}
              </p>
              {item.reason ? (
                <div className="mt-4 rounded-2xl border border-rose-400/50 bg-black/50 px-4 py-3 text-left">
                  <p className="text-[10px] font-black uppercase tracking-wider text-rose-300">
                    Chi tiết vi phạm
                  </p>
                  <p className="mt-1 text-sm text-rose-100/90">{item.reason}</p>
                </div>
              ) : null}
              <div className="mt-5 rounded-2xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-left text-xs leading-relaxed text-amber-100">
                <p className="font-bold text-amber-200">Hậu quả nếu tiếp tục vi phạm:</p>
                <ul className="mt-1 list-disc space-y-0.5 pl-4">
                  <li>Bài viết / ảnh sẽ bị chặn hoàn toàn</li>
                  <li>Tài khoản có thể bị hạn chế hoặc khóa</li>
                  <li>Nội dung xấu sẽ được lưu lại để kiểm duyệt</li>
                </ul>
              </div>
              <button
                type="button"
                onClick={() => dismiss(item.id)}
                className="mt-6 w-full rounded-2xl bg-rose-500 px-4 py-3.5 text-sm font-black uppercase tracking-wide text-white shadow-lg shadow-rose-900/50 transition hover:bg-rose-400"
              >
                Tôi đã hiểu — sẽ không vi phạm nữa
              </button>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
