import express from "express";
import { authenticate, requireRole } from "../middleware/auth.middleware.js";
import salaryRuleService from "../services/salaryRuleService.js";

const router = express.Router();

const parseId = (id) => {
  const parsed = parseInt(id, 10);
  if (isNaN(parsed) || parsed <= 0 || String(parsed) !== String(id)) {
    return null;
  }
  return parsed;
};

const ALLOWED_ROLES = ["admin", "hr_manager", "hr_payroll_manager", "hr_payroll_user"];
const WRITE_ROLES = ["admin", "hr_manager", "hr_payroll_manager"];

/**
 * GET /api/v1/salary-rules
 * Allowed: admin, hr_manager, hr_payroll_manager, hr_payroll_user
 */
router.get(
  "/",
  authenticate,
  requireRole(...ALLOWED_ROLES),
  async (req, res, next) => {
    try {
      const { category, type, search, page, limit } = req.query;

      const result = await salaryRuleService.listSalaryRules({
        category,
        type,
        search,
        page,
        limit,
      });

      return res.status(200).json({
        success: true,
        message: "Salary rules retrieved successfully",
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/salary-rules/:id
 * Allowed: admin, hr_manager, hr_payroll_manager, hr_payroll_user
 */
router.get(
  "/:id",
  authenticate,
  requireRole(...ALLOWED_ROLES),
  async (req, res, next) => {
    try {
      const ruleId = parseId(req.params.id);
      if (!ruleId) {
        return res.status(400).json({
          success: false,
          message: "Invalid salary rule ID",
        });
      }

      const rule = await salaryRuleService.getSalaryRuleById(ruleId);
      if (!rule) {
        return res.status(404).json({
          success: false,
          message: "Salary rule not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Salary rule retrieved successfully",
        data: rule,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/salary-rules
 * Allowed: admin, hr_manager, hr_payroll_manager
 */
router.post(
  "/",
  authenticate,
  requireRole(...WRITE_ROLES),
  async (req, res, next) => {
    try {
      const created = await salaryRuleService.createSalaryRule(req.body);

      return res.status(201).json({
        success: true,
        message: "Salary rule created successfully",
        data: created,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/v1/salary-rules/:id
 * Allowed: admin, hr_manager, hr_payroll_manager
 */
router.put(
  "/:id",
  authenticate,
  requireRole(...WRITE_ROLES),
  async (req, res, next) => {
    try {
      const ruleId = parseId(req.params.id);
      if (!ruleId) {
        return res.status(400).json({
          success: false,
          message: "Invalid salary rule ID",
        });
      }

      const updated = await salaryRuleService.updateSalaryRule(ruleId, req.body);

      return res.status(200).json({
        success: true,
        message: "Salary rule updated successfully",
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/v1/salary-rules/:id/activate
 * Allowed: admin, hr_manager, hr_payroll_manager
 */
router.patch(
  "/:id/activate",
  authenticate,
  requireRole(...WRITE_ROLES),
  async (req, res, next) => {
    try {
      const ruleId = parseId(req.params.id);
      if (!ruleId) {
        return res.status(400).json({
          success: false,
          message: "Invalid salary rule ID",
        });
      }

      const activated = await salaryRuleService.activateSalaryRule(ruleId);

      return res.status(200).json({
        success: true,
        message: "Salary rule activated successfully",
        data: activated,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/v1/salary-rules/:id/deactivate
 * Allowed: admin, hr_manager, hr_payroll_manager
 */
router.patch(
  "/:id/deactivate",
  authenticate,
  requireRole(...WRITE_ROLES),
  async (req, res, next) => {
    try {
      const ruleId = parseId(req.params.id);
      if (!ruleId) {
        return res.status(400).json({
          success: false,
          message: "Invalid salary rule ID",
        });
      }

      const deactivated = await salaryRuleService.deactivateSalaryRule(ruleId);

      return res.status(200).json({
        success: true,
        message: "Salary rule deactivated successfully",
        data: deactivated,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
