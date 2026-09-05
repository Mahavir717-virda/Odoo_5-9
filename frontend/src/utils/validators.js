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
 * Validates standard email address format with a valid domain and TLD.
 * (e.g. rejects test@g, test@gmail., requires valid 2+ char domain extension)
 */
export const isEmail = (value) => {
  if (!value || !String(value).trim()) return null; // let 'required' handle empty
  const str = String(value).trim();
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
  return emailRegex.test(str)
    ? null
    : "Enter a valid email address (e.g. name@domain.com)";
};

/**
 * Validates phone numbers.
 * If prefix is +91 (India), enforces exactly 10 digits starting with 6-9.
 * Otherwise requires 10-15 standard international digits.
 */
export const isPhone = (value) => {
  if (!value || !String(value).trim()) return null; // let 'required' handle empty
  const str = String(value).trim();

  // If +91 is provided
  if (str.startsWith("+91")) {
    const rawDigits = str.slice(3).replace(/\D/g, "");
    if (!/^[6-9]\d{9}$/.test(rawDigits)) {
      return "Indian numbers with +91 must have exactly 10 valid digits";
    }
    return null;
  }

  const phoneDigits = str.replace(/[^0-9]/g, "");
  if (phoneDigits.length < 10 || phoneDigits.length > 15) {
    return "Enter a valid phone number (10 to 15 digits)";
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
