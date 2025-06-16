import { Router } from "express";
import { createPost, deletePost, getPost, getPublicTimeline } from "../controllers/posts";
import { authenticateToken, validateCreatePost } from "../middleware";

const router = Router();

/**
 * @route   GET /posts
 * @desc    Get public timeline (all posts)
 * @access  Public
 */
router.get("/", getPublicTimeline);

/**
 * @route   POST /posts
 * @desc    Create a new post
 * @access  Private
 */
router.post("/", authenticateToken, validateCreatePost, createPost);

/**
 * @route   GET /posts/:id
 * @desc    Get a single post by ID
 * @access  Public
 */
router.get("/:id", getPost);

/**
 * @route   DELETE /posts/:id
 * @desc    Delete a post (author only)
 * @access  Private
 */
router.delete("/:id", authenticateToken, deletePost);

export default router;
