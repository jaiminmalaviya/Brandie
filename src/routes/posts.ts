import { Router } from "express";
import {
  createPost,
  deletePost,
  getPost,
  getPostLikes,
  getPublicTimeline,
  likePost,
  unlikePost,
} from "../controllers/posts";
import {
  authenticateToken,
  optionalAuth,
  postCreationRateLimit,
  sanitizeContent,
  validateCreatePost,
} from "../middleware";

const router = Router();

/**
 * @route   GET /posts
 * @desc    Get public timeline (all posts)
 * @access  Public (with optional auth)
 */
router.get("/", optionalAuth, getPublicTimeline);

/**
 * @route   POST /posts
 * @desc    Create a new post
 * @access  Private
 */
router.post(
  "/",
  authenticateToken,
  postCreationRateLimit,
  sanitizeContent,
  validateCreatePost,
  createPost
);

/**
 * @route   GET /posts/:id
 * @desc    Get a single post by ID
 * @access  Public (with optional auth)
 */
router.get("/:id", optionalAuth, getPost);

/**
 * @route   DELETE /posts/:id
 * @desc    Delete a post (author only)
 * @access  Private
 */
router.delete("/:id", authenticateToken, deletePost);

/**
 * @route   POST /posts/:id/like
 * @desc    Like a post
 * @access  Private
 */
router.post("/:id/like", authenticateToken, likePost);

/**
 * @route   DELETE /posts/:id/like
 * @desc    Unlike a post
 * @access  Private
 */
router.delete("/:id/like", authenticateToken, unlikePost);

/**
 * @route   GET /posts/:id/likes
 * @desc    Get likes for a post
 * @access  Public
 */
router.get("/:id/likes", getPostLikes);

export default router;
