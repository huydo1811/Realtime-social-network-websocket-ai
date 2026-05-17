"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useNotifications } from "@/lib/notifications/NotificationsContext";
import NotificationPanel from "@/components/notifications/NotificationPanel";

type Props = {
  className?: string;
  buttonClassName?: string;
  panelPlacement?: "header" | "sidebar";
};

function formatBadge(n: number) {
  return n > 99 ? "99+" : String(n);
}

function BellIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
      />
    </svg>
  );
}

export default function NotificationCenter({
  className = "",
  buttonClassName = "",
  panelPlacement = "header",
}: Props) {
  const { unreadCount, panelOpen, openPanel, closePanel } = useNotifications();
  const anchorRef = useRef<HTMLButtonElement>(null);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  const updateRect = useCallback(() => {
    const el = anchorRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    // Hidden nodes (e.g. lg:hidden on desktop) should not anchor a panel.
    if (rect.width <= 0 && rect.height <= 0) return;
    setAnchorRect(rect);
  }, []);

  const handleToggle = useCallback(() => {
    if (panelOpen && isOwner) {
      closePanel();
      setAnchorRect(null);
      setIsOwner(false);
      return;
    }
    updateRect();
    setIsOwner(true);
    openPanel();
  }, [panelOpen, isOwner, closePanel, updateRect, openPanel]);

  const handleClose = useCallback(() => {
    closePanel();
    setAnchorRect(null);
    setIsOwner(false);
  }, [closePanel]);

  useEffect(() => {
    if (!panelOpen) return;
    if (!isOwner) return;
    updateRect();
    const sync = () => updateRect();
    window.addEventListener("resize", sync);
    window.addEventListener("scroll", sync, true);
    return () => {
      window.removeEventListener("resize", sync);
      window.removeEventListener("scroll", sync, true);
    };
  }, [panelOpen, isOwner, updateRect]);

  useEffect(() => {
    if (panelOpen) return;
    setAnchorRect(null);
    setIsOwner(false);
  }, [panelOpen]);

  const badge = panelOpen ? 0 : unreadCount;

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        onClick={handleToggle}
        className={`relative cursor-pointer ${buttonClassName} ${className}`.trim()}
        aria-label="Thông báo"
        aria-expanded={panelOpen}
      >
        <BellIcon />
        {badge > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
            {formatBadge(badge)}
          </span>
        )}
      </button>
      {panelOpen && isOwner && anchorRect && (
        <NotificationPanel anchorRect={anchorRect} placement={panelPlacement} onClose={handleClose} />
      )}
    </>
  );
}
