import express from "express";
import { authenticate, requireRole } from "../middleware/auth.middleware.js";
import timeOffService from "../services/timeOffService.js";
import pool from "../db.js";

const router = express.Router();

const parseId = (id) => {
  const parsed = parseInt(id, 10);
  if (isNaN(parsed) || parsed <= 0 || String(parsed) !== String(id)) {
    return null;
  }
  return parsed;
};

const getAuthenticatedEmployeeId = async (userId) => {
  const empRes = await pool.query("SELECT id FROM employees WHERE user_id = $1", [userId]);
  if (empRes.rows.length === 0) return null;
  return empRes.rows[0].id;
};

// ==========================================
// 1. LEAVE TYPES ROUTES
// ==========================================

/**
 * GET /api/v1/time-off/types
 * Allowed: all authenticated users
 */
router.get("/types", authenticate, async (req, res, next) => {
  try {
    const types = await timeOffService.listTimeOffTypes();
    return res.status(200).json({
      success: true,
      message: "Leave types retrieved successfully",
      data: types,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/time-off/types
 * Allowed: admin, hr_manager
 */
router.post(
  "/types",
  authenticate,
  requireRole("admin", "hr_manager"),
  async (req, res, next) => {
    try {
      const type = await timeOffService.createTimeOffType(req.body);
      return res.status(201).json({
        success: true,
        message: "Leave type created successfully",
        data: type,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/v1/time-off/types/:id
 * Allowed: admin, hr_manager
 */
router.put(
  "/types/:id",
  authenticate,
  requireRole("admin", "hr_manager"),
  async (req, res, next) => {
    try {
      const typeId = parseId(req.params.id);
      if (!typeId) {
        return res.status(400).json({
          success: false,
          message: "Invalid leave type ID",
        });
      }

      const updated = await timeOffService.updateTimeOffType(typeId, req.body);
      return res.status(200).json({
        success: true,
        message: "Leave type updated successfully",
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ==========================================
// 2. LEAVE ALLOCATIONS ROUTES
// ==========================================

/**
 * GET /api/v1/time-off/allocations/me
 * Allowed: employee, admin, hr_manager, hr_payroll_manager
 * NOTE: Registered before /allocations
 */
router.get("/allocations/me", authenticate, async (req, res, next) => {
  try {
    const { type_id, page, limit } = req.query;
    const result = await timeOffService.getMyAllocations(req.user.id, {
      type_id: type_id ? parseId(type_id) : undefined,
      page,
      limit,
    });

    return res.status(200).json({
      success: true,
      message: "Leave allocations retrieved successfully",
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/time-off/allocations
 * Allowed: admin, hr_manager, hr_payroll_manager
 */
router.get(
  "/allocations",
  authenticate,
  requireRole("admin", "hr_manager", "hr_payroll_manager"),
  async (req, res, next) => {
    try {
      const { employee_id, type_id, page, limit } = req.query;
      const result = await timeOffService.listAllocations({
        employee_id: employee_id ? parseId(employee_id) : undefined,
        type_id: type_id ? parseId(type_id) : undefined,
        page,
        limit,
      });

      return res.status(200).json({
        success: true,
        message: "Leave allocations retrieved successfully",
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/time-off/allocations
 * Allowed: admin, hr_manager
 */
router.post(
  "/allocations",
  authenticate,
  requireRole("admin", "hr_manager"),
  async (req, res, next) => {
    try {
      const allocation = await timeOffService.createAllocation(req.body);
      return res.status(201).json({
        success: true,
        message: "Leave allocation created successfully",
        data: allocation,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/v1/time-off/allocations/:id
 * Allowed: admin, hr_manager
 */
router.put(
  "/allocations/:id",
  authenticate,
  requireRole("admin", "hr_manager"),
  async (req, res, next) => {
    try {
      const allocId = parseId(req.params.id);
      if (!allocId) {
        return res.status(400).json({
          success: false,
          message: "Invalid allocation ID",
        });
      }

      const updated = await timeOffService.updateAllocation(allocId, req.body);
      return res.status(200).json({
        success: true,
        message: "Leave allocation updated successfully",
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ==========================================
// 3. LEAVE REQUESTS ROUTES
// ==========================================

/**
 * GET /api/v1/time-off/requests/me
 * Allowed: employee, admin, hr_manager, hr_payroll_manager
 * NOTE: Registered before /requests/:id
 */
router.get("/requests/me", authenticate, async (req, res, next) => {
  try {
    const { status, from_date, to_date, page, limit } = req.query;
    const result = await timeOffService.getMyRequests(req.user.id, {
      status,
      from_date,
      to_date,
      page,
      limit,
    });

    return res.status(200).json({
      success: true,
      message: "Leave requests retrieved successfully",
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/time-off/requests
 * Allowed: admin, hr_manager, hr_payroll_manager
 */
router.get(
  "/requests",
  authenticate,
  requireRole("admin", "hr_manager", "hr_payroll_manager"),
  async (req, res, next) => {
    try {
      const { employee_id, type_id, status, from_date, to_date, page, limit } = req.query;
      const result = await timeOffService.listRequests({
        employee_id: employee_id ? parseId(employee_id) : undefined,
        type_id: type_id ? parseId(type_id) : undefined,
        status,
        from_date,
        to_date,
        page,
        limit,
      });

      return res.status(200).json({
        success: true,
        message: "Leave requests retrieved successfully",
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/time-off/requests/:id
 * Allowed: admin, hr_manager, hr_payroll_manager, employee (own request only)
 */
router.get("/requests/:id", authenticate, async (req, res, next) => {
  try {
    const requestId = parseId(req.params.id);
    if (!requestId) {
      return res.status(400).json({
        success: false,
        message: "Invalid request ID",
      });
    }

    const request = await timeOffService.getRequestById(requestId);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Leave request not found",
      });
    }

    if (req.user.role === "employee" && request.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to access this leave request",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Leave request retrieved successfully",
      data: request,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/time-off/requests
 * Allowed: all authenticated users
 */
router.post("/requests", authenticate, async (req, res, next) => {
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

    const created = await timeOffService.createRequest({
      employee_id: targetEmployeeId,
      time_off_type_id: parseId(req.body.time_off_type_id),
      start_date: req.body.start_date,
      end_date: req.body.end_date,
      reason: req.body.reason,
    });

    return res.status(201).json({
      success: true,
      message: "Leave request created successfully",
      data: created,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/v1/time-off/requests/:id/approve
 * Allowed: admin, hr_manager, hr_payroll_manager
 */
router.patch(
  "/requests/:id/approve",
  authenticate,
  requireRole("admin", "hr_manager", "hr_payroll_manager"),
  async (req, res, next) => {
    try {
      const requestId = parseId(req.params.id);
      if (!requestId) {
        return res.status(400).json({
          success: false,
          message: "Invalid request ID",
        });
      }

      const approved = await timeOffService.approveRequest(requestId, req.user.id);
      return res.status(200).json({
        success: true,
        message: "Leave request approved successfully",
        data: approved,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/v1/time-off/requests/:id/reject
 * Allowed: admin, hr_manager, hr_payroll_manager
 */
router.patch(
  "/requests/:id/reject",
  authenticate,
  requireRole("admin", "hr_manager", "hr_payroll_manager"),
  async (req, res, next) => {
    try {
      const requestId = parseId(req.params.id);
      if (!requestId) {
        return res.status(400).json({
          success: false,
          message: "Invalid request ID",
        });
      }

      const rejected = await timeOffService.rejectRequest(requestId, req.body.reason);
      return res.status(200).json({
        success: true,
        message: "Leave request rejected successfully",
        data: rejected,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/v1/time-off/requests/:id/cancel
 * Allowed: employee, admin, hr_manager
 */
router.patch(
  "/requests/:id/cancel",
  authenticate,
  requireRole("employee", "admin", "hr_manager"),
  async (req, res, next) => {
    try {
      const requestId = parseId(req.params.id);
      if (!requestId) {
        return res.status(400).json({
          success: false,
          message: "Invalid request ID",
        });
      }

      const cancelled = await timeOffService.cancelRequest(requestId, req.user);
      return res.status(200).json({
        success: true,
        message: "Leave request cancelled successfully",
        data: cancelled,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;