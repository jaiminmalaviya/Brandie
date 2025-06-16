// Import types from Prisma after migration
// import { User, Post, Follow } from '@prisma/client';

// User types
export type UserWithCounts = any & {
  _count: {
    followers: number;
    following: number;
    posts: number;
  };
};

export type UserPublic = {
  id: string;
  username: string;
  email: string;
  name?: string | null;
  bio?: string | null;
  avatar?: string | null;
  createdAt: Date;
  updatedAt: Date;
  followersCount?: number;
  followingCount?: number;
  postsCount?: number;
};

export type CreateUserInput = {
  username: string;
  email: string;
  password: string;
  name?: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

// Post types
export type Post = {
  id: string;
  text: string;
  mediaUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
  authorId: string;
};

export type PostWithAuthor = Post & {
  author: UserPublic;
};

export type CreatePostInput = {
  text: string;
  mediaUrl?: string;
};

// Follow types
export type Follow = {
  id: string;
  createdAt: Date;
  followerId: string;
  followeeId: string;
};

export type FollowWithUsers = Follow & {
  follower: UserPublic;
  followee: UserPublic;
};

// API Response types
export type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

export type PaginatedResponse<T = any> = ApiResponse<T> & {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
};

// JWT types
export type JwtPayload = {
  userId: string;
  username: string;
  email: string;
};

// Request types (for authenticated requests)
export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}
