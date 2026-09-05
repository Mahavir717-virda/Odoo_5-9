import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../db.js";
import { authenticate, requireRole } from "../middleware/auth.middleware.js";
import { isValidEmail } from "../utils/validators.js";

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

    if (!isValidEmail(normalizedEmail)) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

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
 * POST /api/v1/auth/register
 * Register a user with any specified role
 * Body: { email, password, name, role?, department?, job_position? }
 */
router.post("/register", async (req, res, next) => {
  try {
    const {
      email,
      password,
      name,
      role = "employee",
      department,
      job_position,
      employee_type = "full_time",
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address with a valid domain (e.g. user@example.com)",
      });
    }

    // Role validation
    const validRoles = [
      "admin",
      "hr_manager",
      "hr_payroll_user",
      "hr_payroll_manager",
      "employee",
    ];
    const normalizedRole = role ? role.toLowerCase().trim() : "employee";

    if (!validRoles.includes(normalizedRole)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role. Allowed roles: ${validRoles.join(", ")}`,
      });
    }

    // Check if user already exists
    const existingUser = await pool.query("SELECT id FROM users WHERE email = $1", [normalizedEmail]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const displayName = name ? name.trim() : normalizedEmail.split("@")[0];

    // Determine default department and job position based on role if not provided
    let defaultDept = department;
    let defaultPosition = job_position;

    if (!defaultDept) {
      if (normalizedRole === "hr_manager") defaultDept = "Human Resources";
      else if (normalizedRole.includes("payroll")) defaultDept = "Payroll & Finance";
      else if (normalizedRole === "admin") defaultDept = "Executive";
      else defaultDept = "Engineering";
    }

    if (!defaultPosition) {
      if (normalizedRole === "hr_manager") defaultPosition = "HR Manager";
      else if (normalizedRole === "hr_payroll_manager") defaultPosition = "Payroll Manager";
      else if (normalizedRole === "hr_payroll_user") defaultPosition = "Payroll Specialist";
      else if (normalizedRole === "admin") defaultPosition = "System Administrator";
      else defaultPosition = "Software Engineer";
    }

    // Insert new user
    const newUserRes = await pool.query(
      "INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING id, email, role",
      [normalizedEmail, hashedPassword, normalizedRole]
    );
    const newUser = newUserRes.rows[0];

    // Ensure a default working schedule exists for foreign key constraint
    let scheduleId = null;
    const scheduleRes = await pool.query("SELECT id FROM working_schedules LIMIT 1");
    if (scheduleRes.rows.length === 0) {
      const newSched = await pool.query(
        "INSERT INTO working_schedules (name, lines) VALUES ('Standard 40h (Mon-Fri)', '[]'::jsonb) RETURNING id"
      );
      scheduleId = newSched.rows[0].id;
    } else {
      scheduleId = scheduleRes.rows[0].id;
    }

    // Insert associated employee record
    const empRes = await pool.query(`
      INSERT INTO employees (user_id, name, email, department, job_position, employee_type, schedule_id, joining_date, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_DATE, 'active')
      ON CONFLICT (email) DO UPDATE SET user_id = EXCLUDED.user_id, status = 'active'
      RETURNING id, name, department, job_position
    `, [newUser.id, displayName, normalizedEmail, defaultDept, defaultPosition, employee_type, scheduleId]);

    const createdEmployee = empRes.rows[0];

    const jwtSecret =
      process.env.JWT_SECRET ||
      process.env.ACCESS_TOKEN_SECRET ||
      "default_jwt_secret_key_peoplepay360";

    const token = jwt.sign(
      {
        userId: newUser.id,
        role: newUser.role,
      },
      jwtSecret,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || process.env.ACCESS_TOKEN_EXPIRY || "1d",
      }
    );

    return res.status(201).json({
      success: true,
      message: `User with role '${newUser.role}' registered successfully`,
      data: {
        token,
        user: {
          id: newUser.id,
          email: newUser.email,
          role: newUser.role,
          employee_id: createdEmployee?.id,
          name: createdEmployee?.name,
          department: createdEmployee?.department,
          job_position: createdEmployee?.job_position,
        },
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error during registration",
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
 * GET /api/v1/auth/users
 * Admin-only: List all system users joined with employee profile data
 */
router.get("/users", authenticate, requireRole("admin", "ADMIN"), async (req, res) => {
  try {
    const { search, role, status } = req.query;
    let conditions = [];
    let values = [];
    let idx = 1;

    if (search && search.trim()) {
      conditions.push(`(u.email ILIKE $${idx} OR e.name ILIKE $${idx})`);
      values.push(`%${search.trim()}%`);
      idx++;
    }
    if (role && role !== 'all') {
      conditions.push(`u.role = $${idx}`);
      values.push(role.toLowerCase());
      idx++;
    }
    if (status && status !== 'all') {
      conditions.push(`e.status = $${idx}`);
      values.push(status.toLowerCase());
      idx++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const query = `
      SELECT
        u.id AS user_id,
        u.email,
        u.role,
        u.created_at AS user_created_at,
        e.id AS employee_id,
        e.name,
        e.phone,
        e.department,
        e.job_position,
        e.status,
        e.joining_date
      FROM users u
      LEFT JOIN employees e ON e.user_id = u.id
      ${where}
      ORDER BY e.name ASC NULLS LAST
    `;
    const result = await pool.query(query, values);
    return res.status(200).json({ success: true, data: { users: result.rows } });
  } catch (error) {
    console.error('List users error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * PATCH /api/v1/auth/users/:id/role
 * Admin-only: Change a user's security role
 */
router.patch("/users/:id/role", authenticate, requireRole("admin", "ADMIN"), async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId) || userId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }

    const { role } = req.body;
    const validRoles = ['admin', 'hr_manager', 'hr_payroll_manager', 'hr_payroll_user', 'employee'];
    const normalizedRole = (role || '').toLowerCase().trim();

    if (!validRoles.includes(normalizedRole)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role. Must be one of: ${validRoles.join(', ')}`,
      });
    }

    // Prevent admin from demoting themselves
    if (userId === req.user.id && normalizedRole !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'You cannot change your own admin role.',
      });
    }

    const result = await pool.query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, email, role',
      [normalizedRole, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      message: `Role updated to '${normalizedRole}' successfully.`,
      data: { user: result.rows[0] },
    });
  } catch (error) {
    console.error('Update role error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * RBAC Demonstration Routes
 */

// GET /api/v1/auth/admin-test (admin only)
router.get("/admin-test", authenticate, requireRole("admin", "ADMIN"), (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Admin access granted",
  });
});

// GET /api/v1/auth/hr-test (admin, hr_manager)
router.get("/hr-test", authenticate, requireRole("admin", "ADMIN", "hr_manager", "HR_MANAGER"), (req, res) => {
  return res.status(200).json({
    success: true,
    message: "HR access granted",
  });
});

// GET /api/v1/auth/payroll-test (admin, hr_payroll_manager)
router.get("/payroll-test", authenticate, requireRole("admin", "ADMIN", "hr_payroll_manager", "HR_PAYROLL_MANAGER"), (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Payroll access granted",
  });
});

// GET /api/v1/auth/employee-test (admin, hr_manager, hr_payroll_manager, employee)
router.get(
  "/employee-test",
  authenticate,
  requireRole("admin", "ADMIN", "hr_manager", "HR_MANAGER", "hr_payroll_manager", "HR_PAYROLL_MANAGER", "employee", "EMPLOYEE"),
  (req, res) => {
    return res.status(200).json({
      success: true,
      message: "Authenticated employee access granted",
    });
  }
);

/**
 * POST /api/v1/auth/reset-password
 * Public endpoint to reset password with email and verified OTP / new password
 */
router.post("/reset-password", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and new password are required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const userRes = await pool.query("SELECT id FROM users WHERE email = $1", [normalizedEmail]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User with this email does not exist",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      "UPDATE users SET password = $1, updated_at = NOW() WHERE email = $2",
      [hashedPassword, normalizedEmail]
    );

    return res.status(200).json({
      success: true,
      message: "Password changed successfully! You can now sign in with your new password.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while changing password",
    });
  }
});

export default router;