import { Router } from "express";
import { getProfile, login, register, updateProfile } from "../controllers/auth";
import {
  authenticateToken,
  authRateLimit,
  sanitizeContent,
  validateLogin,
  validateRegister,
} from "../middleware";

const router = Router();

/**
 * @route   POST /auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post("/register", authRateLimit, sanitizeContent, validateRegister, register);

/**
 * @route   POST /auth/login
 * @desc    Login user
 * @access  Public
 */
router.post("/login", authRateLimit, validateLogin, login);

/**
 * @route   GET /auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get("/me", authenticateToken, getProfile);

/**
 * @route   PUT /auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put("/profile", authenticateToken, updateProfile);

export default router;
