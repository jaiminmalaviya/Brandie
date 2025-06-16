import { NextFunction, Request, Response } from "express";
import { UserService } from "../services/database";
import { ApiResponse, AuthUser } from "../types";
import { verifyToken } from "../utils/auth";

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/**
 * JWT Authentication Middleware
 * Verifies JWT token and attaches user info to request
 */
export const authenticateToken = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        error: "Access token required",
      });
      return;
    }

    // Verify the JWT token
    const decoded = verifyToken(token) as any;

    if (!decoded || !decoded.userId) {
      res.status(401).json({
        success: false,
        error: "Invalid token",
      });
      return;
    }

    // Get user from database to ensure they still exist
    const user = await UserService.findById(decoded.userId);

    if (!user) {
      res.status(401).json({
        success: false,
        error: "User not found",
      });
      return;
    }

    // Attach user info to request (excluding password)
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name || undefined,
    };

    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(401).json({
      success: false,
      error: "Invalid token",
    });
  }
};

/**
 * Optional Authentication Middleware
 * Similar to authenticateToken but doesn't require token
 * Attaches user info if valid token is provided
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      next();
      return;
    }

    const decoded = verifyToken(token) as any;

    if (decoded && decoded.userId) {
      const user = await UserService.findById(decoded.userId);

      if (user) {
        req.user = {
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.name || undefined,
        };
      }
    }

    next();
  } catch (error) {
    // For optional auth, we just continue without user info
    next();
  }
};
