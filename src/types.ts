import { Follow, Post, Prisma, User } from "@prisma/client";

// Re-export Prisma generated types
export type { Follow, Post, User };

// User types
export type UserCreateInput = Prisma.UserCreateInput;
export type UserUpdateInput = Prisma.UserUpdateInput;
export type UserWhereInput = Prisma.UserWhereInput;
export type UserWhereUniqueInput = Prisma.UserWhereUniqueInput;
export type UserSelect = Prisma.UserSelect;
export type UserInclude = Prisma.UserInclude;

// Post types
export type PostCreateInput = Prisma.PostCreateInput;
export type PostUpdateInput = Prisma.PostUpdateInput;
export type PostWhereInput = Prisma.PostWhereInput;
export type PostWhereUniqueInput = Prisma.PostWhereUniqueInput;
export type PostSelect = Prisma.PostSelect;
export type PostInclude = Prisma.PostInclude;

// Follow types
export type FollowCreateInput = Prisma.FollowCreateInput;
export type FollowUpdateInput = Prisma.FollowUpdateInput;
export type FollowWhereInput = Prisma.FollowWhereInput;
export type FollowWhereUniqueInput = Prisma.FollowWhereUniqueInput;
export type FollowSelect = Prisma.FollowSelect;
export type FollowInclude = Prisma.FollowInclude;

// Custom types for API responses
export type UserWithCounts = User & {
  _count: {
    posts: number;
    followers: number;
    following: number;
  };
};

export type PostWithAuthor = Post & {
  author: User;
};

export type UserWithPosts = User & {
  posts: Post[];
};

export type UserWithFollows = User & {
  followers: Follow[];
  following: Follow[];
};

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Auth types
export interface AuthUser {
  id: string;
  username: string;
  email: string;
  name?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  name?: string;
}

export interface AuthResponse extends ApiResponse<AuthUser> {
  token?: string;
}

// Query parameters
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface UserQueryParams extends PaginationParams {
  search?: string;
}

export interface PostQueryParams extends PaginationParams {
  authorId?: string;
}
