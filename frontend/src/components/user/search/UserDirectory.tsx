"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import FriendActionButton from "@/components/friendship/FriendActionButton";
import { searchUsers } from "@/lib/api/userApi";
import { getAuthTokens } from "@/lib/api/authToken";
import { getUserIdFromAccessToken } from "@/lib/auth/jwtSubject";
import { OpenDmBubbleButton } from "@/components/chat/FloatingDmProvider";

interface UserDto {
  id: string;
  fullName: string;
  username?: string;
  avatarUrl?: string;
  bio?: string;
}

export default function UserDirectory() {
  const [users, setUsers] = useState<UserDto[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [myId, setMyId] = useState<number | null>(null);

  useEffect(() => {
    const t = getAuthTokens()?.accessToken;
    setMyId(t ? getUserIdFromAccessToken(t) : null);
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const data = await searchUsers(query, 0, 12);
        const raw = (data?.content ?? data ?? []) as UserDto[];
        setUsers(Array.isArray(raw) ? raw : []);
      } catch (err) {
        console.error(err);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    const delay = setTimeout(fetchUsers, 500);
    return () => clearTimeout(delay);
  }, [query]);

  const visibleUsers = useMemo(() => {
    return users.filter((u) => {
      const uid = Number(u.id);
      if (!Number.isFinite(uid) || uid <= 0) return false;
      if (myId != null && uid === myId) return false;
      return true;
    });
  }, [users, myId]);

  return (
    <div className="w-full">
      <div className="group relative mb-8">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
          <svg
            className="h-5 w-5 text-slate-400 transition-colors group-focus-within:text-rose-500"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          placeholder="Tìm kiếm người dùng theo tên..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-2xl border-2 border-transparent bg-white/80 py-4 pl-12 pr-4 font-medium text-slate-700 shadow-sm backdrop-blur-sm placeholder:text-slate-400 transition-all duration-300 focus:border-rose-100 focus:outline-none focus:ring-4 focus:ring-rose-50"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex animate-pulse flex-col items-center rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="mb-4 h-20 w-20 rounded-full bg-slate-200" />
              <div className="mb-2 h-4 w-3/4 rounded-full bg-slate-200" />
              <div className="mb-6 h-3 w-1/2 rounded-full bg-slate-200" />
              <div className="h-10 w-full rounded-xl bg-slate-200" />
            </div>
          ))
        ) : visibleUsers.length > 0 ? (
          visibleUsers.map((user) => {
            const uid = Number(user.id);

            return (
              <div
                key={user.id}
                className="group relative flex flex-col items-center rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-rose-100 hover:shadow-xl"
              >
                <Link href={`/profile/${user.id}`} className="flex flex-col items-center">
                  <div className="relative mb-4 h-24 w-24 overflow-hidden rounded-full border-4 border-slate-50 shadow-inner transition-colors duration-300 group-hover:border-rose-50">
                    <Image
                      src={user.avatarUrl || "/default-avatar.png"}
                      alt={user.fullName}
                      fill
                      sizes="96px"
                      className="object-cover"
                      unoptimized
                    />
                  </div>

                  <h3 className="w-full truncate text-center text-lg font-bold text-slate-800 transition-colors group-hover:text-rose-600">
                    {user.fullName}
                  </h3>
                  <p className="mb-4 w-full truncate text-center text-sm font-medium text-slate-500">
                    @{user.username || "hype_user"}
                  </p>
                </Link>

                <div className="mt-auto flex w-full flex-col gap-2">
                  <FriendActionButton targetUserId={uid} className="w-full" />
                  <OpenDmBubbleButton
                    peerUserId={uid}
                    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-slate-100 py-2.5 text-center text-sm font-bold text-slate-700 transition hover:bg-slate-200 active:scale-[0.98]"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                    Nhắn tin
                  </OpenDmBubbleButton>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-slate-400">
            <svg className="mb-4 h-16 w-16 text-slate-300" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <p className="text-lg font-medium text-slate-500">Không tìm thấy ai phù hợp</p>
            <p className="text-sm">Hãy thử gõ tên khác xem sao.</p>
          </div>
        )}
      </div>
    </div>
  );
}
