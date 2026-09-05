import express from "express";
import { authenticate, requireRole } from "../middleware/auth.js";
import employeeService from "../services/employeeService.js";

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
 * GET /api/v1/employees/me
 * Allowed: Any authenticated user with an employee record
 * NOTE: Registered BEFORE /:id to prevent matching /me as an ID
 */
router.get("/me", authenticate, async (req, res, next) => {
  try {
    const employee = await employeeService.getMyEmployeeProfile(req.user.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: employee,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/employees
 * Allowed: admin, hr_manager, hr_payroll_manager
 */
router.get(
  "/",
  authenticate,
  requireRole("admin", "hr_manager", "hr_payroll_manager"),
  async (req, res, next) => {
    try {
      const { department, status, employee_type, search } = req.query;

      const employees = await employeeService.listEmployees({
        department,
        status,
        employee_type,
        search,
      });

      return res.status(200).json({
        success: true,
        data: {
          employees,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/employees/:employeeId/contracts
 * Allowed: admin, hr_manager, hr_payroll_manager, or employee (if own contracts)
 */
router.get("/:employeeId/contracts", authenticate, async (req, res, next) => {
  try {
    const employeeId = parseId(req.params.employeeId);
    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: "Invalid employee ID",
      });
    }

    const employee = await employeeService.getEmployeeById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    if (req.user.role === "employee" && employee.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to access these contracts",
      });
    }

    const pool = (await import("../db.js")).default;
    const query = `
      SELECT 
        c.id,
        c.employee_id,
        e.name AS employee_name,
        e.email AS employee_email,
        c.start_date,
        c.end_date,
        c.wage,
        c.structure_id,
        ss.name AS structure_name,
        c.department,
        c.job_position,
        c.status,
        c.created_at,
        c.updated_at
      FROM contracts c
      JOIN employees e ON c.employee_id = e.id
      JOIN salary_structures ss ON c.structure_id = ss.id
      WHERE c.employee_id = $1
      ORDER BY c.start_date DESC
    `;
    const result = await pool.query(query, [employeeId]);

    return res.status(200).json({
      success: true,
      data: {
        contracts: result.rows.map((row) => ({
          id: row.id,
          employee_id: row.employee_id,
          employee: {
            id: row.employee_id,
            name: row.employee_name,
            email: row.employee_email,
          },
          start_date: row.start_date,
          end_date: row.end_date,
          wage: row.wage,
          structure_id: row.structure_id,
          structure_name: row.structure_name,
          department: row.department,
          job_position: row.job_position,
          status: row.status,
          created_at: row.created_at,
          updated_at: row.updated_at,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/employees/:employeeId/attendance
 * Allowed: admin, hr_manager, hr_payroll_manager
 */
router.get(
  "/:employeeId/attendance",
  authenticate,
  requireRole("admin", "hr_manager", "hr_payroll_manager"),
  async (req, res, next) => {
    try {
      const employeeId = parseId(req.params.employeeId);
      if (!employeeId) {
        return res.status(400).json({
          success: false,
          message: "Invalid employee ID",
        });
      }

      const attendanceService = (await import("../services/attendanceService.js")).default;
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
  }
);

/**
 * GET /api/v1/employees/:id
 * Allowed: admin, hr_manager, hr_payroll_manager (any employee), employee (only their own)
 */
router.get("/:id", authenticate, async (req, res, next) => {
  try {
    const employeeId = parseId(req.params.id);
    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: "Invalid employee ID",
      });
    }

    const employee = await employeeService.getEmployeeById(employeeId);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    // Role check: employees can only view their own profile
    if (req.user.role === "employee" && employee.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to access this employee",
      });
    }

    return res.status(200).json({
      success: true,
      data: employee,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/employees
 * Allowed: admin, hr_manager
 */
router.post(
  "/",
  authenticate,
  requireRole("admin", "hr_manager"),
  async (req, res, next) => {
    try {
      const {
        name,
        email,
        phone,
        department,
        manager_id,
        job_position,
        employee_type,
        schedule_id,
        joining_date,
        status,
      } = req.body;

      if (
        !name ||
        !email ||
        !department ||
        !job_position ||
        !employee_type ||
        !schedule_id ||
        !joining_date
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Missing required fields: name, email, department, job_position, employee_type, schedule_id, joining_date",
        });
      }

      const created = await employeeService.createEmployee({
        name,
        email,
        phone,
        department,
        manager_id,
        job_position,
        employee_type,
        schedule_id,
        joining_date,
        status,
      });

      return res.status(201).json({
        success: true,
        message: "Employee created successfully",
        data: {
          employee: created,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/v1/employees/:id
 * Allowed: admin, hr_manager, hr_payroll_manager
 */
router.put(
  "/:id",
  authenticate,
  requireRole("admin", "hr_manager", "hr_payroll_manager"),
  async (req, res, next) => {
    try {
      const employeeId = parseId(req.params.id);
      if (!employeeId) {
        return res.status(400).json({
          success: false,
          message: "Invalid employee ID",
        });
      }

      const updated = await employeeService.updateEmployee(employeeId, req.body);

      return res.status(200).json({
        success: true,
        message: "Employee updated successfully",
        data: {
          employee: updated,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/v1/employees/:id/deactivate
 * Allowed: admin, hr_manager
 */
router.patch(
  "/:id/deactivate",
  authenticate,
  requireRole("admin", "hr_manager"),
  async (req, res, next) => {
    try {
      const employeeId = parseId(req.params.id);
      if (!employeeId) {
        return res.status(400).json({
          success: false,
          message: "Invalid employee ID",
        });
      }

      await employeeService.deactivateEmployee(employeeId);

      return res.status(200).json({
        success: true,
        message: "Employee deactivated successfully",
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/v1/employees/:id/reactivate
 * Allowed: admin, hr_manager
 */
router.patch(
  "/:id/reactivate",
  authenticate,
  requireRole("admin", "hr_manager"),
  async (req, res, next) => {
    try {
      const employeeId = parseId(req.params.id);
      if (!employeeId) {
        return res.status(400).json({
          success: false,
          message: "Invalid employee ID",
        });
      }

      await employeeService.reactivateEmployee(employeeId);

      return res.status(200).json({
        success: true,
        message: "Employee reactivated successfully",
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
