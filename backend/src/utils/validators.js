/**
 * Security & Input Validation Utilities
 * Validates emails, phone numbers, and common fields for backend endpoints.
 */

// Email regex enforcing standard username, domain name, and valid TLD (2+ alphabetic chars like .com, .org, .in, etc.)
// Rejects incomplete domains like test@gmail. or test@gmail.c or test@.com
export const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

/**
 * Validates email format strictly.
 * @param {string} email
 * @returns {boolean}
 */
export const isValidEmail = (email) => {
  if (!email || typeof email !== "string") return false;
  const trimmed = email.trim();
  if (trimmed.length < 5 || trimmed.length > 254) return false;
  return EMAIL_REGEX.test(trimmed);
};

/**
 * Validates international and regional phone numbers.
 * Supports:
 * - India: +91 followed by exactly 10 digits (e.g., +91 9876543210, +919876543210, +91 98765-43210)
 * - Standard: 10-15 digits with optional country code (+1, +44, etc.)
 * @param {string} phone
 * @returns {boolean}
 */
export const isValidPhone = (phone) => {
  if (!phone || typeof phone !== "string") return false;
  const trimmed = phone.trim();
  if (!trimmed) return false;

  // Check if starts with +91 (India)
  if (trimmed.startsWith("+91")) {
    const rawDigits = trimmed.slice(3).replace(/\D/g, "");
    // Must be exactly 10 digits starting with valid mobile prefix 6, 7, 8, or 9
    return /^[6-9]\d{9}$/.test(rawDigits);
  }

  // General international format (+ followed by country code + 7 to 14 digits) or standard 10 digit number
  const totalDigits = trimmed.replace(/\D/g, "");
  if (totalDigits.length < 10 || totalDigits.length > 15) {
    return false;
  }

  // Must match standard phone characters only (+, spaces, hyphens, parentheses, digits)
  return /^\+?[0-9\s\-()]{10,20}$/.test(trimmed);
};

export default {
  isValidEmail,
  isValidPhone,
  EMAIL_REGEX,
};
