export type FeedPost = {
  id: string;
  content: string;
  createdAt: string;
  likes: number;
  comments: number;
  mediaUrl?: string;        
  authorName?: string;     
  authorAvatar?: string;    
};

export type SocialPerson = {
  id: string;
  name: string;
  username: string;
  avatarUrl: string;
};

export type ProfileInfo = {
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
    posts: number;
    followers: number;
    following: number;
  };
  posts?: FeedPost[];
  followersList?: SocialPerson[];
  followingList?: SocialPerson[];
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