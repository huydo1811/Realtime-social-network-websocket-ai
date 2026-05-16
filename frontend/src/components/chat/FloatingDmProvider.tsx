"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { getAuthTokens } from "@/lib/api/authToken";
import { getUserIdFromAccessToken } from "@/lib/auth/jwtSubject";
import type { ConversationResponse } from "@/types/chat";
import { dispatchPrivateThreadsSync } from "@/lib/event/chatEvents";
import FloatingChatWindow from "./FloatingChatWindow";
import FloatingDraftChat from "./FloatingDraftChat";

type Entry =
  | { kind: "draft"; key: string; peerUserId: number }
  | { kind: "open"; key: string; conversation: ConversationResponse };

type FloatingDmContextValue = {
  openDraftPeer: (peerUserId: number) => void;
};

const FloatingDmContext = createContext<FloatingDmContextValue | null>(null);

export function useFloatingDm(): FloatingDmContextValue {
  const v = useContext(FloatingDmContext);
  if (!v) {
    throw new Error("useFloatingDm requires FloatingDmProvider");
  }
  return v;
}

function privateDmIncludesPeer(conv: ConversationResponse, peerUserId: number, me: number): boolean {
  return conv.type === "PRIVATE" && conv.memberIds.length === 2 && conv.memberIds.includes(peerUserId) && conv.memberIds.includes(me);
}

export function FloatingDmProvider({ children }: { children: React.ReactNode }) {
  const [stack, setStack] = useState<Entry[]>([]);

  const openDraftPeer = useCallback((peerUserId: number) => {
    const token = getAuthTokens()?.accessToken;
    const me = token ? getUserIdFromAccessToken(token) : null;
    if (me == null || peerUserId === me || !Number.isFinite(peerUserId) || peerUserId <= 0) return;

    setStack((prev) => {
      const filtered = prev.filter((e) => {
        if (e.kind === "draft" && e.peerUserId === peerUserId) return false;
        if (e.kind === "open" && privateDmIncludesPeer(e.conversation, peerUserId, me)) return false;
        return true;
      });
      const entry: Entry = { kind: "draft", key: `draft-${peerUserId}-${Date.now()}`, peerUserId };
      return [...filtered, entry].slice(-3);
    });
  }, []);

  const removeKey = useCallback((key: string) => {
    setStack((prev) => prev.filter((e) => e.key !== key));
  }, []);

  const promoteDraft = useCallback((draftKey: string, conversation: ConversationResponse) => {
    setStack((prev) =>
      prev.map((e) => (e.kind === "draft" && e.key === draftKey ? { kind: "open", key: `conv-${conversation.id}`, conversation } : e))
    );
    dispatchPrivateThreadsSync();
  }, []);

  const value = useMemo(() => ({ openDraftPeer }), [openDraftPeer]);

  return (
    <FloatingDmContext.Provider value={value}>
      {children}
      {stack.map((e, idx) =>
        e.kind === "draft" ? (
          <FloatingDraftChat
            key={e.key}
            peerUserId={e.peerUserId}
            offsetIndex={idx}
            onClose={() => removeKey(e.key)}
            onPromoted={(conv) => promoteDraft(e.key, conv)}
          />
        ) : (
          <FloatingChatWindow key={e.key} conversation={e.conversation} offsetIndex={idx} onClose={() => removeKey(e.key)} />
        )
      )}
    </FloatingDmContext.Provider>
  );
}

export function OpenDmBubbleButton({
  peerUserId,
  className,
  children,
}: {
  peerUserId: number;
  className?: string;
  children: React.ReactNode;
}) {
  const { openDraftPeer } = useFloatingDm();
  return (
    <button type="button" className={className} onClick={() => openDraftPeer(peerUserId)}>
      {children}
    </button>
  );
}
