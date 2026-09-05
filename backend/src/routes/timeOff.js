import express from "express";
import { authenticate } from "../middleware/auth.js";
import timeOffService from "../services/timeOffService.js";
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
 * GET /api/v1/time-off/types
 * List all available time off types
 */
router.get("/types", authenticate, async (req, res, next) => {
  try {
    const types = await timeOffService.getTimeOffTypes();
    return res.status(200).json({
      success: true,
      data: types,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/time-off/allocations/me
 * Get current employee's leave balances & allocations
 */
router.get("/allocations/me", authenticate, async (req, res, next) => {
  try {
    const employeeId = await getAuthenticatedEmployeeId(req.user.id);
    if (!employeeId) {
      return res.status(404).json({
        success: false,
        message: "Employee profile not found",
      });
    }

    const allocations = await timeOffService.getEmployeeAllocations(employeeId);
    return res.status(200).json({
      success: true,
      data: allocations,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/time-off/requests/me
 * Get current employee's leave requests history
 */
router.get("/requests/me", authenticate, async (req, res, next) => {
  try {
    const employeeId = await getAuthenticatedEmployeeId(req.user.id);
    if (!employeeId) {
      return res.status(404).json({
        success: false,
        message: "Employee profile not found",
      });
    }

    const { status } = req.query;
    const requests = await timeOffService.getEmployeeRequests(employeeId, { status });
    return res.status(200).json({
      success: true,
      data: requests,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/time-off/requests
 * Submit a new leave request
 */
router.post("/requests", authenticate, async (req, res, next) => {
  try {
    const employeeId = await getAuthenticatedEmployeeId(req.user.id);
    if (!employeeId) {
      return res.status(404).json({
        success: false,
        message: "Employee profile not found",
      });
    }

    const { typeId, startDate, endDate, duration, reason } = req.body;

    if (!typeId || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "typeId, startDate, and endDate are required",
      });
    }

    const request = await timeOffService.createLeaveRequest(employeeId, {
      typeId: parseInt(typeId, 10),
      startDate,
      endDate,
      duration,
      reason,
    });

    return res.status(201).json({
      success: true,
      message: "Leave request submitted successfully",
      data: request,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/v1/time-off/requests/:id
 * Cancel a pending leave request
 */
router.delete("/requests/:id", authenticate, async (req, res, next) => {
  try {
    const employeeId = await getAuthenticatedEmployeeId(req.user.id);
    if (!employeeId) {
      return res.status(404).json({
        success: false,
        message: "Employee profile not found",
      });
    }

    const requestId = parseInt(req.params.id, 10);
    if (isNaN(requestId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid request ID",
      });
    }

    await timeOffService.cancelLeaveRequest(employeeId, requestId);
    return res.status(200).json({
      success: true,
      message: "Leave request cancelled successfully",
    });
  } catch (error) {
    next(error);
  }
});

export default router;
