import express from "express";
import { authenticate, requireRole } from "../middleware/auth.middleware.js";
import reportService from "../services/reportService.js";

const router = express.Router();

const ALLOWED_ROLES = ["admin", "hr_manager", "hr_payroll_manager", "hr_payroll_user"];

// Protect all report endpoints
router.use(authenticate, requireRole(...ALLOWED_ROLES));

/**
 * 1. GET /api/v1/reports/dashboard
 * High-level HR & Payroll dashboard statistics
 */
router.get("/dashboard", async (req, res, next) => {
  try {
    const data = await reportService.getDashboard();

    return res.status(200).json({
      success: true,
      message: "Dashboard report retrieved successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 2. GET /api/v1/reports/payroll-summary
 * Summary of payruns, payslips, and salary totals
 */
router.get("/payroll-summary", async (req, res, next) => {
  try {
    const { payrun_id, from_date, to_date } = req.query;

    const data = await reportService.getPayrollSummary({
      payrun_id,
      from_date,
      to_date,
    });

    return res.status(200).json({
      success: true,
      message: "Payroll summary report retrieved successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 3. GET /api/v1/reports/employee-summary
 * Employee demographic overview by status, department, and employment type
 */
router.get("/employee-summary", async (req, res, next) => {
  try {
    const data = await reportService.getEmployeeSummary();

    return res.status(200).json({
      success: true,
      message: "Employee summary report retrieved successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 4. GET /api/v1/reports/attendance-summary
 * Attendance overview with optional filters and daily grouped breakdown
 */
router.get("/attendance-summary", async (req, res, next) => {
  try {
    const { date, from_date, to_date, employee_id } = req.query;

    const data = await reportService.getAttendanceSummary({
      date,
      from_date,
      to_date,
      employee_id,
    });

    return res.status(200).json({
      success: true,
      message: "Attendance summary report retrieved successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 5. GET /api/v1/reports/time-off-summary
 * Leave / Time off metrics breakdown by status and type
 */
router.get("/time-off-summary", async (req, res, next) => {
  try {
    const { from_date, to_date, employee_id, time_off_type_id } = req.query;

    const data = await reportService.getTimeOffSummary({
      from_date,
      to_date,
      employee_id,
      time_off_type_id,
    });

    return res.status(200).json({
      success: true,
      message: "Time-off summary report retrieved successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 6. GET /api/v1/reports/department-cost
 * Payroll costs grouped by department
 */
router.get("/department-cost", async (req, res, next) => {
  try {
    const { period_start, period_end } = req.query;

    const data = await reportService.getDepartmentCost({
      period_start,
      period_end,
    });

    return res.status(200).json({
      success: true,
      message: "Department cost report retrieved successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 7. GET /api/v1/reports/employee-history/:employeeId
 * Employee wage and slip historical progression
 */
router.get("/employee-history/:employeeId", async (req, res, next) => {
  try {
    const data = await reportService.getEmployeePayrollHistory(req.params.employeeId);

    return res.status(200).json({
      success: true,
      message: "Employee payroll history retrieved successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
