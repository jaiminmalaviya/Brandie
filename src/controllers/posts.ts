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
    const likeCount = await PostService.getLikeCount(post.id);

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
        likeCount,
        isLiked: false, // New post, so not liked yet
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
    const userId = req.user?.id; // Optional, for checking if user liked the post

    const post = await PostService.getPostWithAuthor(id);
    if (!post) {
      throw new AppError("Post not found", 404);
    }

    const likeCount = await PostService.getLikeCount(id);
    let isLiked = false;

    if (userId) {
      const like = await PostService.findLike(userId, id);
      isLiked = !!like;
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
        likeCount,
        isLiked,
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

    // Get liked posts for the current user
    const postIds = posts.map((post) => post.id);
    const likedPostIds = await PostService.getUserLikedPosts(userId, postIds);

    res.status(200).json({
      success: true,
      data: posts.map((post) => ({
        id: post.id,
        text: post.text,
        mediaUrl: post.mediaUrl,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        author: sanitizeUser(post.author),
        likeCount: post._count.likes,
        isLiked: likedPostIds.includes(post.id),
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
    const userId = req.user?.id; // Optional, for checking which posts are liked

    const limitNum = limit ? parseInt(limit, 10) : 20;
    const skipNum = skip ? parseInt(skip, 10) : 0;

    if (limitNum > 100) {
      throw new AppError("Limit cannot exceed 100", 400);
    }

    const posts = await PostService.getPostsWithAuthors(limitNum, skipNum);

    let likedPostIds: string[] = [];
    if (userId) {
      const postIds = posts.map((post) => post.id);
      likedPostIds = await PostService.getUserLikedPosts(userId, postIds);
    }

    res.status(200).json({
      success: true,
      data: posts.map((post) => ({
        id: post.id,
        text: post.text,
        mediaUrl: post.mediaUrl,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        author: sanitizeUser(post.author),
        likeCount: post._count.likes,
        isLiked: userId ? likedPostIds.includes(post.id) : false,
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

/**
 * Like a post
 * POST /posts/:id/like
 */
export const likePost = asyncHandler(
  async (req: Request, res: Response<ApiResponse>): Promise<void> => {
    const { id: postId } = req.params;
    const userId = req.user!.id;

    // Check if post exists
    const post = await PostService.findById(postId);
    if (!post) {
      throw new AppError("Post not found", 404);
    }

    // Check if user already liked this post
    const existingLike = await PostService.findLike(userId, postId);
    if (existingLike) {
      throw new AppError("Post already liked", 400);
    }

    // Create the like
    const like = await PostService.createLike(userId, postId);

    res.status(201).json({
      success: true,
      message: "Post liked successfully",
      data: {
        id: like.id,
        postId,
        userId,
        createdAt: like.createdAt,
      },
    });
  }
);

/**
 * Unlike a post
 * DELETE /posts/:id/like
 */
export const unlikePost = asyncHandler(
  async (req: Request, res: Response<ApiResponse>): Promise<void> => {
    const { id: postId } = req.params;
    const userId = req.user!.id;

    // Check if post exists
    const post = await PostService.findById(postId);
    if (!post) {
      throw new AppError("Post not found", 404);
    }

    // Check if user has liked this post
    const existingLike = await PostService.findLike(userId, postId);
    if (!existingLike) {
      throw new AppError("Post not liked yet", 400);
    }

    // Remove the like
    await PostService.deleteLike(userId, postId);

    res.status(200).json({
      success: true,
      message: "Post unliked successfully",
      data: {
        postId,
        userId,
        unlikedAt: new Date().toISOString(),
      },
    });
  }
);

/**
 * Get likes for a post
 * GET /posts/:id/likes
 */
export const getPostLikes = asyncHandler(
  async (req: Request, res: Response<ApiResponse>): Promise<void> => {
    const { id: postId } = req.params;
    const { limit } = req.query as { limit?: string };

    // Check if post exists
    const post = await PostService.findById(postId);
    if (!post) {
      throw new AppError("Post not found", 404);
    }

    const limitNum = limit ? parseInt(limit, 10) : 20;
    if (limitNum > 100) {
      throw new AppError("Limit cannot exceed 100", 400);
    }

    const likes = await PostService.getPostLikes(postId, limitNum);

    res.status(200).json({
      success: true,
      data: likes.map((like) => ({
        id: like.id,
        createdAt: like.createdAt,
        user: sanitizeUser(like.user),
      })),
      meta: {
        postId,
        count: likes.length,
        limit: limitNum,
      },
    });
  }
);
