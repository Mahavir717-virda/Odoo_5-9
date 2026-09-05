import express from "express";
import { authenticate, requireRole } from "../middleware/auth.middleware.js";
import salaryStructureService from "../services/salaryStructureService.js";

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
 * GET /api/v1/salary-structures
 * Allowed: admin, hr_manager, hr_payroll_manager, hr_payroll_user
 */
router.get(
  "/",
  authenticate,
  requireRole(...ALLOWED_ROLES),
  async (req, res, next) => {
    try {
      const { search, page, limit } = req.query;

      const result = await salaryStructureService.listSalaryStructures({
        search,
        page,
        limit,
      });

      return res.status(200).json({
        success: true,
        message: "Salary structures retrieved successfully",
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/salary-structures/:id
 * Allowed: admin, hr_manager, hr_payroll_manager, hr_payroll_user
 */
router.get(
  "/:id",
  authenticate,
  requireRole(...ALLOWED_ROLES),
  async (req, res, next) => {
    try {
      const structureId = parseId(req.params.id);
      if (!structureId) {
        return res.status(400).json({
          success: false,
          message: "Invalid salary structure ID",
        });
      }

      const structure = await salaryStructureService.getSalaryStructureById(structureId);
      if (!structure) {
        return res.status(404).json({
          success: false,
          message: "Salary structure not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Salary structure retrieved successfully",
        data: structure,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/salary-structures
 * Allowed: admin, hr_manager, hr_payroll_manager
 */
router.post(
  "/",
  authenticate,
  requireRole(...WRITE_ROLES),
  async (req, res, next) => {
    try {
      const created = await salaryStructureService.createSalaryStructure(req.body);

      return res.status(201).json({
        success: true,
        message: "Salary structure created successfully",
        data: created,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/v1/salary-structures/:id
 * Allowed: admin, hr_manager, hr_payroll_manager
 */
router.put(
  "/:id",
  authenticate,
  requireRole(...WRITE_ROLES),
  async (req, res, next) => {
    try {
      const structureId = parseId(req.params.id);
      if (!structureId) {
        return res.status(400).json({
          success: false,
          message: "Invalid salary structure ID",
        });
      }

      const updated = await salaryStructureService.updateSalaryStructure(
        structureId,
        req.body
      );

      return res.status(200).json({
        success: true,
        message: "Salary structure updated successfully",
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/v1/salary-structures/:id/activate
 * Allowed: admin, hr_manager, hr_payroll_manager
 */
router.patch(
  "/:id/activate",
  authenticate,
  requireRole(...WRITE_ROLES),
  async (req, res, next) => {
    try {
      const structureId = parseId(req.params.id);
      if (!structureId) {
        return res.status(400).json({
          success: false,
          message: "Invalid salary structure ID",
        });
      }

      const activated = await salaryStructureService.activateSalaryStructure(structureId);

      return res.status(200).json({
        success: true,
        message: "Salary structure activated successfully",
        data: activated,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/v1/salary-structures/:id/deactivate
 * Allowed: admin, hr_manager, hr_payroll_manager
 */
router.patch(
  "/:id/deactivate",
  authenticate,
  requireRole(...WRITE_ROLES),
  async (req, res, next) => {
    try {
      const structureId = parseId(req.params.id);
      if (!structureId) {
        return res.status(400).json({
          success: false,
          message: "Invalid salary structure ID",
        });
      }

      const deactivated = await salaryStructureService.deactivateSalaryStructure(structureId);

      return res.status(200).json({
        success: true,
        message: "Salary structure deactivated successfully",
        data: deactivated,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
