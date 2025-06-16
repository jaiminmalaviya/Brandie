import { Router } from "express";
import {
  followUser,
  getFollowStatus,
  getUserFollowers,
  getUserFollowing,
  getUserProfile,
  searchUsers,
  unfollowUser,
} from "../controllers/users";
import { authenticateToken } from "../middleware";

const router = Router();

/**
 * @route   GET /users/search?q=query&limit=10
 * @desc    Search for users by username or name
 * @access  Public
 */
router.get("/search", searchUsers);

/**
 * @route   GET /users/:id
 * @desc    Get user profile by ID
 * @access  Public
 */
router.get("/:id", getUserProfile);

/**
 * @route   POST /users/:id/follow
 * @desc    Follow a user
 * @access  Private
 */
router.post("/:id/follow", authenticateToken, followUser);

/**
 * @route   DELETE /users/:id/follow
 * @desc    Unfollow a user
 * @access  Private
 */
router.delete("/:id/follow", authenticateToken, unfollowUser);

/**
 * @route   GET /users/:id/follow-status
 * @desc    Check if current user is following the specified user
 * @access  Private
 */
router.get("/:id/follow-status", authenticateToken, getFollowStatus);

/**
 * @route   GET /users/:id/followers
 * @desc    Get user's followers
 * @access  Public
 */
router.get("/:id/followers", getUserFollowers);

/**
 * @route   GET /users/:id/following
 * @desc    Get users that this user is following
 * @access  Public
 */
router.get("/:id/following", getUserFollowing);

export default router;
