"use client";

import { useEffect, useState } from "react";
import Newsfeed from "@/components/home/Newsfeed";
import Landing from "@/components/home/Landing";
import UserLayout from "@/components/layout/UserLayout";
import { getAuthTokens } from "@/lib/api/authToken";

export default function RootPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) {
    return <div className="min-h-screen bg-slate-50" />;
  }

  const tokens = getAuthTokens();
  const isAuthenticated = !!(tokens && tokens.accessToken);

  if (!isAuthenticated) {
    return <Landing />;
  }

  return (
    <UserLayout>
      <Newsfeed />
    </UserLayout>
  );
}
