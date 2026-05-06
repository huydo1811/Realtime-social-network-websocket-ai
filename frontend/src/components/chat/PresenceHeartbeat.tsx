"use client";

import { useEffect } from "react";
import { chatApi } from "@/lib/api/chatApi";
import { getAuthTokens } from "@/lib/api/authToken";

export default function PresenceHeartbeat() {
  useEffect(() => {
    const tokens = getAuthTokens();
    if (!tokens?.accessToken) return;

    const sendHeartbeat = (online: boolean) => {
      void chatApi.heartbeatPresence(online).catch(() => undefined);
    };

    sendHeartbeat(true);
    const timer = window.setInterval(() => sendHeartbeat(true), 20000);

    const onVisibility = () => {
      // Keep user online while navigating within the app.
      if (!document.hidden) sendHeartbeat(true);
    };
    const onBeforeUnload = () => {
      sendHeartbeat(false);
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, []);

  return null;
}
