import express from "express";
import { authenticate } from "../middleware/auth.js";
import payslipService from "../services/payslipService.js";
import pool from "../db.js";

const router = express.Router();

/**
 * Helper to retrieve employee ID for authenticated user
 */
const getAuthenticatedEmployeeId = async (userId) => {
  const empRes = await pool.query("SELECT id FROM employees WHERE user_id = $1", [userId]);
  if (empRes.rows.length === 0) return null;
  return empRes.rows[0].id;
};

/**
 * GET /api/v1/payslips/me
 * Get current employee's payslips and YTD summary
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

    const data = await payslipService.getEmployeePayslips(employeeId);
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/payslips/:id
 * Get details for a single payslip
 */
router.get("/:id", authenticate, async (req, res, next) => {
  try {
    const employeeId = await getAuthenticatedEmployeeId(req.user.id);
    if (!employeeId) {
      return res.status(404).json({
        success: false,
        message: "Employee profile not found",
      });
    }

    const payslip = await payslipService.getPayslipById(employeeId, req.params.id);
    return res.status(200).json({
      success: true,
      data: payslip,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
