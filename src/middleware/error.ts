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
 * Enhanced global error handling middleware
 * Should be the last middleware in the chain
 */
export const errorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
): void => {
  console.error("Error:", {
    message: error.message,
    stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    timestamp: new Date().toISOString(),
  });

  // If response was already sent, delegate to Express default error handler
  if (res.headersSent) {
    return next(error);
  }

  // If it's our custom AppError
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      error: error.message,
      ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
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

    if (prismaError.code === "P2003") {
      // Foreign key constraint violation
      res.status(400).json({
        success: false,
        error: "Referenced record does not exist",
      });
      return;
    }
  }

  // Handle Prisma client initialization errors
  if (error.name === "PrismaClientInitializationError") {
    res.status(503).json({
      success: false,
      error: "Database connection failed",
    });
    return;
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

  if (error.name === "NotBeforeError") {
    res.status(401).json({
      success: false,
      error: "Token not active yet",
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

  // Handle syntax errors (malformed JSON)
  if (error instanceof SyntaxError && "body" in error) {
    res.status(400).json({
      success: false,
      error: "Invalid JSON in request body",
    });
    return;
  }

  // Handle CORS errors
  if (error.message.includes("CORS")) {
    res.status(403).json({
      success: false,
      error: "CORS policy violation",
    });
    return;
  }

  // Handle request timeout
  if (error.message.includes("timeout")) {
    res.status(408).json({
      success: false,
      error: "Request timeout",
    });
    return;
  }

  // Default error response
  const statusCode = 500;
  const message = process.env.NODE_ENV === "production" ? "Internal server error" : error.message;

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
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

/**
 * Enhanced error classes for different scenarios
 */
export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
    this.name = "ValidationError";
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = "Authentication failed") {
    super(message, 401);
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = "Access forbidden") {
    super(message, 403);
    this.name = "AuthorizationError";
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Resource not found") {
    super(message, 404);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends AppError {
  constructor(message: string = "Resource conflict") {
    super(message, 409);
    this.name = "ConflictError";
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = "Too many requests") {
    super(message, 429);
    this.name = "RateLimitError";
  }
}
