import pool from "../db.js";

/**
 * Get all available time off types
 */
export const getTimeOffTypes = async () => {
  const result = await pool.query(
    "SELECT id, name, unit, requires_allocation, affects_payroll FROM time_off_types ORDER BY id ASC"
  );
  return result.rows;
};

/**
 * Get leave allocations/balances for an employee
 */
export const getEmployeeAllocations = async (employeeId) => {
  const query = `
    SELECT 
      toa.id,
      toa.employee_id,
      toa.type_id,
      tot.name AS type_name,
      tot.unit,
      toa.allocated,
      toa.taken,
      toa.remaining
    FROM time_off_allocations toa
    JOIN time_off_types tot ON toa.type_id = tot.id
    WHERE toa.employee_id = $1
    ORDER BY tot.id ASC
  `;
  const result = await pool.query(query, [employeeId]);
  return result.rows.map((row) => ({
    id: row.id,
    typeId: row.type_id,
    type: row.type_name,
    allocated: parseFloat(row.allocated) || 0,
    used: parseFloat(row.taken) || 0,
    remaining: parseFloat(row.remaining) || 0,
    unit: row.unit || "days",
  }));
};

/**
 * Get leave requests for an employee
 */
export const getEmployeeRequests = async (employeeId, { status } = {}) => {
  let query = `
    SELECT 
      tor.id,
      tor.employee_id,
      tor.type_id,
      tot.name AS type_name,
      tor.start_date,
      tor.end_date,
      tor.duration,
      tor.status,
      tor.reason,
      tor.created_at,
      tor.approved_at,
      u.email AS approved_by_email
    FROM time_off_requests tor
    JOIN time_off_types tot ON tor.type_id = tot.id
    LEFT JOIN users u ON tor.approved_by = u.id
    WHERE tor.employee_id = $1
  `;
  const params = [employeeId];

  if (status && status !== "all") {
    params.push(status.toLowerCase());
    query += ` AND LOWER(tor.status) = $${params.length}`;
  }

  query += ` ORDER BY tor.created_at DESC`;

  const result = await pool.query(query, params);
  return result.rows.map((row) => ({
    id: row.id,
    leaveType: row.type_name,
    typeId: row.type_id,
    startDate: row.start_date ? row.start_date.toISOString().split("T")[0] : null,
    endDate: row.end_date ? row.end_date.toISOString().split("T")[0] : null,
    days: parseFloat(row.duration) || 0,
    status: row.status ? row.status.charAt(0).toUpperCase() + row.status.slice(1).toLowerCase() : "Pending",
    reason: row.reason || "",
    appliedDate: row.created_at ? row.created_at.toISOString().split("T")[0] : null,
    approvedBy: row.approved_by_email || null,
  }));
};

/**
 * Submit a new leave request
 */
export const createLeaveRequest = async (employeeId, { typeId, startDate, endDate, duration, reason }) => {
  // Validate type exists
  const typeRes = await pool.query("SELECT * FROM time_off_types WHERE id = $1", [typeId]);
  if (typeRes.rows.length === 0) {
    const error = new Error("Invalid time off type");
    error.status = 400;
    throw error;
  }

  const dur = parseFloat(duration) || 1;

  const insertQuery = `
    INSERT INTO time_off_requests (employee_id, type_id, start_date, end_date, duration, reason, status)
    VALUES ($1, $2, $3, $4, $5, $6, 'pending')
    RETURNING id, employee_id, type_id, start_date, end_date, duration, status, reason, created_at
  `;
  const result = await pool.query(insertQuery, [
    employeeId,
    typeId,
    startDate,
    endDate,
    dur,
    reason || "",
  ]);

  const row = result.rows[0];
  return {
    id: row.id,
    leaveType: typeRes.rows[0].name,
    typeId: row.type_id,
    startDate: row.start_date ? row.start_date.toISOString().split("T")[0] : startDate,
    endDate: row.end_date ? row.end_date.toISOString().split("T")[0] : endDate,
    days: parseFloat(row.duration),
    status: "Pending",
    reason: row.reason,
    appliedDate: row.created_at ? row.created_at.toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
  };
};

/**
 * Cancel a pending leave request
 */
export const cancelLeaveRequest = async (employeeId, requestId) => {
  const checkRes = await pool.query(
    "SELECT id, status FROM time_off_requests WHERE id = $1 AND employee_id = $2",
    [requestId, employeeId]
  );

  if (checkRes.rows.length === 0) {
    const error = new Error("Leave request not found");
    error.status = 404;
    throw error;
  }

  if (checkRes.rows[0].status.toLowerCase() !== "pending") {
    const error = new Error("Only pending leave requests can be cancelled");
    error.status = 400;
    throw error;
  }

  await pool.query("DELETE FROM time_off_requests WHERE id = $1", [requestId]);
  return true;
};

export default {
  getTimeOffTypes,
  getEmployeeAllocations,
  getEmployeeRequests,
  createLeaveRequest,
  cancelLeaveRequest,
};
