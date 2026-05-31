import type { PostStatus, PostVisibility } from "@/types/post";

export type FeedPost = {
  id: string;
  postId?: number;
  sharedPostId?: number;
  authorId?: number;
  content: string;
  createdAt: string;
  likes: number;
  comments: number;
  shares?: number;
  sharedPost?: {
    id: string;
    authorId: number;
    content: string;
    mediaUrl?: string;
    authorName?: string;
    authorAvatar?: string;
    likes: number;
    comments: number;
    shares: number;
    visibility?: PostVisibility;
    createdAt: string;
  };
  mediaUrl?: string;
  authorName?: string;
  authorAvatar?: string;
  visibility?: PostVisibility;
  status?: PostStatus;
};

export type SocialPerson = {
  id: string;
  name: string;
  username: string;
  avatarUrl: string;
};

export type ProfileInfo = {
  id?: number;
  fullName: string;
  username: string;
  email: string;
  phone: string;
  bio?: string;
  avatarUrl?: string;
  coverUrl?: string;
  role: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  location?: string;
  website?: string;
  stats?: {
    posts?: number;
    friendsCount?: number;
  };
  posts?: FeedPost[];
};

export const sampleFeedPosts = [
  {
    id: "1",
    content: "Chỉ chữ, không ảnh",
    createdAt: "Hôm nay",
    likes: 2,
    comments: 0,
  },
  {
    id: "2",
    content: "Ảnh đẹp nè",
    createdAt: "Hôm nay",
    likes: 5,
    comments: 1,
    mediaUrl: "/images/sample.jpg",
    authorName: "Ngọc",
    authorAvatar: "/avatars/ngoc.jpg",
  },
];