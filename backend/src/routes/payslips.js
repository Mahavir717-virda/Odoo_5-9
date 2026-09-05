import express from "express";
import { authenticate, requireRole } from "../middleware/auth.js";
import payrollService from "../services/payrollService.js";
import pool from "../db.js";

const router = express.Router();

const parseId = (id) => {
  const parsed = parseInt(id, 10);
  if (isNaN(parsed) || parsed <= 0 || String(parsed) !== String(id)) {
    return null;
  }
  return parsed;
};

const VIEW_ROLES = ["admin", "hr_manager", "hr_payroll_manager"];
const CALC_ROLES = ["admin", "hr_payroll_manager"];

/**
 * Helper to fetch authenticated employee's ID
 */
const getAuthenticatedEmployeeId = async (userId) => {
  const empRes = await pool.query("SELECT id FROM employees WHERE user_id = $1", [userId]);
  if (empRes.rows.length === 0) return null;
  return empRes.rows[0].id;
};

/**
 * GET /api/v1/payslips/me
 * Allowed: employee, admin, hr_manager, hr_payroll_manager
 * NOTE: Registered before /:id to prevent route collision
 */
router.get("/me", authenticate, async (req, res, next) => {
  try {
    const employeeId = await getAuthenticatedEmployeeId(req.user.id);
    if (!employeeId) {
      return res.status(404).json({
        success: false,
        message: "Employee profile not found for the authenticated user",
      });
    }

    const { payrun_id, page, limit } = req.query;

    const result = await payrollService.getEmployeePayslips(employeeId, {
      payrun_id,
      page,
      limit,
    });

    return res.status(200).json({
      success: true,
      message: "My payslips retrieved successfully",
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/payslips
 * Allowed: admin, hr_manager, hr_payroll_manager
 */
router.get(
  "/",
  authenticate,
  requireRole(...VIEW_ROLES),
  async (req, res, next) => {
    try {
      const { payrun_id, employee_id, status, page, limit } = req.query;

      const result = await payrollService.listPayslips({
        payrun_id,
        employee_id,
        status,
        page,
        limit,
      });

      return res.status(200).json({
        success: true,
        message: "Payslips retrieved successfully",
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/payslips/:id
 * Allowed: admin, hr_manager, hr_payroll_manager (any), employee (own payslip only)
 */
router.get("/:id", authenticate, async (req, res, next) => {
  try {
    const payslipId = parseId(req.params.id);
    if (!payslipId) {
      return res.status(400).json({
        success: false,
        message: "Invalid payslip ID",
      });
    }

    const payslip = await payrollService.getPayslipById(payslipId);
    if (!payslip) {
      return res.status(404).json({
        success: false,
        message: "Payslip not found",
      });
    }

    // Role check: employees can only view their own payslip
    if (req.user.role === "employee" && payslip.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to access this payslip",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Payslip retrieved successfully",
      data: payslip,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/payslips/:id/recalculate
 * Allowed: admin, hr_payroll_manager
 */
router.post(
  "/:id/recalculate",
  authenticate,
  requireRole(...CALC_ROLES),
  async (req, res, next) => {
    try {
      const payslipId = parseId(req.params.id);
      if (!payslipId) {
        return res.status(400).json({
          success: false,
          message: "Invalid payslip ID",
        });
      }

      const recalculated = await payrollService.recalculatePayslip(payslipId);

      return res.status(200).json({
        success: true,
        message: "Payslip recalculated successfully",
        data: recalculated,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;