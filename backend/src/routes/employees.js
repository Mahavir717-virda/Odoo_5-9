const express = require("express");
const { authenticate, requireRole } = require("../middleware/auth");
const employeeService = require("../services/employeeService");

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

module.exports = router;
