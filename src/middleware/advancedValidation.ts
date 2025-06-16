import { NextFunction, Request, Response } from "express";
import { body, param, query, validationResult } from "express-validator";
import { ApiResponse } from "../types/api";

/**
 * Handle validation errors from express-validator
 */
export const handleValidationErrors = (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((error) => error.msg);
    res.status(400).json({
      success: false,
      error: "Validation failed",
      data: errorMessages,
    });
    return;
  }
  next();
};

/**
 * Enhanced registration validation
 */
export const validateRegistrationEnhanced = [
  body("username")
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be between 3 and 30 characters")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Username can only contain letters, numbers, and underscores")
    .trim(),

  body("email")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail()
    .isLength({ max: 254 })
    .withMessage("Email is too long"),

  body("password")
    .isLength({ min: 8, max: 128 })
    .withMessage("Password must be between 8 and 128 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Password must contain at least one lowercase letter, one uppercase letter, and one number"
    ),

  body("name")
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage("Name must be between 1 and 100 characters")
    .trim(),

  handleValidationErrors,
];

/**
 * Enhanced login validation
 */
export const validateLoginEnhanced = [
  body("username").notEmpty().withMessage("Username or email is required").trim(),

  body("password").notEmpty().withMessage("Password is required"),

  handleValidationErrors,
];

/**
 * Profile update validation
 */
export const validateProfileUpdate = [
  body("name")
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage("Name must be between 1 and 100 characters")
    .trim(),

  body("bio")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Bio must not exceed 500 characters")
    .trim(),

  body("avatar")
    .optional()
    .isURL()
    .withMessage("Avatar must be a valid URL")
    .isLength({ max: 500 })
    .withMessage("Avatar URL is too long"),

  handleValidationErrors,
];

/**
 * Enhanced post creation validation
 */
export const validatePostCreation = [
  body("text")
    .notEmpty()
    .withMessage("Post text is required")
    .isLength({ min: 1, max: 500 })
    .withMessage("Post text must be between 1 and 500 characters")
    .trim(),

  body("mediaUrl")
    .optional()
    .isURL()
    .withMessage("Media URL must be a valid URL")
    .isLength({ max: 500 })
    .withMessage("Media URL is too long"),

  handleValidationErrors,
];

/**
 * User search validation
 */
export const validateUserSearch = [
  query("q")
    .notEmpty()
    .withMessage("Search query is required")
    .isLength({ min: 1, max: 50 })
    .withMessage("Search query must be between 1 and 50 characters")
    .trim(),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage("Limit must be between 1 and 50"),

  handleValidationErrors,
];

/**
 * User ID parameter validation
 */
export const validateUserId = [
  param("id")
    .notEmpty()
    .withMessage("User ID is required")
    .isLength({ min: 20, max: 30 })
    .withMessage("Invalid user ID format"),

  handleValidationErrors,
];

/**
 * Post ID parameter validation
 */
export const validatePostId = [
  param("id")
    .notEmpty()
    .withMessage("Post ID is required")
    .isLength({ min: 20, max: 30 })
    .withMessage("Invalid post ID format"),

  handleValidationErrors,
];

/**
 * Feed/timeline query validation
 */
export const validateFeedQuery = [
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),

  query("skip").optional().isInt({ min: 0 }).withMessage("Skip must be a non-negative number"),

  handleValidationErrors,
];

/**
 * General content sanitization middleware
 */
export const sanitizeContent = (req: Request, res: Response, next: NextFunction): void => {
  // Remove null bytes and control characters from text content
  if (req.body.text) {
    req.body.text = req.body.text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
  }

  if (req.body.bio) {
    req.body.bio = req.body.bio.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
  }

  if (req.body.name) {
    req.body.name = req.body.name.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
  }

  next();
};
