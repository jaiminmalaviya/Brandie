import { Router } from "express";
import { getFeed } from "../controllers/posts";
import { authenticateToken } from "../middleware";

const router = Router();

/**
 * @route   GET /feed
 * @desc    Get personalized feed for authenticated user
 * @access  Private
 */
router.get("/", authenticateToken, getFeed);

export default router;
