/**
 * Validation Helpers
 * Pure functions returning null if valid, or an error message string if invalid.
 */

/**
 * Validates that a value is not empty or whitespace-only.
 */
export const required = (value, fieldLabel = "This field") => {
  if (value === null || value === undefined) {
    return `${fieldLabel} is required`;
  }
  const str = String(value).trim();
  if (str.length === 0 || str === "all") {
    return `${fieldLabel} is required`;
  }
  return null;
};

/**
 * Validates standard email address format.
 */
export const isEmail = (value) => {
  if (!value || !String(value).trim()) return null; // let 'required' handle empty
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(String(value).trim())
    ? null
    : "Enter a valid email address";
};

/**
 * Validates basic phone number pattern (10-15 digits, allowing +, spaces, hyphens, parentheses).
 */
export const isPhone = (value) => {
  if (!value || !String(value).trim()) return null; // let 'required' handle empty
  const phoneDigits = String(value).replace(/[^0-9]/g, "");
  if (phoneDigits.length < 10 || phoneDigits.length > 15) {
    return "Enter a valid phone number";
  }
  return null;
};

/**
 * Validates minimum string length.
 */
export const minLength = (value, min, fieldLabel = "This field") => {
  if (!value || !String(value).trim()) return null;
  return String(value).trim().length >= min
    ? null
    : `${fieldLabel} must be at least ${min} characters`;
};

/**
 * Validates that a date is not in the future.
 */
export const isPastDate = (value, fieldLabel = "Date") => {
  if (!value || !String(value).trim()) return null;
  const inputDate = new Date(value);
  if (isNaN(inputDate.getTime())) {
    return `Enter a valid date for ${fieldLabel}`;
  }

  const today = new Date();
  today.setHours(23, 59, 59, 999); // end of today

  return inputDate <= today ? null : `${fieldLabel} cannot be in the future`;
};

/**
 * Validates Indian IFSC code format: 4 letters, 0, 6 alphanumeric characters.
 * Example: HDFC0001234, SBIN0000456.
 * Validates only if a value is entered (optional field).
 */
export const isValidIFSC = (value) => {
  if (!value || !String(value).trim()) return null;
  const ifscRegex = /^[A-Za-z]{4}0[A-Za-z0-9]{6}$/;
  return ifscRegex.test(String(value).trim())
    ? null
    : "Enter a valid IFSC code";
};

/**
 * Runs an array of validator functions against a value.
 * Returns the first non-null error string, or null if all pass.
 *
 * @param {any} value 
 * @param {Array<Function>} validatorFns 
 * @returns {string|null}
 */
export const runValidators = (value, validatorFns = []) => {
  for (const fn of validatorFns) {
    if (typeof fn === "function") {
      const error = fn(value);
      if (error) return error;
    }
  }
  return null;
};
