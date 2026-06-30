"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { listIncomingRequests } from "@/lib/api/friendshipApi";
import { petApi } from "@/lib/api/petApi";
import { getAuthTokens } from "@/lib/api/authToken";
import { getUserIdFromAccessToken } from "@/lib/auth/jwtSubject";
import {
  friendshipEventToNotification,
  incomingRequestToNotification,
} from "@/lib/notifications/friendshipToNotification";
import { dueRemindersToNotifications } from "@/lib/notifications/petReminderToNotification";
import {
  loadNotifications,
  mergeNotifications,
  saveNotifications,
} from "@/lib/notifications/notificationStore";
import { initChatSocket, subscribeFriendshipUser } from "@/lib/socket/chatSocket";
import { peerUserId } from "@/lib/friendship/peerUserId";
import type { FriendshipRealtimeEvent } from "@/types/friendship";
import type { AppNotification } from "@/types/notification";
import { markFriendIncomingSeen } from "@/lib/nav/friendBadgeSeen";

type NotificationsContextValue = {
  items: AppNotification[];
  /** Tất cả thông báo chưa đọc (icon chuông) */
  unreadCount: number;
  /** Lời mời kết bạn chưa xử lý (badge tab Bạn bè) */
  pendingFriendCount: number;
  panelOpen: boolean;
  openPanel: () => void;
  closePanel: () => void;
  togglePanel: () => void;
  markAllRead: () => void;
  markRead: (id: string) => void;
  removeNotification: (id: string) => void;
  updateNotification: (id: string, patch: Partial<AppNotification>) => void;
  refreshFromServer: () => Promise<void>;
  ingestFriendshipEvent: (ev: FriendshipRealtimeEvent) => void;
};

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [myId, setMyId] = useState<number | null>(null);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const t = getAuthTokens()?.accessToken;
    const id = t ? getUserIdFromAccessToken(t) : null;
    setMyId(id);
    if (id != null) {
      setItems(loadNotifications(id));
    }
    setHydrated(true);
  }, []);

  const persist = useCallback(
    (next: AppNotification[]) => {
      if (myId == null) return;
      saveNotifications(myId, next);
      setItems(next);
    },
    [myId]
  );

  const refreshFromServer = useCallback(async () => {
    if (myId == null) return;
    try {
      const [incoming, dueReminders] = await Promise.all([
        listIncomingRequests(),
        petApi.listDueReminders().catch(() => [] as Awaited<ReturnType<typeof petApi.listDueReminders>>),
      ]);
      const incomingIds = new Set(incoming.map((row) => row.friendshipId));
      const fromFriendApi = incoming.map((row) =>
        incomingRequestToNotification(
          row.friendshipId,
          peerUserId(row, myId),
          row.createdAt ?? row.updatedAt
        )
      );
      const dueReminderIds = new Set(dueReminders.map((r) => r.id));
      const fromPetApi = dueRemindersToNotifications(dueReminders);
      setItems((prev) => {
        const reconciled = prev
          .map((n) => {
            if (n.kind === "friend_request" && n.friendshipId != null && !incomingIds.has(n.friendshipId)) {
              return { ...n, actionable: false, read: true };
            }
            return n;
          })
          .filter(
            (n) =>
              n.kind !== "pet_reminder" ||
              (n.reminderId != null && dueReminderIds.has(n.reminderId))
          );
        const merged = mergeNotifications(reconciled, [...fromFriendApi, ...fromPetApi]);
        saveNotifications(myId, merged);
        return merged;
      });
    } catch {
      /* offline */
    }
  }, [myId]);

  const ingestFriendshipEvent = useCallback(
    (ev: FriendshipRealtimeEvent) => {
      if (myId == null) return;
      const n = friendshipEventToNotification(ev, myId);
      if (!n) return;
      setItems((prev) => {
        const merged = mergeNotifications(prev, [n]);
        saveNotifications(myId, merged);
        return merged;
      });
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("notification-ingested", { detail: n }));
      }
    },
    [myId]
  );

  useEffect(() => {
    if (!hydrated || myId == null) return;
    void refreshFromServer();
    const interval = window.setInterval(() => void refreshFromServer(), 30 * 60 * 1000);
    return () => window.clearInterval(interval);
  }, [hydrated, myId, refreshFromServer]);

  useEffect(() => {
    if (myId == null) return;
    const h = () => void refreshFromServer();
    window.addEventListener("friendship-changed", h);
    window.addEventListener("pet-reminder-changed", h);
    return () => {
      window.removeEventListener("friendship-changed", h);
      window.removeEventListener("pet-reminder-changed", h);
    };
  }, [myId, refreshFromServer]);

  useEffect(() => {
    if (myId == null) return;
    initChatSocket();
    const unsub = subscribeFriendshipUser(myId, (ev) => {
      ingestFriendshipEvent(ev);
      window.dispatchEvent(new CustomEvent("friendship-changed"));
    });
    return () => unsub();
  }, [myId, ingestFriendshipEvent]);

  const unreadCount = useMemo(() => items.filter((n) => !n.read).length, [items]);

  const pendingFriendCount = useMemo(
    () => items.filter((n) => !n.read && n.actionable && n.kind === "friend_request").length,
    [items]
  );

  const markOpened = useCallback(() => {
    setItems((prev) => {
      const pending = prev.filter((n) => n.actionable && !n.read).length;
      markFriendIncomingSeen(pending);
      const next = prev.map((n) => ({ ...n, read: true }));
      if (myId != null) saveNotifications(myId, next);
      return next;
    });
    void refreshFromServer();
  }, [myId, refreshFromServer]);

  const openPanel = useCallback(() => {
    setPanelOpen(true);
    markOpened();
  }, [markOpened]);

  const closePanel = useCallback(() => setPanelOpen(false), []);

  const togglePanel = useCallback(() => {
    setPanelOpen((o) => {
      if (o) return false;
      markOpened();
      return true;
    });
  }, [markOpened]);

  const markAllRead = useCallback(() => {
    setItems((prev) => {
      const pending = prev.filter((n) => n.actionable && !n.read).length;
      markFriendIncomingSeen(pending);
      const next = prev.map((n) => ({ ...n, read: true }));
      if (myId != null) saveNotifications(myId, next);
      return next;
    });
  }, [myId]);

  const markRead = useCallback(
    (id: string) => {
      setItems((prev) => {
        const next = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
        if (myId != null) saveNotifications(myId, next);
        return next;
      });
    },
    [myId]
  );

  const removeNotification = useCallback(
    (id: string) => {
      setItems((prev) => {
        const next = prev.filter((n) => n.id !== id);
        if (myId != null) saveNotifications(myId, next);
        return next;
      });
    },
    [myId]
  );

  const updateNotification = useCallback(
    (id: string, patch: Partial<AppNotification>) => {
      setItems((prev) => {
        const next = prev.map((n) => (n.id === id ? { ...n, ...patch } : n));
        if (myId != null) saveNotifications(myId, next);
        return next;
      });
    },
    [myId]
  );

  const value = useMemo(
    () => ({
      items,
      unreadCount,
      pendingFriendCount,
      panelOpen,
      openPanel,
      closePanel,
      togglePanel,
      markAllRead,
      markRead,
      removeNotification,
      updateNotification,
      refreshFromServer,
      ingestFriendshipEvent,
    }),
    [
      items,
      unreadCount,
      pendingFriendCount,
      panelOpen,
      openPanel,
      closePanel,
      togglePanel,
      markAllRead,
      markRead,
      removeNotification,
      updateNotification,
      refreshFromServer,
      ingestFriendshipEvent,
    ]
  );

  return (
    <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error("useNotifications must be used within NotificationsProvider");
  }
  return ctx;
}
