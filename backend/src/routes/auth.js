import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../db.js";
import { authenticate, requireRole } from "../middleware/auth.js";

const router = express.Router();

/**
 * POST /api/v1/auth/login
 * Public login endpoint
 */
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password || typeof email !== "string" || typeof password !== "string") {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const userResult = await pool.query(
      "SELECT id, email, password, role FROM users WHERE email = $1 LIMIT 1",
      [normalizedEmail]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const user = userResult.rows[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const jwtSecret =
      process.env.JWT_SECRET ||
      process.env.ACCESS_TOKEN_SECRET ||
      "default_jwt_secret_key_peoplepay360";

    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
      },
      jwtSecret,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || process.env.ACCESS_TOKEN_EXPIRY || "1d",
      }
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

/**
 * GET /api/v1/auth/me
 * Protected endpoint to fetch current authenticated user
 */
router.get("/me", authenticate, async (req, res) => {
  return res.status(200).json({
    success: true,
    data: {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
    },
  });
});

/**
 * RBAC Demonstration Routes
 */

// GET /api/v1/auth/admin-test (admin only)
router.get("/admin-test", authenticate, requireRole("admin"), (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Admin access granted",
  });
});

// GET /api/v1/auth/hr-test (admin, hr_manager)
router.get("/hr-test", authenticate, requireRole("admin", "hr_manager"), (req, res) => {
  return res.status(200).json({
    success: true,
    message: "HR access granted",
  });
});

// GET /api/v1/auth/payroll-test (admin, hr_payroll_manager)
router.get("/payroll-test", authenticate, requireRole("admin", "hr_payroll_manager"), (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Payroll access granted",
  });
});

// GET /api/v1/auth/employee-test (admin, hr_manager, hr_payroll_manager, employee)
router.get(
  "/employee-test",
  authenticate,
  requireRole("admin", "hr_manager", "hr_payroll_manager", "employee"),
  (req, res) => {
    return res.status(200).json({
      success: true,
      message: "Authenticated employee access granted",
    });
  }
);

export default router;
