import express from "express";
import { authenticate, requireRole } from "../middleware/auth.middleware.js";
import scheduleService from "../services/scheduleService.js";

const router = express.Router();

const parseId = (id) => {
  const parsed = parseInt(id, 10);
  if (isNaN(parsed) || parsed <= 0 || String(parsed) !== String(id)) {
    return null;
  }
  return parsed;
};

/**
 * GET /api/v1/working-schedules
 * Allowed: all authenticated users
 */
router.get("/", authenticate, async (req, res, next) => {
  try {
    const { search } = req.query;
    const schedules = await scheduleService.listSchedules({ search });
    return res.status(200).json({
      success: true,
      data: schedules,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/working-schedules/:id
 * Allowed: all authenticated users
 */
router.get("/:id", authenticate, async (req, res, next) => {
  try {
    const scheduleId = parseId(req.params.id);
    if (!scheduleId) {
      return res.status(400).json({
        success: false,
        message: "Invalid schedule ID",
      });
    }

    const schedule = await scheduleService.getScheduleById(scheduleId);
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: "Working schedule not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: schedule,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/working-schedules
 * Allowed: admin, hr_manager
 */
router.post(
  "/",
  authenticate,
  requireRole("admin", "hr_manager"),
  async (req, res, next) => {
    try {
      const schedule = await scheduleService.createSchedule(req.body);
      return res.status(201).json({
        success: true,
        message: "Working schedule created successfully",
        data: schedule,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/v1/working-schedules/:id
 * Allowed: admin, hr_manager
 */
router.put(
  "/:id",
  authenticate,
  requireRole("admin", "hr_manager"),
  async (req, res, next) => {
    try {
      const scheduleId = parseId(req.params.id);
      if (!scheduleId) {
        return res.status(400).json({
          success: false,
          message: "Invalid schedule ID",
        });
      }

      const updated = await scheduleService.updateSchedule(scheduleId, req.body);
      return res.status(200).json({
        success: true,
        message: "Working schedule updated successfully",
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/v1/working-schedules/:id
 * Allowed: admin, hr_manager
 */
router.delete(
  "/:id",
  authenticate,
  requireRole("admin", "hr_manager"),
  async (req, res, next) => {
    try {
      const scheduleId = parseId(req.params.id);
      if (!scheduleId) {
        return res.status(400).json({
          success: false,
          message: "Invalid schedule ID",
        });
      }

      await scheduleService.deleteSchedule(scheduleId);
      return res.status(200).json({
        success: true,
        message: "Working schedule deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
