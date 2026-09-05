import express from "express";
import { authenticate, requireRole } from "../middleware/auth.js";
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
 * Helper to retrieve employee ID for authenticated user
 */
const getAuthenticatedEmployeeId = async (userId) => {
  const empRes = await pool.query("SELECT id FROM employees WHERE user_id = $1", [userId]);
  if (empRes.rows.length === 0) return null;
  return empRes.rows[0].id;
};

/**
 * GET /api/v1/attendance/me
 * Allowed: Any authenticated user with an employee record
 * NOTE: Registered before /:id to prevent route collision
 */
router.get("/me", authenticate, async (req, res, next) => {
  try {
    const employeeId = await getAuthenticatedEmployeeId(req.user.id);
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
 * Allowed: employee, admin, hr_manager, hr_payroll_manager
 * NOTE: Registered before /:id
 */
router.post("/check-in", authenticate, async (req, res, next) => {
  try {
    let targetEmployeeId;

    if (req.user.role === "employee") {
      targetEmployeeId = await getAuthenticatedEmployeeId(req.user.id);
      if (!targetEmployeeId) {
        return res.status(404).json({
          success: false,
          message: "Employee profile not found",
        });
      }
    } else {
      // Admin / HR Manager / Payroll Manager can check-in on behalf of an employee or themselves
      if (req.body.employee_id) {
        targetEmployeeId = parseId(req.body.employee_id);
        if (!targetEmployeeId) {
          return res.status(400).json({
            success: false,
            message: "Invalid employee ID",
          });
        }
      } else {
        targetEmployeeId = await getAuthenticatedEmployeeId(req.user.id);
        if (!targetEmployeeId) {
          return res.status(400).json({
            success: false,
            message: "employee_id is required",
          });
        }
      }
    }

    const attendance = await attendanceService.checkIn(targetEmployeeId, req.body.date);

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
 * Allowed: employee, admin, hr_manager, hr_payroll_manager
 * NOTE: Registered before /:id
 */
router.post("/check-out", authenticate, async (req, res, next) => {
  try {
    let targetEmployeeId;

    if (req.user.role === "employee") {
      targetEmployeeId = await getAuthenticatedEmployeeId(req.user.id);
      if (!targetEmployeeId) {
        return res.status(404).json({
          success: false,
          message: "Employee profile not found",
        });
      }
    } else {
      if (req.body.employee_id) {
        targetEmployeeId = parseId(req.body.employee_id);
        if (!targetEmployeeId) {
          return res.status(400).json({
            success: false,
            message: "Invalid employee ID",
          });
        }
      } else {
        targetEmployeeId = await getAuthenticatedEmployeeId(req.user.id);
        if (!targetEmployeeId) {
          return res.status(400).json({
            success: false,
            message: "employee_id is required",
          });
        }
      }
    }

    const attendance = await attendanceService.checkOut(targetEmployeeId, req.body.date);

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
 * Allowed: admin, hr_manager, hr_payroll_manager
 */
router.get(
  "/",
  authenticate,
  requireRole("admin", "hr_manager", "hr_payroll_manager"),
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
 * Allowed: admin, hr_manager, hr_payroll_manager, or employee (if own attendance)
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
 * Allowed: admin, hr_manager, hr_payroll_manager
 */
router.post(
  "/",
  authenticate,
  requireRole("admin", "hr_manager", "hr_payroll_manager"),
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
 * Allowed: admin, hr_manager, hr_payroll_manager
 */
router.put(
  "/:id",
  authenticate,
  requireRole("admin", "hr_manager", "hr_payroll_manager"),
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
