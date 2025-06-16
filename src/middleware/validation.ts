import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "../types";
import { isValidEmail, isValidUsername } from "../utils/helpers";

/**
 * Validation middleware for user registration
 */
export const validateRegister = (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
): void => {
  const { username, email, password, name } = req.body;
  const errors: string[] = [];

  // Required fields
  if (!username) {
    errors.push("Username is required");
  } else if (!isValidUsername(username)) {
    errors.push(
      "Username must be 3-30 characters and contain only letters, numbers, and underscores"
    );
  }

  if (!email) {
    errors.push("Email is required");
  } else if (!isValidEmail(email)) {
    errors.push("Please provide a valid email address");
  }

  if (!password) {
    errors.push("Password is required");
  } else if (password.length < 6) {
    errors.push("Password must be at least 6 characters long");
  } else if (password.length > 128) {
    errors.push("Password must not exceed 128 characters");
  }

  // Optional name validation
  if (name && (name.length < 1 || name.length > 100)) {
    errors.push("Name must be between 1 and 100 characters");
  }

  if (errors.length > 0) {
    res.status(400).json({
      success: false,
      error: "Validation failed",
      data: errors,
    });
    return;
  }

  next();
};

/**
 * Validation middleware for user login
 */
export const validateLogin = (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
): void => {
  const { username, password } = req.body;
  const errors: string[] = [];

  if (!username) {
    errors.push("Username or email is required");
  }

  if (!password) {
    errors.push("Password is required");
  }

  if (errors.length > 0) {
    res.status(400).json({
      success: false,
      error: "Validation failed",
      data: errors,
    });
    return;
  }

  next();
};

/**
 * Validation middleware for creating posts
 */
export const validateCreatePost = (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
): void => {
  const { text, mediaUrl } = req.body;
  const errors: string[] = [];

  if (!text || text.trim().length === 0) {
    errors.push("Post text is required");
  } else if (text.length > 500) {
    errors.push("Post text must not exceed 500 characters");
  }

  // Optional media URL validation
  if (mediaUrl && mediaUrl.length > 500) {
    errors.push("Media URL must not exceed 500 characters");
  }

  if (errors.length > 0) {
    res.status(400).json({
      success: false,
      error: "Validation failed",
      data: errors,
    });
    return;
  }

  next();
};

/**
 * Validation middleware for pagination parameters
 */
export const validatePagination = (req: Request, res: Response, next: NextFunction): void => {
  const { page, limit } = req.query;

  if (page && (isNaN(Number(page)) || Number(page) < 1)) {
    res.status(400).json({
      success: false,
      error: "Page must be a positive number",
    });
    return;
  }

  if (limit && (isNaN(Number(limit)) || Number(limit) < 1 || Number(limit) > 100)) {
    res.status(400).json({
      success: false,
      error: "Limit must be a number between 1 and 100",
    });
    return;
  }

  next();
};
