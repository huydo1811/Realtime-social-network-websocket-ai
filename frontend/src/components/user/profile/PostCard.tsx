"use client";

import Image from "next/image";
import { FeedPost } from "./types";

type Props = {
  post: FeedPost;
  liked: boolean;
  onToggleLike: (postId: string) => void;
  onOpen: (postId: string) => void;
};

export default function PostCard({ post, liked, onToggleLike, onOpen }: Props) {
  return (
    <article
      onClick={() => onOpen(post.id)}
      onKeyDown={(e) => { if (e.key === "Enter") onOpen(post.id); }}
      role="button"
      tabIndex={0}
      className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-slate-300"
    >
      {post.mediaUrl ? (
        <div className="mb-3 h-32 w-full overflow-hidden rounded-xl border border-slate-200">
          <Image src={post.mediaUrl} alt="post media" width={800} height={320} className="object-cover" />
        </div>
      ) : null}

      <p className="text-sm text-slate-800">{post.content}</p>
      <p className="mt-2 text-xs text-slate-500">{post.createdAt}</p>

      <div className="mt-4 flex items-center gap-2 text-xs">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onToggleLike(post.id); }}
          className={`cursor-pointer rounded-full px-3 py-1.5 ${
            liked ? "bg-rose-500 text-white" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          {liked ? "Đã thích" : "Thích"} ({post.likes})
        </button>

        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onOpen(post.id); }}
          className="cursor-pointer rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-700 hover:bg-slate-50"
        >
          Bình luận ({post.comments})
        </button>
      </div>
    </article>
  );
}