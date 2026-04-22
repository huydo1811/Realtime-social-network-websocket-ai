"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { searchUsers } from "@/lib/api/userApi";

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
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true); 
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const data = await searchUsers(query, page, 12);
        setUsers(data.content || data || []); 
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    const delay = setTimeout(fetchUsers, 500);
    return () => clearTimeout(delay);
  }, [query, page]);

  return (
    <div className="w-full">
      <div className="relative mb-8 group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <svg className="w-5 h-5 text-slate-400 group-focus-within:text-rose-500 transition-colors" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input 
          type="text"
          placeholder="Tìm kiếm người dùng theo tên..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-white/80 backdrop-blur-sm border-2 border-transparent rounded-2xl shadow-sm text-slate-700 font-medium placeholder-slate-400 focus:outline-none focus:border-rose-100 focus:ring-4 focus:ring-rose-50 transition-all duration-300"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center p-6 bg-white rounded-2xl shadow-sm border border-slate-100 animate-pulse">
              <div className="h-20 w-20 bg-slate-200 rounded-full mb-4"></div>
              <div className="h-4 bg-slate-200 rounded-full w-3/4 mb-2"></div>
              <div className="h-3 bg-slate-200 rounded-full w-1/2 mb-6"></div>
              <div className="h-10 bg-slate-200 rounded-xl w-full"></div>
            </div>
          ))
        ) : users.length > 0 ? (

          users.map(user => (
            <div key={user.id} className="group relative flex flex-col items-center p-6 bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl hover:border-rose-100 hover:-translate-y-1 transition-all duration-300">
              
              <Link href={`/profile/${user.id}`} className="absolute inset-0 z-0 rounded-2xl" aria-label={`Trang cá nhân của ${user.fullName}`} />
              
              <div className="relative h-24 w-24 rounded-full overflow-hidden mb-4 border-4 border-slate-50 shadow-inner group-hover:border-rose-50 transition-colors duration-300">
                <Image 
                  src={user.avatarUrl || "/default-avatar.png"} 
                  alt={user.fullName} 
                  fill
                  sizes="96px"
                  className="object-cover"
                  unoptimized
                />
              </div>
              
              <h3 className="font-bold text-lg text-slate-800 text-center truncate w-full group-hover:text-rose-600 transition-colors">
                {user.fullName}
              </h3>
              <p className="text-sm font-medium text-slate-500 mb-6 truncate w-full text-center">
                @{user.username || "hype_user"}
              </p>
              
              <div className="flex gap-2 w-full z-10 mt-auto">
                <button className="cursor-pointer flex-1 bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white hover:shadow-md hover:shadow-rose-200 text-sm font-bold py-2.5 rounded-xl transition-all active:scale-95">
                  Theo dõi
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-16 flex flex-col items-center justify-center text-slate-400">
            <svg className="w-16 h-16 mb-4 text-slate-300" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
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