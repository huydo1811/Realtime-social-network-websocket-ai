import { API_URL, apiAuthFetch } from "@/lib/api/userApi";
import type {
  CreatePostPayload,
  PostCommentDto,
  PostDto,
  PostPage,
  UpdatePostPayload,
} from "@/types/post";

type BackendPage<T> = {
  content?: T[];
  number?: number;
  size?: number;
  totalElements?: number;
  totalPages?: number;
  last?: boolean;
};

type BackendError = {
  message?: string;
  error?: string;
};

async function parseError(
  res: Response,
  fallback: string
): Promise<Error> {
  try {
    const data = (await res.json()) as BackendError;
    if (data.message?.trim()) return new Error(data.message.trim());
    if (data.error?.trim()) return new Error(data.error.trim());
  } catch {
    // ignore parse failure
  }
  return new Error(fallback);
}

function normalizeText(input?: string): string | undefined {
  const value = input?.trim();
  return value ? value : undefined;
}

function mapPage(raw: BackendPage<PostDto>): PostPage {
  const content = Array.isArray(raw.content) ? raw.content : [];
  const size = Number.isFinite(raw.size) ? Number(raw.size) : 20;
  const page = Number.isFinite(raw.number) ? Number(raw.number) : 0;
  const totalElements = Number.isFinite(raw.totalElements)
    ? Number(raw.totalElements)
    : content.length;
  const totalPages = Number.isFinite(raw.totalPages)
    ? Number(raw.totalPages)
    : totalElements > 0
      ? Math.ceil(totalElements / Math.max(1, size))
      : 0;
  const last = typeof raw.last === "boolean" ? raw.last : true;

  return {
    content,
    page,
    size,
    totalElements,
    totalPages,
    last,
  };
}

export const postApi = {
  async create(payload: CreatePostPayload): Promise<PostDto> {
    const res = await apiAuthFetch(`${API_URL}/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: payload.content,
        mediaUrl: normalizeText(payload.mediaUrl),
        visibility: payload.visibility ?? "PUBLIC",
      }),
    });
    if (!res.ok) throw await parseError(res, "Không thể tạo bài viết");
    return (await res.json()) as PostDto;
  },

  async updateVisibility(
    postId: number,
    visibility: "PUBLIC" | "FRIENDS" | "PRIVATE"
  ): Promise<PostDto> {
    const res = await apiAuthFetch(`${API_URL}/posts/${postId}/visibility`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visibility }),
    });
    if (!res.ok) throw await parseError(res, "Không thể cập nhật quyền xem bài viết");
    return (await res.json()) as PostDto;
  },

  async update(postId: number, payload: UpdatePostPayload): Promise<PostDto> {
    const res = await apiAuthFetch(`${API_URL}/posts/${postId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: payload.content,
        mediaUrl: normalizeText(payload.mediaUrl),
        visibility: payload.visibility ?? "PUBLIC",
      }),
    });
    if (!res.ok) throw await parseError(res, "Không thể cập nhật bài viết");
    return (await res.json()) as PostDto;
  },

  async remove(postId: number): Promise<void> {
    const res = await apiAuthFetch(`${API_URL}/posts/${postId}`, {
      method: "DELETE",
    });
    if (!res.ok) throw await parseError(res, "Không thể xóa bài viết");
  },

  async getById(postId: number): Promise<PostDto> {
    const res = await apiAuthFetch(`${API_URL}/posts/${postId}`);
    if (!res.ok) throw await parseError(res, "Không thể tải bài viết");
    return (await res.json()) as PostDto;
  },

  async getFeed(page = 0, size = 10): Promise<PostPage> {
    const query = new URLSearchParams({
      page: String(Math.max(0, page)),
      size: String(Math.min(Math.max(size, 1), 100)),
    });
    const res = await apiAuthFetch(`${API_URL}/posts/feed?${query.toString()}`);
    if (!res.ok) throw await parseError(res, "Không thể tải bảng tin");
    const data = (await res.json()) as BackendPage<PostDto>;
    return mapPage(data);
  },

  async listAllUserPosts(userId: number): Promise<PostDto[]> {
    const all: PostDto[] = [];
    let page = 0;
    let last = false;
    while (!last) {
      const chunk = await postApi.listUserPosts(userId, page, 50);
      all.push(...chunk.content);
      last = chunk.last;
      page += 1;
      if (page > 200) break;
    }
    return all;
  },

  async listUserPosts(userId: number, page = 0, size = 10): Promise<PostPage> {
    const query = new URLSearchParams({
      page: String(Math.max(0, page)),
      size: String(Math.min(Math.max(size, 1), 100)),
    });
    const res = await apiAuthFetch(
      `${API_URL}/posts/users/${userId}?${query.toString()}`
    );
    if (!res.ok)
      throw await parseError(res, "Không thể tải bài viết của người dùng");
    const data = (await res.json()) as BackendPage<PostDto>;
    return mapPage(data);
  },

  async adminHide(postId: number): Promise<PostDto> {
    const res = await apiAuthFetch(`${API_URL}/posts/admin/${postId}/hide`, {
      method: "POST",
    });
    if (!res.ok) throw await parseError(res, "Không thể ẩn bài viết");
    return (await res.json()) as PostDto;
  },

  async adminUnhide(postId: number): Promise<PostDto> {
    const res = await apiAuthFetch(`${API_URL}/posts/admin/${postId}/unhide`, {
      method: "POST",
    });
    if (!res.ok) throw await parseError(res, "Không thể bật lại bài viết");
    return (await res.json()) as PostDto;
  },

  async toggleLike(postId: number): Promise<{ likeCount: number }> {
    const res = await apiAuthFetch(`${API_URL}/posts/${postId}/like`, {
      method: "POST",
    });
    if (!res.ok) throw await parseError(res, "Không thể thích bài viết");
    return (await res.json()) as { likeCount: number };
  },

  async getLikeState(postId: number): Promise<{ liked: boolean }> {
    const res = await apiAuthFetch(`${API_URL}/posts/${postId}/like`);
    if (!res.ok) throw await parseError(res, "Không thể lấy trạng thái thích");
    return (await res.json()) as { liked: boolean };
  },

  async createComment(postId: number, content: string): Promise<PostCommentDto> {
    const res = await apiAuthFetch(`${API_URL}/posts/${postId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    if (!res.ok) throw await parseError(res, "Không thể bình luận");
    return (await res.json()) as PostCommentDto;
  },

  async listComments(postId: number): Promise<PostCommentDto[]> {
    const res = await apiAuthFetch(`${API_URL}/posts/${postId}/comments`);
    if (!res.ok) throw await parseError(res, "Không thể tải bình luận");
    return (await res.json()) as PostCommentDto[];
  },

  async toggleCommentLike(postId: number, commentId: number): Promise<{ likeCount: number }> {
    const res = await apiAuthFetch(`${API_URL}/posts/${postId}/comments/${commentId}/like`, {
      method: "POST",
    });
    if (!res.ok) throw await parseError(res, "Không thể thích bình luận");
    return (await res.json()) as { likeCount: number };
  },

  async getCommentLikeState(postId: number, commentId: number): Promise<{ liked: boolean }> {
    const res = await apiAuthFetch(`${API_URL}/posts/${postId}/comments/${commentId}/like`);
    if (!res.ok) throw await parseError(res, "Không thể lấy trạng thái thích bình luận");
    return (await res.json()) as { liked: boolean };
  },

  async createReply(postId: number, commentId: number, content: string): Promise<PostCommentDto> {
    const res = await apiAuthFetch(`${API_URL}/posts/${postId}/comments/${commentId}/replies`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    if (!res.ok) throw await parseError(res, "Không thể phản hồi bình luận");
    return (await res.json()) as PostCommentDto;
  },

  async share(postId: number, payload?: { content?: string; visibility?: "PUBLIC" | "FRIENDS" | "PRIVATE" }): Promise<PostDto> {
    const res = await apiAuthFetch(`${API_URL}/posts/${postId}/share`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: normalizeText(payload?.content),
        visibility: payload?.visibility ?? "PUBLIC",
      }),
    });
    if (!res.ok) throw await parseError(res, "Không thể chia sẻ bài viết");
    return (await res.json()) as PostDto;
  },
};
