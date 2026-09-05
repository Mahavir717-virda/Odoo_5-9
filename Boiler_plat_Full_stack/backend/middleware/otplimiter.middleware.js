import rateLimit from "express-rate-limit";

// Rate limiter middleware for OTP endpoints (e.g., sending and verifying OTPs)
// Restricts each IP address to a maximum of 5 requests per 15 minutes
export const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 5, // Limit each IP to 5 OTP requests per windowMs
  message: {
    success: false,
    message: "Too many OTP requests from this IP, please try again after 15 minutes.",
  },
  statusCode: 429, // Too Many Requests
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
