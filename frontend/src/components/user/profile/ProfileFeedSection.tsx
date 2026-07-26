"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { postApi } from "@/lib/api/postApi";
import { petApi } from "@/lib/api/petApi";
import { getAuthTokens } from "@/lib/api/authToken";
import { blockUser, listGroupFeed, toggleGroupPostLike } from "@/lib/api/friendshipApi";
import { getUserIdFromAccessToken } from "@/lib/auth/jwtSubject";
import { deleteCloudinaryByUrl, uploadToCloudinary } from "@/lib/cloudinary/upload";
import type {
  PostCommentDto,
  PostDto,
  PostVisibility,
} from "@/types/post";
import type { PetDto } from "@/types/pet";
import type { GroupPostResponse } from "@/types/friendship";

import PostCard from "./PostCard";
import PostComposer from "./PostComposer";
import PostDetailModal from "./PostDetailModal";
import SharePostModal from "./SharePostModal";
import ReportContentModal from "./ReportContentModal";
import type { FeedPost } from "./types";

type Props = {
  avatarUrl: string;
  initialPosts: FeedPost[];
  onPostsChanged?: (posts: FeedPost[]) => void;
  readonly?: boolean;
  source: "feed" | "me" | "user";
  userId?: number;
  isAdmin?: boolean;
  refreshKey?: number;
};

type CommentItem = {
  id: string;
  authorId?: number;
  authorName: string;
  authorAvatar?: string;
  text: string;
  createdAt: string;
  createdAtTs?: number;
  parentCommentId?: string;
  likeCount: number;
  likedByMe: boolean;
};

function toRelativeDate(input: string): string {
  const dt = new Date(input);
  if (Number.isNaN(dt.getTime())) return "Vừa xong";
  const diff = Date.now() - dt.getTime();
  if (diff < 60_000) return "Vừa xong";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} phút trước`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} giờ trước`;
  return `${Math.floor(diff / 86_400_000)} ngày trước`;
}

function mapComment(item: PostCommentDto): CommentItem {
  const createdAtTs = item.createdAt ? Date.parse(item.createdAt) : Number.NaN;
  return {
    id: String(item.id),
    authorId: item.userId,
    authorName: item.authorName?.trim() || `User #${item.userId}`,
    authorAvatar: item.authorAvatarUrl ?? undefined,
    text: item.content,
    createdAt: toRelativeDate(item.createdAt),
    createdAtTs: Number.isNaN(createdAtTs) ? undefined : createdAtTs,
    parentCommentId: item.parentCommentId != null ? String(item.parentCommentId) : undefined,
    likeCount: item.likeCount ?? 0,
    likedByMe: Boolean(item.likedByMe),
  };
}

function mapPostToFeed(post: PostDto): FeedPost {
  return {
    id: String(post.id),
    postId: post.id,
    source: "POST",
    sharedPostId: post.sharedPostId ?? undefined,
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
    createdAtIso: post.createdAt,
    createdAt: toRelativeDate(post.createdAt),
    likes: post.likeCount ?? 0,
    comments: post.commentCount ?? 0,
    shares: post.shareCount ?? 0,
    sharedPost: post.sharedPost
      ? {
          id: String(post.sharedPost.id),
          authorId: post.sharedPost.authorId,
          content: post.sharedPost.content,
          mediaUrl: post.sharedPost.mediaUrl ?? undefined,
          authorName: post.sharedPost.authorName ?? undefined,
          authorAvatar: post.sharedPost.authorAvatarUrl ?? undefined,
          likes: post.sharedPost.likeCount ?? 0,
          comments: post.sharedPost.commentCount ?? 0,
          shares: post.sharedPost.shareCount ?? 0,
          visibility: post.sharedPost.visibility,
          createdAt: toRelativeDate(post.sharedPost.createdAt),
        }
      : undefined,
  };
}

function mapGroupPostToFeed(post: GroupPostResponse): FeedPost {
  return {
    id: `group-${post.id}`,
    source: "GROUP_POST",
    groupId: post.groupId,
    groupName: post.groupName ?? undefined,
    authorId: post.authorUserId,
    authorName: post.authorName ?? undefined,
    authorAvatar: post.authorAvatarUrl ?? undefined,
    content: post.content,
    mediaUrl: post.mediaUrl ?? undefined,
    visibility: "PUBLIC",
    status: "APPROVED",
    createdAtIso: post.createdAt ?? undefined,
    createdAt: toRelativeDate(post.createdAt ?? ""),
    likes: post.likeCount ?? 0,
    comments: post.commentCount ?? 0,
    shares: 0,
  };
}

export default function ProfileFeedSection({
  avatarUrl,
  initialPosts,
  onPostsChanged,
  readonly = false,
  source,
  userId,
  isAdmin = false,
  refreshKey = 0,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [posts, setPosts] = useState<FeedPost[]>(initialPosts ?? []);
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});
  const [commentsMap, setCommentsMap] = useState<Record<string, CommentItem[]>>({});
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);
  const [draftByPostId, setDraftByPostId] = useState<
    Record<string, { content: string; mediaUrl?: string; visibility: PostVisibility }>
  >({});
  const [savingPostId, setSavingPostId] = useState<string | null>(null);
  const [uploadingEditMediaPostId, setUploadingEditMediaPostId] = useState<string | null>(
    null
  );
  const [openingPostId, setOpeningPostId] = useState<string | null>(null);
  const [shareModalPostId, setShareModalPostId] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [reportModal, setReportModal] = useState<{
    open: boolean;
    targetType: "POST" | "COMMENT";
    postId?: string;
    commentId?: string;
  }>({ open: false, targetType: "POST" });
  const [reporting, setReporting] = useState(false);
  const [reportResult, setReportResult] = useState<{
    open: boolean;
    title: string;
    details: string[];
  }>({ open: false, title: "", details: [] });
  const [myPets, setMyPets] = useState<PetDto[]>([]);
  const preselectedPetId = useMemo(() => {
    const raw = searchParams.get("petId");
    if (!raw) return undefined;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : undefined;
  }, [searchParams]);

  const activePost = useMemo(
    () => posts.find((p) => p.id === activePostId) || null,
    [posts, activePostId]
  );

  function syncWith(next: FeedPost[]) {
    setPosts(next);
  }

  function updatePosts(updater: (prev: FeedPost[]) => FeedPost[]) {
    setPosts((prev) => updater(prev));
  }

  useEffect(() => {
    onPostsChanged?.(posts);
  }, [posts, onPostsChanged]);

  async function hydrateLikeState(items: FeedPost[]) {
    if (!items.length) return;
    const entries = await Promise.all(
      items.map(async (p) => {
        const postNum = Number(p.id);
        if (!Number.isFinite(postNum)) return [p.id, false] as const;
        try {
          const res = await postApi.getLikeState(postNum);
          return [p.id, res.liked] as const;
        } catch {
          return [p.id, false] as const;
        }
      })
    );
    setLikedMap((prev) => ({ ...prev, ...Object.fromEntries(entries) }));
  }

  async function load(page: number, append: boolean) {
    if (append) setLoadingMore(true);
    else setLoading(true);
    setError(null);
    try {
      if (source !== "feed" && (userId == null || !Number.isFinite(userId))) {
        syncWith([]);
        setHasMore(false);
        setError("Không xác định được người dùng để tải bài viết.");
        return;
      }
      if (source === "feed") {
        const result = await postApi.getFeed(page, 10);
        const mapped = result.content.map(mapPostToFeed);
        if (!append && page === 0) {
          const groups = await listGroupFeed(20).catch(() => [] as GroupPostResponse[]);
          const groupMapped = groups.map(mapGroupPostToFeed);
          const merged = [...mapped, ...groupMapped].sort((a, b) => {
            const ta = Date.parse(a.createdAtIso || "") || 0;
            const tb = Date.parse(b.createdAtIso || "") || 0;
            return tb - ta;
          });
          syncWith(merged);
          setLikedMap((prev) => ({
            ...prev,
            ...Object.fromEntries(groups.map((g) => [`group-${g.id}`, Boolean(g.likedByMe)])),
          }));
          await hydrateLikeState(mapped);
        } else if (append) {
          updatePosts((prev) => [...prev, ...mapped]);
          await hydrateLikeState(mapped);
        } else {
          syncWith(mapped);
          await hydrateLikeState(mapped);
        }
        setCurrentPage(result.page);
        setHasMore(!result.last);
        return;
      }
      const result = await postApi.listUserPosts(userId as number, page, 10);
      const mapped = result.content.map(mapPostToFeed);
      if (append) updatePosts((prev) => [...prev, ...mapped]);
      else syncWith(mapped);
      await hydrateLikeState(mapped);
      setCurrentPage(result.page);
      setHasMore(!result.last);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể tải bài viết");
      if (!append) syncWith([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    void load(0, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, userId, refreshKey]);

  useEffect(() => {
    if (readonly || source !== "me" && source !== "feed") return;
    petApi.listMine()
      .then(setMyPets)
      .catch(() => setMyPets([]));
  }, [readonly, source, refreshKey]);

  async function createPost(payload: {
    content: string;
    mediaUrl?: string;
    visibility: PostVisibility;
    petId?: number;
  }) {
    if (readonly) return;
    const created = await postApi.create(payload);
    const mapped = mapPostToFeed(created);
    updatePosts((prev) => [mapped, ...prev]);
    const likeState = await postApi.getLikeState(created.id).catch(() => ({ liked: false }));
    setLikedMap((prev) => ({ ...prev, [mapped.id]: likeState.liked }));
  }

  function openEdit(postId: string) {
    const target = posts.find((p) => p.id === postId);
    if (!target) return;
    setDraftByPostId((prev) => ({
      ...prev,
      [postId]: {
        content: target.content,
        mediaUrl: target.mediaUrl,
        visibility: target.visibility ?? "PUBLIC",
      },
    }));
  }

  function closeEdit(postId: string) {
    setDraftByPostId((prev) => {
      const next = { ...prev };
      delete next[postId];
      return next;
    });
  }

  async function saveEdit(postId: string) {
    const postNum = Number(postId);
    if (!Number.isFinite(postNum)) return;
    const draft = draftByPostId[postId];
    const hasMedia = Boolean(draft.mediaUrl?.trim());
    if (!hasMedia && !draft.content.trim()) return;
    const previous = posts.find((p) => p.id === postId);
    const previousMediaUrl = previous?.mediaUrl;
    setSavingPostId(postId);
    try {
      const updated = await postApi.update(postNum, draft);
      updatePosts((prev) =>
        prev.map((p) => (p.id === postId ? mapPostToFeed(updated) : p))
      );
      if (
        previousMediaUrl &&
        previousMediaUrl !== (draft.mediaUrl?.trim() || undefined)
      ) {
        await deleteCloudinaryByUrl(previousMediaUrl);
      }
      closeEdit(postId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể cập nhật bài viết");
    } finally {
      setSavingPostId(null);
    }
  }

  async function uploadEditMedia(postId: string, file?: File) {
    if (!file) return;
    setUploadingEditMediaPostId(postId);
    setError(null);
    try {
      const uploaded = await uploadToCloudinary(file);
      setDraftByPostId((prev) => ({
        ...prev,
        [postId]: {
          ...prev[postId],
          mediaUrl: uploaded.secureUrl,
        },
      }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể tải ảnh/video lên Cloudinary");
    } finally {
      setUploadingEditMediaPostId(null);
    }
  }

  async function deletePost(postId: string) {
    const postNum = Number(postId);
    if (!Number.isFinite(postNum)) return;
    setActionBusyId(postId);
    try {
      await postApi.remove(postNum);
      updatePosts((prev) => prev.filter((p) => p.id !== postId));
      if (activePostId === postId) setActivePostId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể xóa bài viết");
    } finally {
      setActionBusyId(null);
    }
  }

  async function hidePostByAdmin(postId: string) {
    const postNum = Number(postId);
    if (!Number.isFinite(postNum)) return;
    setActionBusyId(postId);
    try {
      const updated = await postApi.adminHide(postNum);
      updatePosts((prev) =>
        prev.map((p) => (p.id === postId ? mapPostToFeed(updated) : p))
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể ẩn bài viết");
    } finally {
      setActionBusyId(null);
    }
  }

  const actorId = (() => {
    const token = getAuthTokens()?.accessToken;
    return token ? getUserIdFromAccessToken(token) : null;
  })();

  const canManagePost = (post: FeedPost) =>
    !readonly && actorId != null && post.authorId === actorId;

  async function loadMore() {
    if (!hasMore || loadingMore) return;
    await load(currentPage + 1, true);
  }

  async function openPostDetail(postId: string) {
    const target = posts.find((p) => p.id === postId);
    if (target?.source === "GROUP_POST" && target.groupId) {
      router.push(`/groups/${target.groupId}`);
      return;
    }
    setOpeningPostId(postId);
    setActivePostId(postId);
    const postNum = Number(postId);
    if (!Number.isFinite(postNum)) {
      setOpeningPostId(null);
      return;
    }
    try {
      const [fresh, comments] = await Promise.all([
        postApi.getById(postNum),
        postApi.listComments(postNum),
      ]);
      const resolvedId = String(fresh.id);
      const mappedFresh = mapPostToFeed(fresh);
      updatePosts((prev) =>
        prev.some((p) => p.id === resolvedId)
          ? prev.map((p) => (p.id === resolvedId ? mappedFresh : p))
          : [mappedFresh, ...prev]
      );
      setCommentsMap((prev) => ({ ...prev, [resolvedId]: comments.map(mapComment) }));
      const likeState = await postApi.getLikeState(postNum);
      setLikedMap((prev) => ({ ...prev, [resolvedId]: likeState.liked }));
      setActivePostId(resolvedId);
    } catch {
      // keep modal usable
    } finally {
      setOpeningPostId(null);
    }
  }

  function openAuthorProfile(authorId?: number) {
    if (!authorId || !Number.isFinite(authorId)) return;
    if (source === "me" && pathname === "/profile") return;
    if (source === "user" && userId === authorId) return;
    const targetPath = actorId === authorId ? "/profile" : `/profile/${authorId}`;
    if (pathname === targetPath) return;
    router.push(targetPath);
  }

  function openPetProfile(petId?: number) {
    if (!petId || !Number.isFinite(petId)) return;
    const targetPath = `/pets/${petId}`;
    if (pathname === targetPath) return;
    router.push(targetPath);
  }

  async function toggleLike(postId: string) {
    const target = posts.find((p) => p.id === postId);
    if (target?.source === "GROUP_POST") {
      if (!target.groupId) return;
      const numericId = Number(String(postId).replace(/^group-/, ""));
      if (!Number.isFinite(numericId)) return;
      const oldLiked = Boolean(likedMap[postId]);
      const oldLikes = target.likes ?? 0;
      setLikedMap((prev) => ({ ...prev, [postId]: !oldLiked }));
      updatePosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, likes: Math.max(0, p.likes + (oldLiked ? -1 : 1)) } : p
        )
      );
      try {
        const likeRes = await toggleGroupPostLike(target.groupId, numericId);
        setLikedMap((prev) => ({ ...prev, [postId]: likeRes.liked }));
        updatePosts((prev) =>
          prev.map((p) => (p.id === postId ? { ...p, likes: likeRes.likeCount } : p))
        );
      } catch (e) {
        setLikedMap((prev) => ({ ...prev, [postId]: oldLiked }));
        updatePosts((prev) =>
          prev.map((p) => (p.id === postId ? { ...p, likes: oldLikes } : p))
        );
        setError(e instanceof Error ? e.message : "Không thể thích bài viết nhóm");
      }
      return;
    }
    const postNum = Number(postId);
    if (!Number.isFinite(postNum)) return;
    const oldLiked = Boolean(likedMap[postId]);
    const oldLikes = posts.find((p) => p.id === postId)?.likes ?? 0;
    const optimisticLiked = !oldLiked;
    setLikedMap((prev) => ({ ...prev, [postId]: !oldLiked }));
    updatePosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, likes: Math.max(0, p.likes + (oldLiked ? -1 : 1)) }
          : p
      )
    );
    try {
      const likeRes = await postApi.toggleLike(postNum);
      setLikedMap((prev) => ({ ...prev, [postId]: optimisticLiked }));
      updatePosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, likes: likeRes.likeCount } : p))
      );

      // Sync thật từ server theo thứ tự, tránh race condition với request toggle.
      void postApi.getLikeState(postNum).then((stateRes) => {
        setLikedMap((prev) => ({ ...prev, [postId]: stateRes.liked }));
      }).catch(() => undefined);
    } catch (e) {
      setLikedMap((prev) => ({ ...prev, [postId]: oldLiked }));
      updatePosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, likes: oldLikes } : p))
      );
      setError(e instanceof Error ? e.message : "Không thể thích bài viết");
    }
  }

  async function addComment(postId: string, text: string) {
    const target = posts.find((p) => p.id === postId);
    if (target?.source === "GROUP_POST") return;
    const postNum = Number(postId);
    if (!Number.isFinite(postNum)) return;
    try {
      const created = await postApi.createComment(postNum, text);
      const mapped = mapComment(created);
      setCommentsMap((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), mapped],
      }));
      updatePosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, comments: p.comments + 1 } : p
        )
      );
    } catch (e) {
      throw new Error(e instanceof Error ? e.message : "Không thể bình luận");
    }
  }

  async function toggleCommentLike(postId: string, commentId: string) {
    const postNum = Number(postId);
    const commentNum = Number(commentId);
    if (!Number.isFinite(postNum) || !Number.isFinite(commentNum)) return;

    const list = commentsMap[postId] || [];
    const target = list.find((c) => c.id === commentId);
    if (!target) return;
    const prevLiked = target.likedByMe;
    const prevCount = target.likeCount;
    const optimisticLiked = !prevLiked;

    setCommentsMap((prev) => ({
      ...prev,
      [postId]: (prev[postId] || []).map((c) =>
        c.id === commentId
          ? {
              ...c,
              likedByMe: !prevLiked,
              likeCount: Math.max(0, c.likeCount + (prevLiked ? -1 : 1)),
            }
          : c
      ),
    }));

    try {
      const countRes = await postApi.toggleCommentLike(postNum, commentNum);
      setCommentsMap((prev) => ({
        ...prev,
        [postId]: (prev[postId] || []).map((c) =>
          c.id === commentId
            ? { ...c, likeCount: countRes.likeCount, likedByMe: optimisticLiked }
            : c
        ),
      }));

      void postApi
        .getCommentLikeState(postNum, commentNum)
        .then((stateRes) => {
          setCommentsMap((prev) => ({
            ...prev,
            [postId]: (prev[postId] || []).map((c) =>
              c.id === commentId ? { ...c, likedByMe: stateRes.liked } : c
            ),
          }));
        })
        .catch(() => undefined);
    } catch (e) {
      setCommentsMap((prev) => ({
        ...prev,
        [postId]: (prev[postId] || []).map((c) =>
          c.id === commentId
            ? { ...c, likeCount: prevCount, likedByMe: prevLiked }
            : c
        ),
      }));
      setError(e instanceof Error ? e.message : "Không thể thích bình luận");
    }
  }

  async function addReply(postId: string, parentCommentId: string, text: string) {
    const postNum = Number(postId);
    const parentNum = Number(parentCommentId);
    if (!Number.isFinite(postNum) || !Number.isFinite(parentNum)) return;
    try {
      const reply = await postApi.createReply(postNum, parentNum, text);
      const mapped = mapComment(reply);
      setCommentsMap((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), mapped],
      }));
      updatePosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, comments: p.comments + 1 } : p))
      );
    } catch (e) {
      throw new Error(e instanceof Error ? e.message : "Không thể trả lời bình luận");
    }
  }

  async function sharePost(postId: string, payload?: { content?: string; visibility?: "PUBLIC" | "FRIENDS" | "PRIVATE" }) {
    const target = posts.find((p) => p.id === postId);
    if (target?.source === "GROUP_POST") return;
    const postNum = Number(postId);
    if (!Number.isFinite(postNum)) return;
    try {
      const shared = await postApi.share(postNum, payload ?? { visibility: "PUBLIC" });
      updatePosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, shares: (p.shares ?? 0) + 1 } : p
        )
      );
      if (source === "feed" || source === "me") {
        updatePosts((prev) => [mapPostToFeed(shared), ...prev]);
      }
      setShareModalPostId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể chia sẻ bài viết");
    }
  }

  async function submitShare(payload: {
    postId: string;
    content?: string;
    visibility: "PUBLIC" | "FRIENDS" | "PRIVATE";
  }) {
    setSharing(true);
    try {
      await sharePost(payload.postId, {
        content: payload.content,
        visibility: payload.visibility,
      });
    } finally {
      setSharing(false);
    }
  }

  function openPostReportModal(postId: string) {
    const targetPost = posts.find((p) => p.id === postId);
    if (actorId != null && targetPost?.authorId != null && targetPost.authorId === actorId) {
      setError("Không thể báo cáo bài viết của chính bạn.");
      return;
    }
    setReportModal({ open: true, targetType: "POST", postId });
  }

  function openCommentReportModal(postId: string, commentId?: string) {
    const targetCommentId = commentId ?? commentsMap[postId]?.find((c) => !c.parentCommentId)?.id;
    if (!targetCommentId) {
      setError("Bài viết chưa có bình luận để báo cáo.");
      return;
    }
    const targetComment = (commentsMap[postId] || []).find((c) => c.id === targetCommentId);
    if (actorId != null && targetComment?.authorId != null && targetComment.authorId === actorId) {
      setError("Không thể báo cáo bình luận của chính bạn.");
      return;
    }
    setReportModal({
      open: true,
      targetType: "COMMENT",
      postId,
      commentId: targetCommentId,
    });
  }

  async function submitReport(payload: {
    reason: string;
    hideForMe: boolean;
    blockUser: boolean;
  }) {
    if (!reportModal.open) return;
    setReporting(true);
    try {
      const details: string[] = [];
      const targetPost = reportModal.postId
        ? posts.find((p) => p.id === reportModal.postId)
        : undefined;
      const targetAuthorId = targetPost?.authorId;
      if (reportModal.targetType === "POST") {
        const postNum = Number(reportModal.postId);
        if (!Number.isFinite(postNum)) return;
        await postApi.reportPost(postNum, payload.reason);
        details.push("Đã gửi báo cáo bài viết thành công.");
        if (payload.hideForMe && reportModal.postId) {
          await postApi.hideForMe(postNum).catch(() => undefined);
          updatePosts((prev) => prev.filter((p) => p.id !== reportModal.postId));
          details.push("Nội dung đã được ẩn khỏi feed của bạn.");
        }
      } else {
        const commentNum = Number(reportModal.commentId);
        if (!Number.isFinite(commentNum)) return;
        const targetComment = reportModal.postId
          ? (commentsMap[reportModal.postId] || []).find((c) => c.id === reportModal.commentId)
          : undefined;
        if (actorId != null && targetComment?.authorId != null && targetComment.authorId === actorId) {
          setError("Không thể báo cáo bình luận của chính bạn.");
          return;
        }
        await postApi.reportComment(commentNum, payload.reason);
        details.push("Đã gửi báo cáo bình luận thành công.");
        if (payload.hideForMe && reportModal.postId && reportModal.commentId) {
          setCommentsMap((prev) => ({
            ...prev,
            [reportModal.postId!]: (prev[reportModal.postId!] || []).filter(
              (c) => c.id !== reportModal.commentId
            ),
          }));
          details.push("Bình luận đã được ẩn khỏi giao diện của bạn.");
        }
      }

      if (payload.blockUser && targetAuthorId != null && actorId != null && targetAuthorId !== actorId) {
        try {
          await blockUser(targetAuthorId);
          details.push("Đã chặn người dùng vi phạm.");
        } catch {
          details.push("Không thể chặn người dùng ngay lúc này.");
        }
      }
      setReportModal({ open: false, targetType: "POST" });
      setReportResult({
        open: true,
        title: "Báo cáo đã được gửi",
        details,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể gửi báo cáo");
    } finally {
      setReporting(false);
    }
  }

  return (
    <section className="mx-auto mb-8 w-full max-w-3xl space-y-4">
      {!readonly && (
        <div>
          <PostComposer avatarUrl={avatarUrl} pets={myPets} onSubmit={createPost} initialPetId={preselectedPetId} />
        </div>
      )}

      <div className="space-y-4">
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white py-14 text-center text-slate-500">
            Đang tải bài viết...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {error}
          </div>
        ) : posts.length > 0 ? (
          posts.map((post) => (
            <div key={post.id} className="space-y-2">
              <PostCard
                post={post}
                liked={Boolean(likedMap[post.id])}
                onToggleLike={(id) => void toggleLike(id)}
                onOpen={(id) => void openPostDetail(id)}
                onOpenAuthorProfile={openAuthorProfile}
                onOpenPetProfile={openPetProfile}
                onReportPost={actorId != null && post.authorId === actorId ? undefined : (id) => openPostReportModal(id)}
                canManage={canManagePost(post)}
                canAdminHide={isAdmin && post.status !== "DELETED" && post.status !== "REJECTED"}
                onEdit={openEdit}
                onDelete={(id) => void deletePost(id)}
                onAdminHide={(id) => void hidePostByAdmin(id)}
                onShare={(id) => setShareModalPostId(id)}
                actionBusy={actionBusyId === post.id}
              />
              {openingPostId === post.id ? (
                <p className="px-1 text-xs text-slate-400">Đang đồng bộ chi tiết bài viết...</p>
              ) : null}
              {draftByPostId[post.id] ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                  <textarea
                    value={draftByPostId[post.id].content}
                    onChange={(e) =>
                      setDraftByPostId((prev) => ({
                        ...prev,
                        [post.id]: {
                          ...prev[post.id],
                          content: e.target.value,
                        },
                      }))
                    }
                    className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-rose-100"
                    rows={4}
                  />
                  <div className="mt-2 rounded-xl border border-slate-200 px-3 py-2">
                    <p className="truncate text-xs text-slate-600">
                      {draftByPostId[post.id].mediaUrl
                        ? "Đã chọn media từ Cloudinary"
                        : "Chưa có ảnh/video"}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        id={`edit-media-${post.id}`}
                        type="file"
                        accept="image/*,video/*"
                        className="hidden"
                        onChange={(e) =>
                          void uploadEditMedia(post.id, e.target.files?.[0])
                        }
                      />
                      <label
                        htmlFor={`edit-media-${post.id}`}
                        className="cursor-pointer rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        {uploadingEditMediaPostId === post.id
                          ? "Đang tải..."
                          : "Chọn ảnh/video"}
                      </label>
                      {draftByPostId[post.id].mediaUrl ? (
                        <button
                          type="button"
                          onClick={() =>
                            setDraftByPostId((prev) => ({
                              ...prev,
                              [post.id]: {
                                ...prev[post.id],
                                mediaUrl: undefined,
                              },
                            }))
                          }
                          className="cursor-pointer rounded-full border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
                        >
                          Gỡ media
                        </button>
                      ) : null}
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <select
                      value={draftByPostId[post.id].visibility}
                      onChange={(e) =>
                        setDraftByPostId((prev) => ({
                          ...prev,
                          [post.id]: {
                            ...prev[post.id],
                            visibility: e.target.value as PostVisibility,
                          },
                        }))
                      }
                      className="rounded-full border border-slate-200 px-3 py-1.5 text-xs"
                    >
                      <option value="PUBLIC">Công khai</option>
                      <option value="FRIENDS">Bạn bè</option>
                      <option value="PRIVATE">Riêng tư</option>
                    </select>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => closeEdit(post.id)}
                        className="cursor-pointer rounded-full border border-slate-200 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                      >
                        Hủy
                      </button>
                      <button
                        type="button"
                        onClick={() => void saveEdit(post.id)}
                        disabled={
                          savingPostId === post.id ||
                          (!draftByPostId[post.id].mediaUrl?.trim() &&
                            !draftByPostId[post.id].content.trim())
                        }
                        className="cursor-pointer rounded-full bg-rose-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-600 disabled:opacity-60"
                      >
                        {savingPostId === post.id ? "Đang lưu..." : "Lưu"}
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          ))
        ) : (
          <div className="py-14 flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400">
            <svg className="mb-3 h-12 w-12 text-slate-200" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <p className="font-medium text-slate-500">
              {source === "feed"
                ? "Feed đang trống. Hãy theo dõi thêm người dùng hoặc kết bạn để xem bài viết phù hợp hơn."
                : "Chưa có bài viết nào."}
            </p>
          </div>
        )}
      </div>

      {!loading && !error && hasMore ? (
        <div className="mt-5 flex justify-center">
          <button
            type="button"
            onClick={() => void loadMore()}
            disabled={loadingMore}
            className="cursor-pointer rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            {loadingMore ? "Đang tải..." : "Xem thêm"}
          </button>
        </div>
      ) : null}

      <PostDetailModal
        post={activePost}
        actorId={actorId}
        liked={activePost ? Boolean(likedMap[activePost.id]) : false}
        comments={activePost ? commentsMap[activePost.id] || [] : []}
        onOpenAuthorProfile={openAuthorProfile}
        onReportPost={(id) => openPostReportModal(id)}
        onReportComment={(id, commentId) => openCommentReportModal(id, commentId)}
        onClose={() => setActivePostId(null)}
        onToggleLike={(id) => void toggleLike(id)}
        onAddComment={(id, text) => addComment(id, text)}
        onToggleCommentLike={(postId, commentId) =>
          void toggleCommentLike(postId, commentId)
        }
        onAddReply={(postId, parentCommentId, text) => addReply(postId, parentCommentId, text)}
      />

      <SharePostModal
        open={Boolean(shareModalPostId)}
        post={posts.find((p) => p.id === shareModalPostId) || null}
        submitting={sharing}
        onClose={() => setShareModalPostId(null)}
        onSubmit={(payload) => void submitShare(payload)}
      />

      <ReportContentModal
        open={reportModal.open}
        targetType={reportModal.targetType}
        submitting={reporting}
        onClose={() => setReportModal({ open: false, targetType: "POST" })}
        onSubmit={(payload) => void submitReport(payload)}
      />

      {reportResult.open ? (
        <div
          className="fixed inset-0 z-[72] flex items-center justify-center bg-slate-900/45 p-4"
          onClick={() => setReportResult({ open: false, title: "", details: [] })}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl"
          >
            <h3 className="text-lg font-bold text-slate-900">{reportResult.title}</h3>
            <ul className="mt-3 space-y-1 text-sm text-slate-600">
              {reportResult.details.map((item, idx) => (
                <li key={`${item}-${idx}`}>{item}</li>
              ))}
            </ul>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setReportResult({ open: false, title: "", details: [] })}
                className="cursor-pointer rounded-xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-600"
              >
                Dong
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
