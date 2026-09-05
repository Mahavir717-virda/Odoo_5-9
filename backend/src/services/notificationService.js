import pool from "../db.js";

/**
 * List notifications for a specific user
 */
export const getUserNotifications = async (userId, { limit = 20, unreadOnly = false } = {}) => {
  let query = `
    SELECT id, user_id, title, message, type, link, is_read, created_at
    FROM notifications
    WHERE user_id = $1
  `;
  const params = [userId];

  if (unreadOnly) {
    query += " AND is_read = FALSE";
  }

  query += " ORDER BY created_at DESC, id DESC LIMIT $2";
  params.push(Math.min(100, Math.max(1, parseInt(limit, 10) || 20)));

  const result = await pool.query(query, params);

  // Count unread
  const countRes = await pool.query(
    "SELECT COUNT(*) AS unread_count FROM notifications WHERE user_id = $1 AND is_read = FALSE",
    [userId]
  );
  const unreadCount = parseInt(countRes.rows[0].unread_count, 10) || 0;

  return {
    notifications: result.rows,
    unread_count: unreadCount,
  };
};

/**
 * Create a notification for a user
 */
export const createNotification = async ({ userId, title, message, type = "info", link = null }) => {
  if (!userId || !title || !message) return null;

  const validTypes = ["info", "success", "warning", "error"];
  const finalType = validTypes.includes(type) ? type : "info";

  const result = await pool.query(
    `INSERT INTO notifications (user_id, title, message, type, link, is_read)
     VALUES ($1, $2, $3, $4, $5, FALSE)
     RETURNING *`,
    [userId, title.trim(), message.trim(), finalType, link]
  );

  return result.rows[0];
};

/**
 * Broadcast notification to all users matching a role (or multiple roles)
 */
export const notifyRoles = async (roles = [], { title, message, type = "info", link = null }) => {
  if (!roles || roles.length === 0 || !title || !message) return [];

  const usersRes = await pool.query(
    "SELECT id FROM users WHERE role = ANY($1::varchar[])",
    [roles]
  );

  const notifications = [];
  for (const user of usersRes.rows) {
    const n = await createNotification({
      userId: user.id,
      title,
      message,
      type,
      link,
    });
    if (n) notifications.push(n);
  }

  return notifications;
};

/**
 * Mark a notification as read
 */
export const markAsRead = async (id, userId) => {
  const result = await pool.query(
    `UPDATE notifications
     SET is_read = TRUE
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [id, userId]
  );
  return result.rows[0] || null;
};

/**
 * Mark all notifications as read for a user
 */
export const markAllAsRead = async (userId) => {
  await pool.query(
    "UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE",
    [userId]
  );
  return { success: true };
};

/**
 * Delete a notification
 */
export const deleteNotification = async (id, userId) => {
  await pool.query(
    "DELETE FROM notifications WHERE id = $1 AND user_id = $2",
    [id, userId]
  );
  return { id };
};

export default {
  getUserNotifications,
  createNotification,
  notifyRoles,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
