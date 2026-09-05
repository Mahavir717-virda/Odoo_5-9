import express from "express";
import { authenticate, requireRole } from "../middleware/auth.middleware.js";
import payrollService from "../services/payrollService.js";

const router = express.Router();

const parseId = (id) => {
  const parsed = parseInt(id, 10);
  if (isNaN(parsed) || parsed <= 0 || String(parsed) !== String(id)) {
    return null;
  }
  return parsed;
};

const VIEW_ROLES = ["admin", "hr_manager", "hr_payroll_manager", "hr_payroll_user"];
const MANAGE_ROLES = ["admin", "hr_manager", "hr_payroll_manager", "hr_payroll_user"];
const CALC_ROLES = ["admin", "hr_payroll_manager", "hr_payroll_user"];

/**
 * GET /api/v1/payruns/:payrunId/payslips
 * Nested route for payrun payslips
 */
router.get(
  "/:payrunId/payslips",
  authenticate,
  requireRole(...VIEW_ROLES),
  async (req, res, next) => {
    try {
      const payrunId = parseId(req.params.payrunId);
      if (!payrunId) {
        return res.status(400).json({
          success: false,
          message: "Invalid payrun ID",
        });
      }

      const payslips = await payrollService.getPayrunPayslips(payrunId);

      return res.status(200).json({
        success: true,
        message: "Payrun payslips retrieved successfully",
        data: payslips,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/payruns
 * Allowed: admin, hr_manager, hr_payroll_manager
 */
router.get(
  "/",
  authenticate,
  requireRole(...VIEW_ROLES),
  async (req, res, next) => {
    try {
      const { status, from_date, to_date, page, limit } = req.query;

      const result = await payrollService.listPayruns({
        status,
        from_date,
        to_date,
        page,
        limit,
      });

      return res.status(200).json({
        success: true,
        message: "Payruns retrieved successfully",
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/payruns/:id
 * Allowed: admin, hr_manager, hr_payroll_manager
 */
router.get(
  "/:id",
  authenticate,
  requireRole(...VIEW_ROLES),
  async (req, res, next) => {
    try {
      const payrunId = parseId(req.params.id);
      if (!payrunId) {
        return res.status(400).json({
          success: false,
          message: "Invalid payrun ID",
        });
      }

      const payrun = await payrollService.getPayrunById(payrunId);
      if (!payrun) {
        return res.status(404).json({
          success: false,
          message: "Payrun not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Payrun retrieved successfully",
        data: payrun,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/payruns
 * Allowed: admin, hr_manager, hr_payroll_manager
 */
router.post(
  "/",
  authenticate,
  requireRole(...MANAGE_ROLES),
  async (req, res, next) => {
    try {
      const created = await payrollService.createPayrun(req.body);

      return res.status(201).json({
        success: true,
        message: "Payrun created successfully",
        data: created,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/v1/payruns/:id
 * Allowed: admin, hr_manager, hr_payroll_manager
 */
router.put(
  "/:id",
  authenticate,
  requireRole(...MANAGE_ROLES),
  async (req, res, next) => {
    try {
      const payrunId = parseId(req.params.id);
      if (!payrunId) {
        return res.status(400).json({
          success: false,
          message: "Invalid payrun ID",
        });
      }

      const updated = await payrollService.updatePayrun(payrunId, req.body);

      return res.status(200).json({
        success: true,
        message: "Payrun updated successfully",
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/payruns/:id/calculate
 * Allowed: admin, hr_payroll_manager
 */
router.post(
  "/:id/calculate",
  authenticate,
  requireRole(...CALC_ROLES),
  async (req, res, next) => {
    try {
      const payrunId = parseId(req.params.id);
      if (!payrunId) {
        return res.status(400).json({
          success: false,
          message: "Invalid payrun ID",
        });
      }

      const summary = await payrollService.calculatePayrun(payrunId);

      return res.status(200).json({
        success: true,
        message: "Payroll calculated successfully",
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/payruns/:id/finalize
 * Allowed: admin, hr_payroll_manager
 */
router.post(
  "/:id/finalize",
  authenticate,
  requireRole(...CALC_ROLES),
  async (req, res, next) => {
    try {
      const payrunId = parseId(req.params.id);
      if (!payrunId) {
        return res.status(400).json({
          success: false,
          message: "Invalid payrun ID",
        });
      }

      const finalized = await payrollService.finalizePayrun(payrunId);

      return res.status(200).json({
        success: true,
        message: "Payrun finalized successfully",
        data: finalized,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
