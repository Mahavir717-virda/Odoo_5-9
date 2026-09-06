import pool from "../db.js";
import { createNotification } from "./notificationService.js";

/**
 * Checks for approved leaves ending today or tomorrow and creates notifications
 */
export const checkAndNotifyEndingLeaves = async () => {
  try {
    const query = `
      SELECT 
        r.id, r.employee_id, e.user_id, e.name AS employee_name, 
        tot.name AS type_name, r.end_date
      FROM time_off_requests r
      JOIN employees e ON r.employee_id = e.id
      JOIN time_off_types tot ON r.type_id = tot.id
      WHERE r.status = 'approved'
        AND r.end_date >= CURRENT_DATE
        AND r.end_date <= CURRENT_DATE + INTERVAL '1 day'
    `;
    const res = await pool.query(query);

    for (const leave of res.rows) {
      if (!leave.user_id) continue;

      const formattedEndDate = String(leave.end_date).split("T")[0];
      const title = "Leave Period Ending";
      const message = `Your ${leave.type_name || "leave"} period is ending on ${formattedEndDate}. Please report to work on your next scheduled working day.`;

      // Prevent duplicate notification for the same leave & date
      const checkDup = await pool.query(
        `SELECT id FROM notifications 
         WHERE user_id = $1 AND title = $2 AND created_at >= CURRENT_DATE`,
        [leave.user_id, title]
      );

      if (checkDup.rows.length === 0) {
        await createNotification({
          userId: leave.user_id,
          title,
          message,
          type: "warning",
          link: "/calendar",
        });
      }
    }
  } catch (err) {
    console.error("Error checking ending leaves:", err.message);
  }
};

/**
 * Starts automatic hourly check for ending leaves
 */
export const startLeaveReminderCron = () => {
  // Run on server startup
  checkAndNotifyEndingLeaves();

  // Run every 1 hour (3600000 ms)
  setInterval(checkAndNotifyEndingLeaves, 3600000);
};

export default {
  checkAndNotifyEndingLeaves,
  startLeaveReminderCron,
};
