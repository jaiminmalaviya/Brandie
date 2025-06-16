import { Request, Response } from "express";
import { AppError, asyncHandler } from "../middleware/error";
import { PostService, UserService } from "../services/database";
import { ApiResponse } from "../types/api";
import { sanitizeUser } from "../utils/helpers";

/**
 * Create a new post
 * POST /posts
 */
export const createPost = asyncHandler(
  async (req: Request, res: Response<ApiResponse>): Promise<void> => {
    const { text, mediaUrl } = req.body;
    const authorId = req.user!.id;

    const post = await PostService.create({
      text,
      mediaUrl: mediaUrl || null,
      author: {
        connect: { id: authorId },
      },
    });

    // Get the post with author information
    const postWithAuthor = await PostService.getPostWithAuthor(post.id);

    res.status(201).json({
      success: true,
      message: "Post created successfully",
      data: {
        id: postWithAuthor!.id,
        text: postWithAuthor!.text,
        mediaUrl: postWithAuthor!.mediaUrl,
        createdAt: postWithAuthor!.createdAt,
        updatedAt: postWithAuthor!.updatedAt,
        author: sanitizeUser(postWithAuthor!.author),
      },
    });
  }
);

/**
 * Get a single post by ID
 * GET /posts/:id
 */
export const getPost = asyncHandler(
  async (req: Request, res: Response<ApiResponse>): Promise<void> => {
    const { id } = req.params;

    const post = await PostService.getPostWithAuthor(id);
    if (!post) {
      throw new AppError("Post not found", 404);
    }

    res.status(200).json({
      success: true,
      data: {
        id: post.id,
        text: post.text,
        mediaUrl: post.mediaUrl,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        author: sanitizeUser(post.author),
      },
    });
  }
);

/**
 * Get posts by a specific user
 * GET /users/:id/posts
 */
export const getUserPosts = asyncHandler(
  async (req: Request, res: Response<ApiResponse>): Promise<void> => {
    const { id: userId } = req.params;
    const { limit } = req.query as { limit?: string };

    // Check if user exists
    const user = await UserService.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    const limitNum = limit ? parseInt(limit, 10) : 20;
    if (limitNum > 100) {
      throw new AppError("Limit cannot exceed 100", 400);
    }

    const posts = await PostService.getPostsByUser(userId, limitNum);

    res.status(200).json({
      success: true,
      data: posts.map((post) => ({
        id: post.id,
        text: post.text,
        mediaUrl: post.mediaUrl,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        authorId: post.authorId,
      })),
      meta: {
        userId,
        username: user.username,
        count: posts.length,
        limit: limitNum,
      },
    });
  }
);

/**
 * Get personalized feed for authenticated user
 * GET /feed
 */
export const getFeed = asyncHandler(
  async (req: Request, res: Response<ApiResponse>): Promise<void> => {
    const userId = req.user!.id;
    const { limit } = req.query as { limit?: string };

    const limitNum = limit ? parseInt(limit, 10) : 20;
    if (limitNum > 100) {
      throw new AppError("Limit cannot exceed 100", 400);
    }

    const posts = await PostService.getTimeline(userId, limitNum);

    res.status(200).json({
      success: true,
      data: posts.map((post) => ({
        id: post.id,
        text: post.text,
        mediaUrl: post.mediaUrl,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        author: sanitizeUser(post.author),
      })),
      meta: {
        userId,
        count: posts.length,
        limit: limitNum,
        type: "personalized_feed",
      },
    });
  }
);

/**
 * Get public timeline (all posts)
 * GET /posts
 */
export const getPublicTimeline = asyncHandler(
  async (req: Request, res: Response<ApiResponse>): Promise<void> => {
    const { limit, skip } = req.query as { limit?: string; skip?: string };

    const limitNum = limit ? parseInt(limit, 10) : 20;
    const skipNum = skip ? parseInt(skip, 10) : 0;

    if (limitNum > 100) {
      throw new AppError("Limit cannot exceed 100", 400);
    }

    const posts = await PostService.getPostsWithAuthors(limitNum, skipNum);

    res.status(200).json({
      success: true,
      data: posts.map((post) => ({
        id: post.id,
        text: post.text,
        mediaUrl: post.mediaUrl,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        author: sanitizeUser(post.author),
      })),
      meta: {
        count: posts.length,
        limit: limitNum,
        skip: skipNum,
        type: "public_timeline",
      },
    });
  }
);

/**
 * Delete a post (author only)
 * DELETE /posts/:id
 */
export const deletePost = asyncHandler(
  async (req: Request, res: Response<ApiResponse>): Promise<void> => {
    const { id } = req.params;
    const userId = req.user!.id;

    const post = await PostService.findById(id);
    if (!post) {
      throw new AppError("Post not found", 404);
    }

    // Check if user is the author
    if (post.authorId !== userId) {
      throw new AppError("You can only delete your own posts", 403);
    }

    await PostService.delete(id);

    res.status(200).json({
      success: true,
      message: "Post deleted successfully",
      data: {
        id,
        deletedAt: new Date().toISOString(),
      },
    });
  }
);
