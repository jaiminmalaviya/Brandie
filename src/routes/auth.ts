import { Router } from "express";
import { getProfile, login, register, updateProfile } from "../controllers/auth";
import { authenticateToken, validateLogin, validateRegister } from "../middleware";

const router = Router();

/**
 * @route   POST /auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post("/register", validateRegister, register);

/**
 * @route   POST /auth/login
 * @desc    Login user
 * @access  Public
 */
router.post("/login", validateLogin, login);

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
