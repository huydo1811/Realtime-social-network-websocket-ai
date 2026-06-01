export type PostVisibility = "PUBLIC" | "FRIENDS" | "PRIVATE";

export type PostStatus = "PENDING" | "APPROVED" | "REJECTED" | "DELETED";

export interface PostDto {
  id: number;
  authorId: number;
  authorName?: string;
  authorAvatarUrl?: string | null;
  content: string;
  mediaUrl: string | null;
  visibility: PostVisibility;
  status: PostStatus;
  sharedPostId: number | null;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  sharedPost?: {
    id: number;
    authorId: number;
    content: string;
    mediaUrl: string | null;
    visibility: PostVisibility;
    authorName?: string;
    authorAvatarUrl?: string | null;
    likeCount: number;
    commentCount: number;
    shareCount: number;
    createdAt: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PostPage {
  content: PostDto[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface CreatePostPayload {
  content: string;
  mediaUrl?: string;
  visibility?: PostVisibility;
}

export interface UpdatePostPayload {
  content: string;
  mediaUrl?: string;
  visibility?: PostVisibility;
}

export interface PostCommentDto {
  id: number;
  postId: number;
  userId: number;
  parentCommentId: number | null;
  content: string;
  likeCount: number;
  likedByMe: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ContentReportStatus = "PENDING" | "RESOLVED" | "REJECTED";
export type ContentReportTargetType = "POST" | "COMMENT";

export interface ContentReportDto {
  id: number;
  targetType: ContentReportTargetType;
  targetId: number;
  postId?: number | null;
  reporterUserId: number;
  reason: string;
  status: ContentReportStatus;
  adminNote?: string | null;
  resolvedBy?: number | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}
