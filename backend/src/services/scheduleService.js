import pool from "../db.js";

/**
 * Calculate weekly hours from schedule lines (JSON array of day, start, end, break in mins)
 */
export const calculateWeeklyHours = (lines = []) => {
  if (!Array.isArray(lines)) return 0;
  let totalMinutes = 0;

  for (const line of lines) {
    if (line.start && line.end) {
      const [startH, startM] = line.start.split(":").map(Number);
      const [endH, endM] = line.end.split(":").map(Number);

      const startTotal = startH * 60 + startM;
      const endTotal = endH * 60 + endM;
      const breakMins = Number(line.break || line.breakMinutes || 0);

      let dayMins = endTotal - startTotal - breakMins;
      if (dayMins > 0) {
        totalMinutes += dayMins;
      }
    }
  }

  return Number((totalMinutes / 60).toFixed(2));
};

/**
 * List working schedules with optional search filter
 */
export const listSchedules = async ({ search } = {}) => {
  let query = `
    SELECT id, name, lines, created_at, updated_at
    FROM working_schedules
  `;
  const params = [];

  if (search && search.trim()) {
    params.push(`%${search.trim()}%`);
    query += ` WHERE name ILIKE $1`;
  }

  query += ` ORDER BY id ASC`;

  const result = await pool.query(query, params);

  return result.rows.map((row) => {
    const lines = typeof row.lines === "string" ? JSON.parse(row.lines) : (row.lines || []);
    return {
      id: row.id,
      name: row.name,
      lines,
      weekly_hours: calculateWeeklyHours(lines),
      days_per_week: lines.length,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  });
};

/**
 * Get schedule by ID
 */
export const getScheduleById = async (id) => {
  const result = await pool.query(
    `SELECT id, name, lines, created_at, updated_at FROM working_schedules WHERE id = $1`,
    [id]
  );

  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  const lines = typeof row.lines === "string" ? JSON.parse(row.lines) : (row.lines || []);

  return {
    id: row.id,
    name: row.name,
    lines,
    weekly_hours: calculateWeeklyHours(lines),
    days_per_week: lines.length,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
};

/**
 * Create a new working schedule
 */
export const createSchedule = async (data) => {
  const { name, lines = [] } = data;

  if (!name || typeof name !== "string" || !name.trim()) {
    const err = new Error("Schedule name is required");
    err.statusCode = 400;
    throw err;
  }

  const existing = await pool.query(
    "SELECT id FROM working_schedules WHERE name ILIKE $1",
    [name.trim()]
  );
  if (existing.rows.length > 0) {
    const err = new Error("Working schedule with this name already exists");
    err.statusCode = 409;
    throw err;
  }

  const validLines = Array.isArray(lines) ? lines : [];

  const result = await pool.query(
    `INSERT INTO working_schedules (name, lines)
     VALUES ($1, $2)
     RETURNING id, name, lines, created_at, updated_at`,
    [name.trim(), JSON.stringify(validLines)]
  );

  const row = result.rows[0];
  const parsedLines = typeof row.lines === "string" ? JSON.parse(row.lines) : (row.lines || []);

  return {
    id: row.id,
    name: row.name,
    lines: parsedLines,
    weekly_hours: calculateWeeklyHours(parsedLines),
    days_per_week: parsedLines.length,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
};

/**
 * Update an existing working schedule
 */
export const updateSchedule = async (id, data) => {
  const { name, lines } = data;

  const existingRes = await pool.query("SELECT * FROM working_schedules WHERE id = $1", [id]);
  if (existingRes.rows.length === 0) {
    const err = new Error("Working schedule not found");
    err.statusCode = 404;
    throw err;
  }
  const existing = existingRes.rows[0];

  if (name && name.trim().toLowerCase() !== existing.name.toLowerCase()) {
    const dupCheck = await pool.query(
      "SELECT id FROM working_schedules WHERE name ILIKE $1 AND id != $2",
      [name.trim(), id]
    );
    if (dupCheck.rows.length > 0) {
      const err = new Error("Working schedule with this name already exists");
      err.statusCode = 409;
      throw err;
    }
  }

  const updatedName = name ? name.trim() : existing.name;
  const updatedLines = lines !== undefined ? (Array.isArray(lines) ? lines : []) : existing.lines;

  const result = await pool.query(
    `UPDATE working_schedules
     SET name = $1, lines = $2, updated_at = NOW()
     WHERE id = $3
     RETURNING id, name, lines, created_at, updated_at`,
    [updatedName, JSON.stringify(updatedLines), id]
  );

  const row = result.rows[0];
  const parsedLines = typeof row.lines === "string" ? JSON.parse(row.lines) : (row.lines || []);

  return {
    id: row.id,
    name: row.name,
    lines: parsedLines,
    weekly_hours: calculateWeeklyHours(parsedLines),
    days_per_week: parsedLines.length,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
};

/**
 * Delete a working schedule (if not referenced by active employees)
 */
export const deleteSchedule = async (id) => {
  const existingRes = await pool.query("SELECT id FROM working_schedules WHERE id = $1", [id]);
  if (existingRes.rows.length === 0) {
    const err = new Error("Working schedule not found");
    err.statusCode = 404;
    throw err;
  }

  const empRef = await pool.query("SELECT id FROM employees WHERE schedule_id = $1 LIMIT 1", [id]);
  if (empRef.rows.length > 0) {
    const err = new Error("Cannot delete working schedule because it is assigned to employees");
    err.statusCode = 409;
    throw err;
  }

  await pool.query("DELETE FROM working_schedules WHERE id = $1", [id]);
  return { id };
};

export default {
  listSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  calculateWeeklyHours,
};
