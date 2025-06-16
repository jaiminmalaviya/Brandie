import { Request, Response } from "express";
import { AppError, asyncHandler } from "../middleware/error";
import { FollowService, UserService } from "../services/database";
import { ApiResponse } from "../types/api";
import { sanitizeUser } from "../utils/helpers";

/**
 * Get user profile by ID
 * GET /users/:id
 */
export const getUserProfile = asyncHandler(
  async (req: Request, res: Response<ApiResponse>): Promise<void> => {
    const { id } = req.params;

    const user = await UserService.getUserWithCounts(id);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    const sanitizedUser = sanitizeUser(user);

    res.status(200).json({
      success: true,
      data: {
        ...sanitizedUser,
        stats: {
          posts: user._count.posts,
          followers: user._count.followers,
          following: user._count.following,
        },
      },
    });
  }
);

/**
 * Search users
 * GET /users/search?q=query
 */
export const searchUsers = asyncHandler(
  async (req: Request, res: Response<ApiResponse>): Promise<void> => {
    const { q: query, limit } = req.query as { q?: string; limit?: string };

    if (!query || query.trim().length === 0) {
      throw new AppError("Search query is required", 400);
    }

    const limitNum = limit ? parseInt(limit, 10) : 10;
    if (limitNum > 50) {
      throw new AppError("Limit cannot exceed 50", 400);
    }

    const users = await UserService.searchUsers(query.trim(), limitNum);
    const sanitizedUsers = users.map(sanitizeUser);

    res.status(200).json({
      success: true,
      data: sanitizedUsers,
      meta: {
        query,
        count: sanitizedUsers.length,
        limit: limitNum,
      },
    });
  }
);

/**
 * Follow a user
 * POST /users/:id/follow
 */
export const followUser = asyncHandler(
  async (req: Request, res: Response<ApiResponse>): Promise<void> => {
    const { id: followeeId } = req.params;
    const followerId = req.user!.id;

    // Check if user exists
    const followee = await UserService.findById(followeeId);
    if (!followee) {
      throw new AppError("User not found", 404);
    }

    // Prevent self-following
    if (followerId === followeeId) {
      throw new AppError("You cannot follow yourself", 400);
    }

    // Check if already following
    const isAlreadyFollowing = await FollowService.isFollowing(followerId, followeeId);
    if (isAlreadyFollowing) {
      throw new AppError("You are already following this user", 409);
    }

    // Create follow relationship
    await FollowService.follow(followerId, followeeId);

    res.status(201).json({
      success: true,
      message: `You are now following ${followee.username}`,
      data: {
        followeeId,
        followeeName: followee.username,
      },
    });
  }
);

/**
 * Unfollow a user
 * DELETE /users/:id/follow
 */
export const unfollowUser = asyncHandler(
  async (req: Request, res: Response<ApiResponse>): Promise<void> => {
    const { id: followeeId } = req.params;
    const followerId = req.user!.id;

    // Check if user exists
    const followee = await UserService.findById(followeeId);
    if (!followee) {
      throw new AppError("User not found", 404);
    }

    // Check if currently following
    const isFollowing = await FollowService.isFollowing(followerId, followeeId);
    if (!isFollowing) {
      throw new AppError("You are not following this user", 409);
    }

    // Remove follow relationship
    await FollowService.unfollow(followerId, followeeId);

    res.status(200).json({
      success: true,
      message: `You are no longer following ${followee.username}`,
      data: {
        followeeId,
        followeeName: followee.username,
      },
    });
  }
);

/**
 * Get user's followers
 * GET /users/:id/followers
 */
export const getUserFollowers = asyncHandler(
  async (req: Request, res: Response<ApiResponse>): Promise<void> => {
    const { id } = req.params;

    // Check if user exists
    const user = await UserService.findById(id);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    const followers = await FollowService.getFollowers(id);
    const sanitizedFollowers = followers.map(sanitizeUser);

    res.status(200).json({
      success: true,
      data: sanitizedFollowers,
      meta: {
        userId: id,
        username: user.username,
        count: sanitizedFollowers.length,
      },
    });
  }
);

/**
 * Get user's following
 * GET /users/:id/following
 */
export const getUserFollowing = asyncHandler(
  async (req: Request, res: Response<ApiResponse>): Promise<void> => {
    const { id } = req.params;

    // Check if user exists
    const user = await UserService.findById(id);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    const following = await FollowService.getFollowing(id);
    const sanitizedFollowing = following.map(sanitizeUser);

    res.status(200).json({
      success: true,
      data: sanitizedFollowing,
      meta: {
        userId: id,
        username: user.username,
        count: sanitizedFollowing.length,
      },
    });
  }
);

/**
 * Check if current user is following a specific user
 * GET /users/:id/follow-status
 */
export const getFollowStatus = asyncHandler(
  async (req: Request, res: Response<ApiResponse>): Promise<void> => {
    const { id: followeeId } = req.params;
    const followerId = req.user!.id;

    // Check if user exists
    const followee = await UserService.findById(followeeId);
    if (!followee) {
      throw new AppError("User not found", 404);
    }

    const isFollowing = await FollowService.isFollowing(followerId, followeeId);

    res.status(200).json({
      success: true,
      data: {
        userId: followeeId,
        username: followee.username,
        isFollowing,
      },
    });
  }
);
