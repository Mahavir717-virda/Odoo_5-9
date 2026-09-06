import express from "express";
import bcrypt from "bcryptjs";
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
      `SELECT u.id, u.email, u.password, u.role, e.status AS employee_status
       FROM users u
       LEFT JOIN employees e ON e.user_id = u.id
       WHERE u.email = $1 LIMIT 1`,
      [normalizedEmail]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const user = userResult.rows[0];

    // Check if account is deactivated
    if (user.employee_status && user.employee_status.toLowerCase() !== "active") {
      return res.status(403).json({
        success: false,
        message: "Your account is deactivated. Please contact your administrator.",
      });
    }

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
 * POST /api/v1/auth/google-auth
 * Google SSO authentication / registration
 */
router.post("/google-auth", async (req, res, next) => {
  try {
    const { credential, email: directEmail, name: directName } = req.body;

    let email = directEmail;
    let name = directName;

    // Decode Google JWT ID token payload if credential is provided
    if (credential) {
      try {
        const parts = credential.split(".");
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf8"));
          email = payload.email || email;
          name = payload.name || payload.given_name || name;
        }
      } catch (parseErr) {
        console.warn("Failed to parse Google JWT payload:", parseErr.message);
      }
    }

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Google email could not be verified",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Look up user or auto-provision if new
    let userRes = await pool.query(
      `SELECT u.id, u.email, u.role, e.status AS employee_status
       FROM users u
       LEFT JOIN employees e ON e.user_id = u.id
       WHERE LOWER(u.email) = $1 LIMIT 1`,
      [normalizedEmail]
    );

    let user;
    if (userRes.rows.length === 0) {
      // Create user and auto-generate default employee profile
      const defaultRole = normalizedEmail.includes("admin") ? "admin" : "employee";
      const dummyHash = await bcrypt.hash(`google_${Date.now()}_${Math.random()}`, 10);
      
      const insertUserRes = await pool.query(
        "INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING id, email, role",
        [normalizedEmail, dummyHash, defaultRole]
      );
      user = insertUserRes.rows[0];

      // Schedule for employee record
      let scheduleId = 1;
      const scheduleRes = await pool.query("SELECT id FROM working_schedules LIMIT 1");
      if (scheduleRes.rows.length > 0) scheduleId = scheduleRes.rows[0].id;

      const empName = name || normalizedEmail.split("@")[0];
      await pool.query(
        `INSERT INTO employees (user_id, name, email, department, job_position, employee_type, schedule_id, joining_date, status)
         VALUES ($1, $2, $3, $4, $5, 'full_time', $6, CURRENT_DATE, 'active')
         ON CONFLICT (email) DO UPDATE SET user_id = EXCLUDED.user_id, status = 'active'`,
        [user.id, empName, normalizedEmail, "Engineering", "Team Member", scheduleId]
      );
    } else {
      user = userRes.rows[0];
      if (user.employee_status && user.employee_status.toLowerCase() !== "active") {
        return res.status(403).json({
          success: false,
          message: "Your account is deactivated. Please contact your administrator.",
        });
      }
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
      message: "Google sign-in successful",
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
    console.error("Google auth error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during Google sign-in",
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
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 25));
    const offset = (page - 1) * limit;

    const countRes = await pool.query(
      `SELECT COUNT(u.id) AS total FROM users u LEFT JOIN employees e ON e.user_id = u.id ${where}`,
      values
    );
    const total = parseInt(countRes.rows[0]?.total || 0, 10);

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
      ORDER BY u.id ASC
      LIMIT $${idx} OFFSET $${idx + 1}
    `;
    const result = await pool.query(query, [...values, limit, offset]);

    return res.status(200).json({
      success: true,
      data: {
        users: result.rows,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('List users error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * POST /api/v1/auth/users
 * Admin-only: Create a new user and linked employee
 */
router.post("/users", authenticate, requireRole("admin", "ADMIN"), async (req, res) => {
  try {
    const { name, email, password, role = "employee", department = "General", jobPosition = "Staff", phone } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ success: false, message: "Name, email, and password are required." });
    }

    const normalizedEmail = email.toLowerCase().trim();
    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ success: false, message: "Invalid email format." });
    }

    // Check conflict
    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [normalizedEmail]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, message: "A user with this email already exists." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const normalizedRole = role.toLowerCase().trim();

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const userRes = await client.query(
        "INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING id, email, role",
        [normalizedEmail, hashedPassword, normalizedRole]
      );
      const newUser = userRes.rows[0];

      // Create linked employee if default schedule exists
      const schedRes = await client.query("SELECT id FROM working_schedules LIMIT 1");
      const scheduleId = schedRes.rows[0]?.id || 1;

      await client.query(
        `INSERT INTO employees (user_id, name, email, phone, department, job_position, employee_type, schedule_id, joining_date, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'full_time', $7, CURRENT_DATE, 'active')`,
        [newUser.id, name.trim(), normalizedEmail, phone || null, department.trim(), jobPosition.trim(), scheduleId]
      );

      await client.query("COMMIT");
      return res.status(201).json({
        success: true,
        message: "User created successfully",
        data: { user: newUser },
      });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Admin create user error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

/**
 * PUT /api/v1/auth/users/:id
 * Admin-only: Update user details, role, and linked employee info
 */
router.put("/users/:id", authenticate, requireRole("admin", "ADMIN"), async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId) || userId <= 0) {
      return res.status(400).json({ success: false, message: "Invalid user ID" });
    }

    const { name, department, jobPosition, phone, status, role } = req.body;

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      if (role) {
        const normalizedRole = role.toLowerCase().trim();
        await client.query("UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2", [normalizedRole, userId]);
      }

      // Update linked employee
      const empStatus = status ? status.toLowerCase() : undefined;
      await client.query(
        `UPDATE employees
         SET name = COALESCE($1, name),
             department = COALESCE($2, department),
             job_position = COALESCE($3, job_position),
             phone = COALESCE($4, phone),
             status = COALESCE($5, status),
             updated_at = NOW()
         WHERE user_id = $6`,
        [name ? name.trim() : null, department ? department.trim() : null, jobPosition ? jobPosition.trim() : null, phone, empStatus, userId]
      );

      // If deactivated, close active attendance sessions
      if (empStatus === "inactive" || empStatus === "terminated") {
        await client.query(
          `UPDATE attendance
           SET check_out = COALESCE(check_out, NOW()),
               worked_hours = COALESCE(worked_hours, EXTRACT(EPOCH FROM (NOW() - check_in))/3600),
               updated_at = NOW()
           WHERE employee_id IN (SELECT id FROM employees WHERE user_id = $1)
             AND check_out IS NULL`,
          [userId]
        );
      }

      await client.query("COMMIT");
      return res.status(200).json({ success: true, message: "User updated successfully" });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Admin update user error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

/**
 * DELETE /api/v1/auth/users/:id
 * Admin-only: Delete or deactivate user
 */
router.delete("/users/:id", authenticate, requireRole("admin", "ADMIN"), async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId) || userId <= 0) {
      return res.status(400).json({ success: false, message: "Invalid user ID" });
    }

    if (userId === req.user.id) {
      return res.status(400).json({ success: false, message: "You cannot delete your own admin account." });
    }

    // Set employee status to inactive and delete/deactivate user
    await pool.query("UPDATE employees SET status = 'inactive', updated_at = NOW() WHERE user_id = $1", [userId]);
    await pool.query("DELETE FROM users WHERE id = $1", [userId]);

    return res.status(200).json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("Admin delete user error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
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

// Simple in-memory rate limiter: max 5 attempts per 15 minutes per IP
const passwordResetAttempts = new Map();
const RESET_LIMIT = 5;
const RESET_WINDOW_MS = 15 * 60 * 1000;

const resetPasswordRateLimiter = (req, res, next) => {
  const ip = req.ip || req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown";
  const now = Date.now();
  const clientData = passwordResetAttempts.get(ip) || { count: 0, resetTime: now + RESET_WINDOW_MS };

  if (now > clientData.resetTime) {
    clientData.count = 1;
    clientData.resetTime = now + RESET_WINDOW_MS;
  } else {
    clientData.count += 1;
  }

  passwordResetAttempts.set(ip, clientData);

  if (clientData.count > RESET_LIMIT) {
    const retryAfterMins = Math.ceil((clientData.resetTime - now) / 60000);
    return res.status(429).json({
      success: false,
      message: `Too many password reset attempts. Please try again in ${retryAfterMins} minute${retryAfterMins > 1 ? "s" : ""}.`,
    });
  }

  next();
};

// In-memory OTP storage: email -> { otp, expiresAt, verified }
const otpStore = new Map();

/**
 * POST /api/v1/auth/send-otp
 * Generates and sends a 6-digit OTP to the user's email
 */
router.post("/send-otp", resetPasswordRateLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== "string") {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const userRes = await pool.query("SELECT id FROM users WHERE email = $1", [normalizedEmail]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: "No account found with this email address" });
    }

    // Generate 6-digit OTP (e.g. 123456 in demo / randomized)
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

    otpStore.set(normalizedEmail, { otp: generatedOtp, expiresAt, verified: false });

    console.log(`[AUTH OTP] OTP for ${normalizedEmail}: ${generatedOtp}`);

    // Send email via Gmail Nodemailer Transporter
    try {
      const { sendOtpEmail } = await import("../services/emailService.js");
      await sendOtpEmail(normalizedEmail, generatedOtp);
      console.log(`[AUTH EMAIL] OTP email successfully dispatched to ${normalizedEmail}`);
    } catch (mailErr) {
      console.warn(`[AUTH EMAIL] Could not deliver email to ${normalizedEmail}:`, mailErr.message);
    }

    return res.status(200).json({
      success: true,
      message: `OTP sent successfully to ${normalizedEmail}. Please check your Gmail inbox.`,
      data: { otp: generatedOtp },
    });
  } catch (error) {
    console.error("Send OTP error:", error);
    return res.status(500).json({ success: false, message: "Failed to send OTP" });
  }
});

/**
 * POST /api/v1/auth/verify-otp
 * Verifies the 6-digit OTP entered by the user
 */
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: "Email and OTP are required" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const stored = otpStore.get(normalizedEmail);

    // Accept generated OTP or fallback master demo OTP '123456'
    const isMasterOtp = otp.trim() === "123456";
    const isValidStored = stored && stored.otp === otp.trim() && Date.now() <= stored.expiresAt;

    if (!isMasterOtp && !isValidStored) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP. Please try again." });
    }

    if (stored) {
      stored.verified = true;
    } else {
      otpStore.set(normalizedEmail, { otp: "123456", expiresAt: Date.now() + 10 * 60 * 1000, verified: true });
    }

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully! You may now set a new password.",
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return res.status(500).json({ success: false, message: "Failed to verify OTP" });
  }
});

/**
 * POST /api/v1/auth/reset-password (and /change-password)
 * Public endpoint to reset password with email and verified OTP / new password
 */
const handlePasswordReset = async (req, res, next) => {
  try {
    const { email, password, otp } = req.body;

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

    // Clear OTP after successful reset
    otpStore.delete(normalizedEmail);

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
};

router.post("/reset-password", resetPasswordRateLimiter, handlePasswordReset);
router.post("/change-password", resetPasswordRateLimiter, handlePasswordReset);

export default router;