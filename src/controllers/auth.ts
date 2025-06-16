import { Request, Response } from "express";
import { AppError, asyncHandler } from "../middleware/error";
import { UserService } from "../services/database";
import { ApiResponse, AuthResponse, LoginRequest, RegisterRequest } from "../types";
import { comparePassword, generateToken, hashPassword } from "../utils/auth";
import { sanitizeUser } from "../utils/helpers";

/**
 * Register a new user
 * POST /auth/register
 */
export const register = asyncHandler(
  async (
    req: Request<{}, AuthResponse, RegisterRequest>,
    res: Response<AuthResponse>
  ): Promise<void> => {
    const { username, email, password, name } = req.body;

    // Check if user already exists
    const existingUser = await UserService.findByUsername(username);
    if (existingUser) {
      throw new AppError("Username already exists", 409);
    }

    const existingEmail = await UserService.findByEmail(email);
    if (existingEmail) {
      throw new AppError("Email already exists", 409);
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await UserService.create({
      username,
      email,
      password: hashedPassword,
      name: name || null,
    });

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      username: user.username,
      email: user.email,
    });

    // Return user data (without password) and token
    const userData = sanitizeUser(user);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        name: userData.name || undefined,
      },
      token,
    });
  }
);

/**
 * Login user
 * POST /auth/login
 */
export const login = asyncHandler(
  async (
    req: Request<{}, AuthResponse, LoginRequest>,
    res: Response<AuthResponse>
  ): Promise<void> => {
    const { username, password } = req.body;

    // Find user by username or email
    let user = await UserService.findByUsername(username);
    if (!user) {
      user = await UserService.findByEmail(username);
    }

    if (!user) {
      throw new AppError("Invalid credentials", 401);
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      throw new AppError("Invalid credentials", 401);
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      username: user.username,
      email: user.email,
    });

    // Return user data (without password) and token
    const userData = sanitizeUser(user);

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        name: userData.name || undefined,
      },
      token,
    });
  }
);

/**
 * Get current user profile
 * GET /auth/me
 */
export const getProfile = asyncHandler(
  async (req: Request, res: Response<ApiResponse>): Promise<void> => {
    if (!req.user) {
      throw new AppError("User not found", 401);
    }

    // Get full user data with counts
    const userWithCounts = await UserService.getUserWithCounts(req.user.id);

    if (!userWithCounts) {
      throw new AppError("User not found", 404);
    }

    const userData = sanitizeUser(userWithCounts);

    res.status(200).json({
      success: true,
      data: {
        ...userData,
        stats: {
          posts: userWithCounts._count.posts,
          followers: userWithCounts._count.followers,
          following: userWithCounts._count.following,
        },
      },
    });
  }
);

/**
 * Update user profile
 * PUT /auth/profile
 */
export const updateProfile = asyncHandler(
  async (req: Request, res: Response<ApiResponse>): Promise<void> => {
    if (!req.user) {
      throw new AppError("User not found", 401);
    }

    const { name, bio } = req.body;
    const updateData: any = {};

    if (name !== undefined) {
      if (name && (name.length < 1 || name.length > 100)) {
        throw new AppError("Name must be between 1 and 100 characters", 400);
      }
      updateData.name = name || null;
    }

    if (bio !== undefined) {
      if (bio && bio.length > 500) {
        throw new AppError("Bio must not exceed 500 characters", 400);
      }
      updateData.bio = bio || null;
    }

    if (Object.keys(updateData).length === 0) {
      throw new AppError("No fields to update", 400);
    }

    // Update user
    const updatedUser = await UserService.update(req.user.id, updateData);
    const userData = sanitizeUser(updatedUser);

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: userData,
    });
  }
);
