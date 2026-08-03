"use client";

import { useCallback, useEffect, useState } from "react";

type ToastKind = "info" | "success" | "error" | "warning";

type ToastItem = {
  id: number;
  message: string;
  kind: ToastKind;
};

let pushToastImpl: ((message: string, kind?: ToastKind) => void) | null = null;

export function showAppToast(message: string, kind: ToastKind = "info") {
  pushToastImpl?.(message, kind);
}

export default function AppToastHost() {
  const [items, setItems] = useState<ToastItem[]>([]);

  const push = useCallback((message: string, kind: ToastKind = "info") => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setItems((prev) => [...prev, { id, message, kind }]);
    window.setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  useEffect(() => {
    pushToastImpl = push;
    return () => {
      pushToastImpl = null;
    };
  }, [push]);

  if (!items.length) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="flex w-full max-w-sm flex-col gap-2">
        {items.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto rounded-2xl border px-4 py-3 text-center text-sm font-semibold shadow-xl backdrop-blur ${
              t.kind === "success"
                ? "border-emerald-200 bg-emerald-50/95 text-emerald-800"
                : t.kind === "error"
                  ? "border-rose-200 bg-rose-50/95 text-rose-800"
                  : t.kind === "warning"
                    ? "border-amber-200 bg-amber-50/95 text-amber-900"
                    : "border-sky-200 bg-sky-50/95 text-sky-900"
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}
