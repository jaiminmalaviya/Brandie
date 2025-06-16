// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  meta?: any;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
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
