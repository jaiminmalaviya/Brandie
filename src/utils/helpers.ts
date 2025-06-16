/**
 * Utility functions for common operations
 */

/**
 * Generate a pagination offset from page and limit
 */
export function getPaginationOffset(page: number = 1, limit: number = 20): number {
  return (page - 1) * limit;
}

/**
 * Calculate total pages from total count and limit
 */
export function getTotalPages(total: number, limit: number): number {
  return Math.ceil(total / limit);
}

/**
 * Create pagination metadata
 */
export function createPaginationMeta(page: number, limit: number, total: number) {
  return {
    page,
    limit,
    total,
    totalPages: getTotalPages(total, limit),
    hasNext: page < getTotalPages(total, limit),
    hasPrev: page > 1,
  };
}

/**
 * Validate pagination parameters
 */
export function validatePagination(page?: number, limit?: number) {
  const validatedPage = Math.max(1, page || 1);
  const validatedLimit = Math.max(1, Math.min(100, limit || 20)); // Max 100 items per page

  return {
    page: validatedPage,
    limit: validatedLimit,
    offset: getPaginationOffset(validatedPage, validatedLimit),
  };
}

/**
 * Remove sensitive fields from user object
 */
export function sanitizeUser(user: any) {
  const { password, ...sanitizedUser } = user;
  return sanitizedUser;
}

/**
 * Convert string to slug format
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate username format (alphanumeric and underscores, 3-30 chars)
 */
export function isValidUsername(username: string): boolean {
  const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
  return usernameRegex.test(username);
}
