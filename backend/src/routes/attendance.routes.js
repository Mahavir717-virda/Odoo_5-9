import express from "express";
import { authenticate, requireRole } from "../middleware/auth.middleware.js";
import attendanceService from "../services/attendanceService.js";
import pool from "../db.js";

const router = express.Router();

// Helper to validate integer ID
const parseId = (id) => {
  const parsed = parseInt(id, 10);
  if (isNaN(parsed) || parsed <= 0 || String(parsed) !== String(id)) {
    return null;
  }
  return parsed;
};

/**
 * Helper to retrieve or provision employee ID for authenticated user
 */
const getAuthenticatedEmployeeId = async (user) => {
  if (!user) return null;
  const userId = typeof user === "object" ? user.id : user;
  if (!userId) return null;

  // 1. Check if employee linked by user_id
  let empRes = await pool.query("SELECT id FROM employees WHERE user_id = $1", [userId]);
  if (empRes.rows.length > 0) return empRes.rows[0].id;

  // 2. Check if employee matched by email
  const email = typeof user === "object" ? user.email : null;
  const role = typeof user === "object" ? user.role : "employee";

  if (email) {
    empRes = await pool.query("SELECT id FROM employees WHERE LOWER(email) = LOWER($1)", [email]);
    if (empRes.rows.length > 0) {
      const empId = empRes.rows[0].id;
      await pool.query("UPDATE employees SET user_id = $1 WHERE id = $2", [userId, empId]);
      return empId;
    }
  }

  // 3. Ensure a working schedule exists
  let scheduleId = 1;
  const schedRes = await pool.query("SELECT id FROM working_schedules ORDER BY id ASC LIMIT 1");
  if (schedRes.rows.length > 0) {
    scheduleId = schedRes.rows[0].id;
  } else {
    const newSched = await pool.query(
      "INSERT INTO working_schedules (name, lines) VALUES ('Standard 40h (Mon-Fri)', '[]'::jsonb) RETURNING id"
    );
    scheduleId = newSched.rows[0].id;
  }

  // 4. Auto-provision employee profile for system user if none exists
  const displayName = email ? email.split("@")[0] : `User-${userId}`;
  const empEmail = email || `user-${userId}@system.local`;
  const department = role === "admin" || role === "hr_manager" ? "Management" : (role?.includes("payroll") ? "Payroll" : "Engineering");
  const jobPosition = role ? role.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) : "Staff";

  const insertRes = await pool.query(
    `INSERT INTO employees (user_id, name, email, department, job_position, employee_type, schedule_id, joining_date, status)
     VALUES ($1, $2, $3, $4, $5, 'full_time', $6, CURRENT_DATE, 'active')
     ON CONFLICT (email) DO UPDATE SET user_id = EXCLUDED.user_id, status = 'active'
     RETURNING id`,
    [userId, displayName, empEmail, department, jobPosition, scheduleId]
  );
  return insertRes.rows[0].id;
};

/**
 * GET /api/v1/attendance/leaderboard
 * Allowed: Any authenticated user
 */
router.get("/leaderboard", authenticate, async (req, res, next) => {
  try {
    const { month, year, department, limit } = req.query;
    const currentEmpId = await getAuthenticatedEmployeeId(req.user).catch(() => null);

    const leaderboard = await attendanceService.getMonthlyLeaderboard({
      month,
      year,
      department: department && department !== "all" ? department : undefined,
      limit: limit || 500,
      currentEmployeeId: currentEmpId,
    });

    // Determine current user's profile and department
    let myRank = null;
    let myDepartment = null;
    let myDepartmentRank = null;

    if (currentEmpId) {
      const empRes = await pool.query("SELECT department FROM employees WHERE id = $1", [currentEmpId]);
      if (empRes.rows.length > 0) {
        myDepartment = empRes.rows[0].department;
      }

      const match = leaderboard.rankings.find((r) => r.employee_id === currentEmpId);
      if (match) {
        myRank = match;
      }

      // If user is currently viewing "All Company", also compute their rank within their own department
      if (myDepartment && (!department || department === "all")) {
        const deptBoard = await attendanceService.getMonthlyLeaderboard({
          month,
          year,
          department: myDepartment,
          limit: 500,
        });
        const deptMatch = deptBoard.rankings.find((r) => r.employee_id === currentEmpId);
        if (deptMatch) {
          myDepartmentRank = deptMatch.rank;
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: "Monthly attendance leaderboard retrieved successfully",
      data: {
        ...leaderboard,
        myRank,
        myDepartment,
        myDepartmentRank,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/attendance/me
 * Allowed: Any authenticated user
 */
router.get("/me", authenticate, async (req, res, next) => {
  try {
    const employeeId = await getAuthenticatedEmployeeId(req.user);
    if (!employeeId) {
      return res.status(404).json({
        success: false,
        message: "Employee profile not found",
      });
    }

    const { from_date, to_date, status, page, limit } = req.query;

    const result = await attendanceService.getEmployeeAttendance(employeeId, {
      from_date,
      to_date,
      status,
      page,
      limit,
    });

    return res.status(200).json({
      success: true,
      message: "Attendance retrieved successfully",
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/attendance/check-in
 * Allowed: any authenticated user
 */
router.post("/check-in", authenticate, async (req, res, next) => {
  try {
    let targetEmployeeId = null;

    if (req.body && req.body.employee_id && (req.user.role === "admin" || req.user.role === "hr_manager" || req.user.role === "hr_payroll_manager" || req.user.role === "hr_payroll_user")) {
      targetEmployeeId = parseId(req.body.employee_id);
    }

    if (!targetEmployeeId) {
      targetEmployeeId = await getAuthenticatedEmployeeId(req.user);
    }

    if (!targetEmployeeId) {
      return res.status(400).json({
        success: false,
        message: "Could not identify employee profile for attendance",
      });
    }

    const attendance = await attendanceService.checkIn(targetEmployeeId, req.body?.date);

    return res.status(200).json({
      success: true,
      message: "Checked in successfully",
      data: attendance,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/attendance/check-out
 * Allowed: any authenticated user
 */
router.post("/check-out", authenticate, async (req, res, next) => {
  try {
    let targetEmployeeId = null;

    if (req.body && req.body.employee_id && (req.user.role === "admin" || req.user.role === "hr_manager" || req.user.role === "hr_payroll_manager" || req.user.role === "hr_payroll_user")) {
      targetEmployeeId = parseId(req.body.employee_id);
    }

    if (!targetEmployeeId) {
      targetEmployeeId = await getAuthenticatedEmployeeId(req.user);
    }

    if (!targetEmployeeId) {
      return res.status(400).json({
        success: false,
        message: "Could not identify employee profile for attendance",
      });
    }

    const attendance = await attendanceService.checkOut(targetEmployeeId, req.body?.date);

    return res.status(200).json({
      success: true,
      message: "Checked out successfully",
      data: attendance,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/attendance
 * Allowed: admin, hr_manager, hr_payroll_manager, hr_payroll_user
 */
router.get(
  "/",
  authenticate,
  requireRole("admin", "hr_manager", "hr_payroll_manager", "hr_payroll_user"),
  async (req, res, next) => {
    try {
      const {
        employee_id,
        date,
        from_date,
        to_date,
        status,
        department,
        page,
        limit,
      } = req.query;

      const result = await attendanceService.listAttendance({
        employee_id: employee_id ? parseId(employee_id) : undefined,
        date,
        from_date,
        to_date,
        status,
        department,
        page,
        limit,
      });

      return res.status(200).json({
        success: true,
        message: "Attendance retrieved successfully",
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/attendance/:id
 * Allowed: admin, hr_manager, hr_payroll_manager, hr_payroll_user, or employee (if own attendance)
 */
router.get("/:id", authenticate, async (req, res, next) => {
  try {
    const attendanceId = parseId(req.params.id);
    if (!attendanceId) {
      return res.status(400).json({
        success: false,
        message: "Invalid attendance ID",
      });
    }

    const attendance = await attendanceService.getAttendanceById(attendanceId);

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found",
      });
    }

    // Role check: employee can only view their own record
    if (req.user.role === "employee" && attendance.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to access this attendance record",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Attendance retrieved successfully",
      data: attendance,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/attendance
 * Allowed: admin, hr_manager, hr_payroll_manager, hr_payroll_user
 */
router.post(
  "/",
  authenticate,
  requireRole("admin", "hr_manager", "hr_payroll_manager", "hr_payroll_user"),
  async (req, res, next) => {
    try {
      const { employee_id, date, check_in, check_out, status } = req.body;

      if (!employee_id || !date) {
        return res.status(400).json({
          success: false,
          message: "employee_id and date are required",
        });
      }

      const parsedEmpId = parseId(employee_id);
      if (!parsedEmpId) {
        return res.status(400).json({
          success: false,
          message: "Invalid employee ID",
        });
      }

      const created = await attendanceService.createAttendance({
        employee_id: parsedEmpId,
        date,
        check_in,
        check_out,
        status,
      });

      return res.status(201).json({
        success: true,
        message: "Attendance created successfully",
        data: created,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/v1/attendance/:id
 * Allowed: admin, hr_manager, hr_payroll_manager, hr_payroll_user
 */
router.put(
  "/:id",
  authenticate,
  requireRole("admin", "hr_manager", "hr_payroll_manager", "hr_payroll_user"),
  async (req, res, next) => {
    try {
      const attendanceId = parseId(req.params.id);
      if (!attendanceId) {
        return res.status(400).json({
          success: false,
          message: "Invalid attendance ID",
        });
      }

      const updated = await attendanceService.updateAttendance(attendanceId, req.body);

      return res.status(200).json({
        success: true,
        message: "Attendance updated successfully",
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
