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
};

type CommentItem = {
  id: string;
  authorName: string;
  authorAvatar?: string;
  text: string;
  createdAt: string;
};

export default function ProfileFeedSection({ avatarUrl, initialPosts, onPostsChanged }: Props) {
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
      authorAvatar: avatarUrl,
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
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
      <div className="mb-4 flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setTab("posts")}
          className={`cursor-pointer rounded-full px-4 py-2 text-sm font-semibold ${
            tab === "posts" ? "bg-rose-500 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          Bài viết
        </button>
        <button
          onClick={() => setTab("media")}
          className={`cursor-pointer rounded-full px-4 py-2 text-sm font-semibold ${
            tab === "media" ? "bg-rose-500 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          Media
        </button>
      </div>

      {tab === "posts" && (
        <>
          <PostComposer avatarUrl={avatarUrl} onSubmit={createPost} />

          <div className="grid gap-4 md:grid-cols-2">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                liked={Boolean(likedMap[post.id])}
                onToggleLike={toggleLike}
                onOpen={setActivePostId}
              />
            ))}
          </div>
        </>
      )}

      {tab === "media" && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div
              key={n}
              className="aspect-square rounded-2xl border border-slate-200 bg-gradient-to-br from-rose-100 to-orange-100"
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