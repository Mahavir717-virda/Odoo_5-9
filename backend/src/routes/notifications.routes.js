import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import notificationService from "../services/notificationService.js";

const router = express.Router();

const parseId = (id) => {
  const parsed = parseInt(id, 10);
  if (isNaN(parsed) || parsed <= 0 || String(parsed) !== String(id)) {
    return null;
  }
  return parsed;
};

/**
 * GET /api/v1/notifications/me
 * Allowed: all authenticated users
 */
router.get("/me", authenticate, async (req, res, next) => {
  try {
    const { limit, unread_only } = req.query;
    const result = await notificationService.getUserNotifications(req.user.id, {
      limit,
      unreadOnly: unread_only === "true",
    });

    return res.status(200).json({
      success: true,
      message: "Notifications retrieved successfully",
      data: result.notifications,
      unread_count: result.unread_count,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/v1/notifications/read-all
 * Allowed: all authenticated users
 */
router.patch("/read-all", authenticate, async (req, res, next) => {
  try {
    await notificationService.markAllAsRead(req.user.id);
    return res.status(200).json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/v1/notifications/:id/read
 * Allowed: all authenticated users
 */
router.patch("/:id/read", authenticate, async (req, res, next) => {
  try {
    const notifId = parseId(req.params.id);
    if (!notifId) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID",
      });
    }

    const updated = await notificationService.markAsRead(notifId, req.user.id);
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Notification marked as read",
      data: updated,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/v1/notifications/:id
 * Allowed: all authenticated users
 */
router.delete("/:id", authenticate, async (req, res, next) => {
  try {
    const notifId = parseId(req.params.id);
    if (!notifId) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID",
      });
    }

    await notificationService.deleteNotification(notifId, req.user.id);
    return res.status(200).json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    next(error);
  }
});

export default router;
