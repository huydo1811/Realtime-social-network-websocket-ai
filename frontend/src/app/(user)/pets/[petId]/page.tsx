"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import UserLayout from "@/components/layout/UserLayout";
import PostCard from "@/components/user/profile/PostCard";
import type { FeedPost } from "@/components/user/profile/types";
import { petApi } from "@/lib/api/petApi";
import { postApi } from "@/lib/api/postApi";
import { getAuthTokens, clearAuthTokens } from "@/lib/api/authToken";
import type { PostDto } from "@/types/post";
import type { PetDto } from "@/types/pet";

function toRelativeDate(input: string): string {
  const dt = new Date(input);
  if (Number.isNaN(dt.getTime())) return "Vừa xong";
  const diff = Date.now() - dt.getTime();
  if (diff < 60_000) return "Vừa xong";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} phút trước`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} giờ trước`;
  return `${Math.floor(diff / 86_400_000)} ngày trước`;
}

function mapPostToFeed(post: PostDto): FeedPost {
  return {
    id: String(post.id),
    postId: post.id,
    authorId: post.authorId,
    authorName: post.authorName ?? undefined,
    authorAvatar: post.authorAvatarUrl ?? undefined,
    petId: post.petId ?? undefined,
    petName: post.petName ?? undefined,
    petAvatar: post.petAvatarUrl ?? undefined,
    content: post.content,
    mediaUrl: post.mediaUrl ?? undefined,
    visibility: post.visibility,
    status: post.status,
    createdAt: toRelativeDate(post.createdAt),
    likes: post.likeCount ?? 0,
    comments: post.commentCount ?? 0,
    shares: post.shareCount ?? 0,
  };
}

export default function PetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const petId = Number(params?.petId);

  const [pet, setPet] = useState<PetDto | null>(null);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!Number.isFinite(petId)) {
      setError("Hồ sơ không hợp lệ");
      setLoading(false);
      return;
    }
    const tokens = getAuthTokens();
    if (!tokens?.accessToken) {
      router.replace("/login");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [petData, postPage] = await Promise.all([
        petApi.getById(petId),
        postApi.listPetPosts(petId, 0, 20),
      ]);
      setPet(petData);
      setPosts(postPage.content.map(mapPostToFeed));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Không thể tải hồ sơ thú cưng";
      if (msg.toLowerCase().includes("unauthorized")) {
        clearAuthTokens();
        router.replace("/login");
        return;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [petId, router]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <UserLayout>
      <div className="mx-auto max-w-3xl px-4 py-6">
        <Link href="/pets" className="mb-4 inline-block text-sm font-medium text-rose-600 hover:underline">
          ← Quay lại danh sách
        </Link>

        {loading ? (
          <p className="text-sm text-slate-500">Đang tải...</p>
        ) : error ? (
          <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : pet ? (
          <>
            <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-start gap-4 p-5">
                {pet.avatarUrl ? (
                  <Image
                    src={pet.avatarUrl}
                    alt={pet.name}
                    width={80}
                    height={80}
                    className="h-20 w-20 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-rose-100 text-2xl font-bold text-rose-600">
                    {pet.name[0]?.toUpperCase() ?? "P"}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h1 className="text-2xl font-bold text-slate-900">{pet.name}</h1>
                  <p className="mt-1 text-sm text-slate-500">
                    {[pet.species, pet.breed, pet.gender !== "UNKNOWN" ? pet.gender : null]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  {pet.bio ? <p className="mt-3 text-sm text-slate-700">{pet.bio}</p> : null}
                  {pet.ownerName ? (
                    <p className="mt-2 text-xs text-slate-500">Chủ nuôi: {pet.ownerName}</p>
                  ) : null}
                </div>
              </div>
            </div>

            <h2 className="mb-4 text-lg font-semibold text-slate-900">Bài viết</h2>
            {posts.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-500">
                Chưa có bài viết nào gắn với thú cưng này.
              </p>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    liked={false}
                    onToggleLike={() => {}}
                    onOpen={() => {}}
                  />
                ))}
              </div>
            )}
          </>
        ) : null}
      </div>
    </UserLayout>
  );
}
