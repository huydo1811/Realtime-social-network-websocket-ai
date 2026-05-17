"use client";

import { useMemo, useState } from "react";
import PostCard from "./PostCard";
import PostComposer from "./PostComposer";
import PostDetailModal from "./PostDetailModal";
import { FeedPost } from "./types";

type Props = {
  avatarUrl: string;
  initialPosts: FeedPost[];
  onPostsChanged?: (posts: FeedPost[]) => void;
  readonly?: boolean; // THÊM PROPS NÀY ĐỂ XÁC ĐỊNH LÀ NHÀ NGƯỜI KHÁC
};

type CommentItem = {
  id: string;
  authorName: string;
  authorAvatar?: string;
  text: string;
  createdAt: string;
};

export default function ProfileFeedSection({ avatarUrl, initialPosts, onPostsChanged, readonly = false }: Props) {
  const [tab, setTab] = useState<"posts" | "media">("posts");
  const [posts, setPosts] = useState<FeedPost[]>(initialPosts);
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});
  const [commentsMap, setCommentsMap] = useState<Record<string, CommentItem[]>>({ });
  const [activePostId, setActivePostId] = useState<string | null>(null);

  const activePost = useMemo(() => posts.find((p) => p.id === activePostId) || null, [posts, activePostId]);

  function sync(next: FeedPost[]) {
    setPosts(next);
    onPostsChanged?.(next);
  }

  async function createPost(content: string) {
    if (readonly) return; // Nếu là trang người khác thì chặn luôn việc gọi hàm tạo post
    const nextPost: FeedPost = {
      id: `local-${Date.now()}`,
      content,
      likes: 0,
      comments: 0,
      createdAt: "Vừa xong",
    };
    sync([nextPost, ...posts]);
  }

  function toggleLike(postId: string) {
    const isLiked = Boolean(likedMap[postId]);
    const delta = isLiked ? -1 : 1;

    setLikedMap((prev) => ({ ...prev, [postId]: !isLiked }));
    sync(
      posts.map((p) => (p.id === postId ? { ...p, likes: Math.max(0, p.likes + delta) } : p))
    );
  }

  function addComment(postId: string, text: string) {
    const hasCrypto = typeof globalThis.crypto !== "undefined";
    const hasRandomUUID =
      hasCrypto && typeof (globalThis.crypto as { randomUUID?: () => string }).randomUUID === "function";

    const id = hasRandomUUID
      ? (globalThis.crypto as { randomUUID: () => string }).randomUUID()
      : `c-${Date.now()}`;

    const newComment: CommentItem = {
      id,
      authorName: "Bạn",
      authorAvatar: avatarUrl, // Dùng avatar của người đang đăng nhập (TODO: fetch từ context sau)
      text,
      createdAt: "Vừa xong",
    };

    setCommentsMap((prev) => ({
      ...prev,
      [postId]: [...(prev[postId] || []), newComment],
    }));

    sync(
      posts.map((p) => (p.id === postId ? { ...p, comments: p.comments + 1 } : p))
    );
  }

  return (
    <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <h3 className="text-base font-bold tracking-tight text-slate-900">Bảng tin cá nhân</h3>
        <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setTab("posts")}
          className={`cursor-pointer rounded-xl px-5 py-2.5 text-sm font-bold transition-colors ${
            tab === "posts" ? "bg-rose-500 text-white shadow-sm shadow-rose-200" : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-800"
          }`}
        >
          Bài viết
        </button>
        <button
          onClick={() => setTab("media")}
          className={`cursor-pointer rounded-xl px-5 py-2.5 text-sm font-bold transition-colors ${
            tab === "media" ? "bg-rose-500 text-white shadow-sm shadow-rose-200" : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-800"
          }`}
        >
          Ảnh
        </button>
        </div>
      </div>

      {tab === "posts" && (
        <>
          {!readonly && (
            <div className="mb-6">
              <PostComposer avatarUrl={avatarUrl} onSubmit={createPost} />
            </div>
          )}

          <div className="grid gap-5 md:grid-cols-2">
            {posts.length > 0 ? (
              posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  liked={Boolean(likedMap[post.id])}
                  onToggleLike={toggleLike}
                  onOpen={setActivePostId}
                />
              ))
            ) : (
              <div className="col-span-full py-14 flex flex-col items-center justify-center text-slate-400">
                 <svg className="w-12 h-12 mb-3 text-slate-200" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                 <p className="font-medium text-slate-500">Chưa có bài viết nào.</p>
              </div>
            )}
          </div>
        </>
      )}

      {tab === "media" && (
        <div className="grid grid-cols-3 gap-3 md:grid-cols-4">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="aspect-square rounded-2xl border border-slate-100 bg-gradient-to-br from-rose-50 to-orange-50 shadow-sm"
            />
          ))}
        </div>
      )}

      <PostDetailModal
        post={activePost}
        liked={activePost ? Boolean(likedMap[activePost.id]) : false}
        comments={activePost ? commentsMap[activePost.id] || [] : []}
        onClose={() => setActivePostId(null)}
        onToggleLike={toggleLike}
        onAddComment={addComment}
      />
    </section>
  );
}