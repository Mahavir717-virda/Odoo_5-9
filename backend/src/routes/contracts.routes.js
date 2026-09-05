import express from "express";
import { authenticate, requireRole } from "../middleware/auth.middleware.js";
import contractService from "../services/contractService.js";
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
 * GET /api/v1/contracts/me
 * Allowed: Any authenticated user with an employee record
 * NOTE: Registered before /:id to avoid collision
 */
router.get("/me", authenticate, async (req, res, next) => {
  try {
    const contracts = await contractService.getMyContracts(req.user.id);

    return res.status(200).json({
      success: true,
      data: {
        contracts,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/contracts
 * Allowed: admin, hr_manager, hr_payroll_manager
 */
router.get(
  "/",
  authenticate,
  requireRole("admin", "hr_manager", "hr_payroll_manager"),
  async (req, res, next) => {
    try {
      const { employee_id, status, department, search } = req.query;

      const contracts = await contractService.listContracts({
        employee_id: employee_id ? parseId(employee_id) : undefined,
        status,
        department,
        search,
      });

      return res.status(200).json({
        success: true,
        data: {
          contracts,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/contracts/employees/:employeeId/contracts
 * or mounted as helper
 */
router.get("/employee/:employeeId", authenticate, async (req, res, next) => {
  try {
    const employeeId = parseId(req.params.employeeId);
    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: "Invalid employee ID",
      });
    }

    if (req.user.role === "employee") {
      const empRes = await pool.query("SELECT id FROM employees WHERE user_id = $1", [req.user.id]);
      if (empRes.rows.length === 0 || empRes.rows[0].id !== employeeId) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to access these contracts",
        });
      }
    }

    const contracts = await contractService.getEmployeeContracts(employeeId);

    return res.status(200).json({
      success: true,
      data: {
        contracts,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/contracts/:id
 * Allowed: admin, hr_manager, hr_payroll_manager, or employee (if own contract)
 */
router.get("/:id", authenticate, async (req, res, next) => {
  try {
    const contractId = parseId(req.params.id);
    if (!contractId) {
      return res.status(400).json({
        success: false,
        message: "Invalid contract ID",
      });
    }

    const contract = await contractService.getContractById(contractId);

    if (!contract) {
      return res.status(404).json({
        success: false,
        message: "Contract not found",
      });
    }

    // RBAC check: employees can only view their own contracts
    if (req.user.role === "employee" && contract.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to access this contract",
      });
    }

    return res.status(200).json({
      success: true,
      data: contract,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/contracts
 * Allowed: admin, hr_manager, hr_payroll_manager
 */
router.post(
  "/",
  authenticate,
  requireRole("admin", "hr_manager", "hr_payroll_manager"),
  async (req, res, next) => {
    try {
      const {
        employee_id,
        start_date,
        end_date,
        wage,
        structure_id,
        department,
        job_position,
        status,
      } = req.body;

      if (!employee_id || !start_date || wage === undefined || !structure_id) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields: employee_id, start_date, wage, structure_id",
        });
      }

      const created = await contractService.createContract({
        employee_id: parseId(employee_id),
        start_date,
        end_date,
        wage,
        structure_id: parseId(structure_id),
        department,
        job_position,
        status,
      });

      return res.status(201).json({
        success: true,
        message: "Contract created successfully",
        data: {
          contract: created,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/v1/contracts/:id
 * Allowed: admin, hr_manager, hr_payroll_manager
 */
router.put(
  "/:id",
  authenticate,
  requireRole("admin", "hr_manager", "hr_payroll_manager"),
  async (req, res, next) => {
    try {
      const contractId = parseId(req.params.id);
      if (!contractId) {
        return res.status(400).json({
          success: false,
          message: "Invalid contract ID",
        });
      }

      const updated = await contractService.updateContract(contractId, req.body);

      return res.status(200).json({
        success: true,
        message: "Contract updated successfully",
        data: {
          contract: updated,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/v1/contracts/:id/activate
 * Allowed: admin, hr_manager, hr_payroll_manager
 */
router.patch(
  "/:id/activate",
  authenticate,
  requireRole("admin", "hr_manager", "hr_payroll_manager"),
  async (req, res, next) => {
    try {
      const contractId = parseId(req.params.id);
      if (!contractId) {
        return res.status(400).json({
          success: false,
          message: "Invalid contract ID",
        });
      }

      const activated = await contractService.activateContract(contractId);

      return res.status(200).json({
        success: true,
        message: "Contract activated successfully",
        data: {
          contract: activated,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/v1/contracts/:id/terminate
 * Allowed: admin, hr_manager, hr_payroll_manager
 */
router.patch(
  "/:id/terminate",
  authenticate,
  requireRole("admin", "hr_manager", "hr_payroll_manager"),
  async (req, res, next) => {
    try {
      const contractId = parseId(req.params.id);
      if (!contractId) {
        return res.status(400).json({
          success: false,
          message: "Invalid contract ID",
        });
      }

      await contractService.terminateContract(contractId);

      return res.status(200).json({
        success: true,
        message: "Contract terminated successfully",
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
