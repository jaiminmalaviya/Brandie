import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "../types";

/**
 * Custom error class for application errors
 */
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global error handling middleware
 * Should be the last middleware in the chain
 */
export const errorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
): void => {
  console.error("Error:", error);

  // If it's our custom AppError
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      error: error.message,
    });
    return;
  }

  // Handle Prisma errors
  if (error.name === "PrismaClientKnownRequestError") {
    const prismaError = error as any;

    if (prismaError.code === "P2002") {
      // Unique constraint violation
      const field = prismaError.meta?.target?.[0] || "field";
      res.status(409).json({
        success: false,
        error: `${field} already exists`,
      });
      return;
    }

    if (prismaError.code === "P2025") {
      // Record not found
      res.status(404).json({
        success: false,
        error: "Record not found",
      });
      return;
    }
  }

  // Handle JWT errors
  if (error.name === "JsonWebTokenError") {
    res.status(401).json({
      success: false,
      error: "Invalid token",
    });
    return;
  }

  if (error.name === "TokenExpiredError") {
    res.status(401).json({
      success: false,
      error: "Token has expired",
    });
    return;
  }

  // Handle validation errors
  if (error.name === "ValidationError") {
    res.status(400).json({
      success: false,
      error: error.message,
    });
    return;
  }

  // Default error response
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === "production" ? "Internal server error" : error.message,
  });
};

/**
 * Not found middleware for unmatched routes
 */
export const notFound = (req: Request, res: Response<ApiResponse>, next: NextFunction): void => {
  res.status(404).json({
    success: false,
    error: `Route ${req.originalUrl} not found`,
  });
};

/**
 * Async error handler wrapper
 * Wraps async route handlers to catch errors automatically
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
