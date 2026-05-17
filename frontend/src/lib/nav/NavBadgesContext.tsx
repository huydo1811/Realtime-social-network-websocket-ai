"use client";

import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { useNotifications } from "@/lib/notifications/NotificationsContext";
import { friendIncomingBadgeCount, markFriendIncomingSeen } from "@/lib/nav/friendBadgeSeen";
import { useChatUnread } from "@/lib/nav/useChatUnread";

type NavBadgesValue = {
  friendBadge: number;
  unreadChat: number;
  dismissFriendBadge: () => void;
  refreshFriendIncoming: () => Promise<void>;
};

const NavBadgesContext = createContext<NavBadgesValue | null>(null);

export function NavBadgesProvider({ children }: { children: ReactNode }) {
  const unreadChat = useChatUnread();
  const { pendingFriendCount, refreshFromServer } = useNotifications();

  const friendBadge = useMemo(
    () => friendIncomingBadgeCount(pendingFriendCount),
    [pendingFriendCount]
  );

  const dismissFriendBadge = useCallback(() => {
    markFriendIncomingSeen(pendingFriendCount);
  }, [pendingFriendCount]);

  const value = useMemo(
    () => ({
      friendBadge,
      unreadChat,
      dismissFriendBadge,
      refreshFriendIncoming: refreshFromServer,
    }),
    [friendBadge, unreadChat, dismissFriendBadge, refreshFromServer]
  );

  return <NavBadgesContext.Provider value={value}>{children}</NavBadgesContext.Provider>;
}

export function useNavBadgesContext() {
  const ctx = useContext(NavBadgesContext);
  if (!ctx) {
    throw new Error("useNavBadgesContext must be used within NavBadgesProvider");
  }
  return ctx;
}
