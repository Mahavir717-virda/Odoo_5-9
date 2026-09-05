import pool from "../db.js";

/**
 * Calculate inclusive calendar days between two ISO date strings (YYYY-MM-DD)
 */
const calculateDays = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays > 0 ? diffDays : 1;
};

// ==========================================
// 1. TIME OFF TYPES
// ==========================================

export const listTimeOffTypes = async () => {
  const query = `
    SELECT id, name, unit, requires_allocation, affects_payroll, created_at, updated_at
    FROM time_off_types
    ORDER BY id ASC
  `;
  const result = await pool.query(query);
  return result.rows;
};

export const createTimeOffType = async (data) => {
  const { name, unit = "days", requires_allocation = true, affects_payroll = true } = data;

  if (!name || typeof name !== "string") {
    const err = new Error("Name is required");
    err.statusCode = 400;
    throw err;
  }

  const validUnits = ["days", "hours"];
  if (!validUnits.includes(unit)) {
    const err = new Error("Invalid unit. Allowed: days, hours");
    err.statusCode = 400;
    throw err;
  }

  // Check duplicate name
  const existing = await pool.query("SELECT id FROM time_off_types WHERE name ILIKE $1", [name.trim()]);
  if (existing.rows.length > 0) {
    const err = new Error("Time off type with this name already exists");
    err.statusCode = 409;
    throw err;
  }

  const insertQuery = `
    INSERT INTO time_off_types (name, unit, requires_allocation, affects_payroll)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;
  const result = await pool.query(insertQuery, [name.trim(), unit, requires_allocation, affects_payroll]);
  return result.rows[0];
};

export const updateTimeOffType = async (id, data) => {
  const { name, unit, requires_allocation, affects_payroll } = data;

  const existingRes = await pool.query("SELECT * FROM time_off_types WHERE id = $1", [id]);
  if (existingRes.rows.length === 0) {
    const err = new Error("Time off type not found");
    err.statusCode = 404;
    throw err;
  }
  const existing = existingRes.rows[0];

  if (name && name.trim().toLowerCase() !== existing.name.toLowerCase()) {
    const dupCheck = await pool.query("SELECT id FROM time_off_types WHERE name ILIKE $1 AND id != $2", [name.trim(), id]);
    if (dupCheck.rows.length > 0) {
      const err = new Error("Time off type with this name already exists");
      err.statusCode = 409;
      throw err;
    }
  }

  if (unit && !["days", "hours"].includes(unit)) {
    const err = new Error("Invalid unit. Allowed: days, hours");
    err.statusCode = 400;
    throw err;
  }

  const updatedName = name ? name.trim() : existing.name;
  const updatedUnit = unit !== undefined ? unit : existing.unit;
  const updatedReq = requires_allocation !== undefined ? requires_allocation : existing.requires_allocation;
  const updatedAff = affects_payroll !== undefined ? affects_payroll : existing.affects_payroll;

  const updateQuery = `
    UPDATE time_off_types
    SET name = $1, unit = $2, requires_allocation = $3, affects_payroll = $4, updated_at = NOW()
    WHERE id = $5
    RETURNING *
  `;
  const result = await pool.query(updateQuery, [updatedName, updatedUnit, updatedReq, updatedAff, id]);
  return result.rows[0];
};

// ==========================================
// 2. TIME OFF ALLOCATIONS
// ==========================================

export const listAllocations = async ({ employee_id, type_id, page = 1, limit = 20 }) => {
  const p = Math.max(1, parseInt(page, 10) || 1);
  const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const offset = (p - 1) * l;

  let whereClause = "WHERE 1=1";
  const params = [];

  if (employee_id) {
    params.push(employee_id);
    whereClause += ` AND a.employee_id = $${params.length}`;
  }

  if (type_id) {
    params.push(type_id);
    whereClause += ` AND a.type_id = $${params.length}`;
  }

  const countQuery = `
    SELECT COUNT(*) AS total
    FROM time_off_allocations a
    ${whereClause}
  `;
  const countRes = await pool.query(countQuery, params);
  const total = parseInt(countRes.rows[0].total, 10);

  const dataParams = [...params, l, offset];
  const dataQuery = `
    SELECT 
      a.id,
      a.employee_id,
      e.name AS employee_name,
      e.email AS employee_email,
      e.department,
      a.type_id,
      tot.name AS time_off_type_name,
      tot.unit,
      tot.is_paid,
      tot.affects_payroll,
      a.allocated,
      a.taken,
      a.remaining,
      a.created_at,
      a.updated_at
    FROM time_off_allocations a
    JOIN employees e ON a.employee_id = e.id
    JOIN time_off_types tot ON a.type_id = tot.id
    ${whereClause}
    ORDER BY a.id ASC
    LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}
  `;
  const dataRes = await pool.query(dataQuery, dataParams);

  return {
    data: dataRes.rows.map((r) => ({
      id: r.id,
      employee_id: r.employee_id,
      employee_name: r.employee_name,
      employee_email: r.employee_email,
      department: r.department,
      type_id: r.type_id,
      time_off_type_name: r.time_off_type_name,
      unit: r.unit,
      is_paid: r.is_paid,
      affects_payroll: r.affects_payroll,
      allocated: Number(r.allocated),
      taken: Number(r.taken),
      remaining: Number(r.remaining),
      created_at: r.created_at,
      updated_at: r.updated_at,
    })),
    pagination: {
      page: p,
      limit: l,
      total,
      totalPages: Math.ceil(total / l) || 1,
    },
  };
};

export const getMyAllocations = async (userId, filters = {}) => {
  const empRes = await pool.query("SELECT id FROM employees WHERE user_id = $1", [userId]);
  if (empRes.rows.length === 0) {
    const err = new Error("Employee profile not found");
    err.statusCode = 404;
    throw err;
  }
  const employeeId = empRes.rows[0].id;
  return await listAllocations({ ...filters, employee_id: employeeId });
};

export const createAllocation = async (data) => {
  const { employee_id, type_id, allocated_days, allocated } = data;
  const allocDays = allocated_days !== undefined ? Number(allocated_days) : Number(allocated);

  if (!employee_id || !type_id || isNaN(allocDays) || allocDays < 0) {
    const err = new Error("Invalid parameters. employee_id, type_id, and non-negative allocated_days are required");
    err.statusCode = 400;
    throw err;
  }

  const empRes = await pool.query("SELECT id FROM employees WHERE id = $1", [employee_id]);
  if (empRes.rows.length === 0) {
    const err = new Error("Employee not found");
    err.statusCode = 400;
    throw err;
  }

  const typeRes = await pool.query("SELECT id FROM time_off_types WHERE id = $1", [type_id]);
  if (typeRes.rows.length === 0) {
    const err = new Error("Time off type not found");
    err.statusCode = 400;
    throw err;
  }

  // Duplicate check
  const dupCheck = await pool.query("SELECT id FROM time_off_allocations WHERE employee_id = $1 AND type_id = $2", [employee_id, type_id]);
  if (dupCheck.rows.length > 0) {
    const err = new Error("Allocation already exists for this employee and leave type");
    err.statusCode = 409;
    throw err;
  }

  const insertQuery = `
    INSERT INTO time_off_allocations (employee_id, type_id, allocated, taken, remaining)
    VALUES ($1, $2, $3, 0.00, $3)
    RETURNING *
  `;
  const result = await pool.query(insertQuery, [employee_id, type_id, allocDays]);
  return result.rows[0];
};

export const updateAllocation = async (id, data) => {
  const { allocated_days, allocated } = data;
  const newAlloc = allocated_days !== undefined ? Number(allocated_days) : (allocated !== undefined ? Number(allocated) : null);

  const existingRes = await pool.query("SELECT * FROM time_off_allocations WHERE id = $1", [id]);
  if (existingRes.rows.length === 0) {
    const err = new Error("Allocation not found");
    err.statusCode = 404;
    throw err;
  }
  const existing = existingRes.rows[0];
  const currentTaken = Number(existing.taken);

  if (newAlloc !== null) {
    if (isNaN(newAlloc) || newAlloc < 0) {
      const err = new Error("Allocated days must be >= 0");
      err.statusCode = 400;
      throw err;
    }
    if (newAlloc < currentTaken) {
      const err = new Error(`Allocated days (${newAlloc}) cannot be less than already taken days (${currentTaken})`);
      err.statusCode = 400;
      throw err;
    }
  }

  const finalAlloc = newAlloc !== null ? newAlloc : Number(existing.allocated);
  const newRemaining = finalAlloc - currentTaken;

  const updateQuery = `
    UPDATE time_off_allocations
    SET allocated = $1, remaining = $2, updated_at = NOW()
    WHERE id = $3
    RETURNING *
  `;
  const result = await pool.query(updateQuery, [finalAlloc, newRemaining, id]);
  return result.rows[0];
};

// ==========================================
// 3. TIME OFF REQUESTS
// ==========================================

export const listRequests = async ({ employee_id, type_id, status, from_date, to_date, page = 1, limit = 20 }) => {
  const p = Math.max(1, parseInt(page, 10) || 1);
  const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const offset = (p - 1) * l;

  let whereClause = "WHERE 1=1";
  const params = [];

  if (employee_id) {
    params.push(employee_id);
    whereClause += ` AND r.employee_id = $${params.length}`;
  }

  if (type_id) {
    params.push(type_id);
    whereClause += ` AND r.type_id = $${params.length}`;
  }

  if (status) {
    const normStatus = status === "rejected" || status === "refused" ? "refused" : (status === "cancelled" ? "cancelled" : status);
    params.push(normStatus);
    whereClause += ` AND r.status = $${params.length}`;
  }

  if (from_date) {
    params.push(from_date);
    whereClause += ` AND r.start_date >= $${params.length}`;
  }

  if (to_date) {
    params.push(to_date);
    whereClause += ` AND r.end_date <= $${params.length}`;
  }

  const countQuery = `
    SELECT COUNT(*) AS total
    FROM time_off_requests r
    ${whereClause}
  `;
  const countRes = await pool.query(countQuery, params);
  const total = parseInt(countRes.rows[0].total, 10);

  const dataParams = [...params, l, offset];
  const dataQuery = `
    SELECT 
      r.id,
      r.employee_id,
      e.name AS employee_name,
      e.email AS employee_email,
      e.department,
      r.type_id,
      tot.name AS time_off_type_name,
      r.start_date,
      r.end_date,
      r.duration AS requested_days,
      r.status,
      r.reason,
      r.approved_by,
      u.email AS approved_by_email,
      r.approved_at,
      r.created_at,
      r.updated_at
    FROM time_off_requests r
    JOIN employees e ON r.employee_id = e.id
    JOIN time_off_types tot ON r.type_id = tot.id
    LEFT JOIN users u ON r.approved_by = u.id
    ${whereClause}
    ORDER BY r.start_date DESC, r.id DESC
    LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}
  `;
  const dataRes = await pool.query(dataQuery, dataParams);

  return {
    data: dataRes.rows.map((row) => ({
      id: row.id,
      employee_id: row.employee_id,
      employee_name: row.employee_name,
      employee_email: row.employee_email,
      department: row.department,
      type_id: row.type_id,
      time_off_type_name: row.time_off_type_name,
      start_date: row.start_date,
      end_date: row.end_date,
      requested_days: Number(row.requested_days),
      status: row.status === "refused" ? "rejected" : row.status,
      reason: row.reason,
      approved_by: row.approved_by,
      approved_by_email: row.approved_by_email,
      approved_at: row.approved_at,
      created_at: row.created_at,
      updated_at: row.updated_at,
    })),
    pagination: {
      page: p,
      limit: l,
      total,
      totalPages: Math.ceil(total / l) || 1,
    },
  };
};

export const getMyRequests = async (userId, filters = {}) => {
  const empRes = await pool.query("SELECT id FROM employees WHERE user_id = $1", [userId]);
  if (empRes.rows.length === 0) {
    const err = new Error("Employee profile not found");
    err.statusCode = 404;
    throw err;
  }
  const employeeId = empRes.rows[0].id;
  return await listRequests({ ...filters, employee_id: employeeId });
};

export const getRequestById = async (id) => {
  const query = `
    SELECT 
      r.id,
      r.employee_id,
      e.user_id,
      e.name AS employee_name,
      e.email AS employee_email,
      e.department,
      r.type_id,
      tot.name AS time_off_type_name,
      r.start_date,
      r.end_date,
      r.duration AS requested_days,
      r.status,
      r.reason,
      r.approved_by,
      u.email AS approved_by_email,
      r.approved_at,
      r.created_at,
      r.updated_at
    FROM time_off_requests r
    JOIN employees e ON r.employee_id = e.id
    JOIN time_off_types tot ON r.type_id = tot.id
    LEFT JOIN users u ON r.approved_by = u.id
    WHERE r.id = $1
    LIMIT 1
  `;
  const result = await pool.query(query, [id]);
  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  return {
    id: row.id,
    employee_id: row.employee_id,
    user_id: row.user_id,
    employee_name: row.employee_name,
    employee_email: row.employee_email,
    department: row.department,
    type_id: row.type_id,
    time_off_type_name: row.time_off_type_name,
    start_date: row.start_date,
    end_date: row.end_date,
    requested_days: Number(row.requested_days),
    status: row.status === "refused" ? "rejected" : row.status,
    reason: row.reason,
    approved_by: row.approved_by,
    approved_by_email: row.approved_by_email,
    approved_at: row.approved_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
};

export const createRequest = async (data) => {
  const { employee_id, time_off_type_id, start_date, end_date, reason } = data;

  if (!employee_id || !time_off_type_id || !start_date || !end_date) {
    const err = new Error("Missing required fields: employee_id, time_off_type_id, start_date, end_date");
    err.statusCode = 400;
    throw err;
  }

  // Validate date range
  const startDateObj = new Date(start_date);
  const endDateObj = new Date(end_date);
  if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime()) || endDateObj < startDateObj) {
    const err = new Error("End date must be greater than or equal to start date");
    err.statusCode = 400;
    throw err;
  }

  if (startDateObj.getFullYear() !== endDateObj.getFullYear()) {
    const err = new Error("Leave requests cannot span multiple calendar years");
    err.statusCode = 400;
    throw err;
  }

  // Validate employee & leave type
  const empRes = await pool.query("SELECT id FROM employees WHERE id = $1", [employee_id]);
  if (empRes.rows.length === 0) {
    const err = new Error("Employee not found");
    err.statusCode = 400;
    throw err;
  }

  const typeRes = await pool.query("SELECT id, name, requires_allocation FROM time_off_types WHERE id = $1", [time_off_type_id]);
  if (typeRes.rows.length === 0) {
    const err = new Error("Time off type not found");
    err.statusCode = 400;
    throw err;
  }
  const leaveType = typeRes.rows[0];

  // Overlapping request check for this employee (excluding refused/cancelled)
  const overlapQuery = `
    SELECT id FROM time_off_requests
    WHERE employee_id = $1
      AND status IN ('pending', 'approved')
      AND start_date <= $2
      AND end_date >= $3
  `;
  const overlapRes = await pool.query(overlapQuery, [employee_id, end_date, start_date]);
  if (overlapRes.rows.length > 0) {
    const err = new Error("Leave request overlaps with an existing request.");
    err.statusCode = 409;
    throw err;
  }

  const duration = calculateDays(start_date, end_date);

  const insertQuery = `
    INSERT INTO time_off_requests (employee_id, type_id, start_date, end_date, duration, status, reason)
    VALUES ($1, $2, $3, $4, $5, 'pending', $6)
    RETURNING *
  `;
  const result = await pool.query(insertQuery, [employee_id, time_off_type_id, start_date, end_date, duration, reason || null]);
  const row = result.rows[0];

  return {
    ...row,
    requested_days: Number(row.duration),
    time_off_type_name: leaveType.name,
  };
};

/**
 * Approve leave request with atomic transaction balance deduction
 */
export const approveRequest = async (id, approverUserId) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Lock and get request
    const reqRes = await client.query(
      `SELECT r.*, tot.requires_allocation
       FROM time_off_requests r
       JOIN time_off_types tot ON r.type_id = tot.id
       WHERE r.id = $1
       FOR UPDATE`,
      [id]
    );

    if (reqRes.rows.length === 0) {
      const err = new Error("Leave request not found");
      err.statusCode = 404;
      throw err;
    }

    const request = reqRes.rows[0];

    if (request.status !== "pending") {
      const err = new Error(`Cannot approve request because it is already ${request.status === 'refused' ? 'rejected' : request.status}`);
      err.statusCode = 409;
      throw err;
    }

    const requestedDays = Number(request.duration);

    // If allocation is required, check and deduct balance
    if (request.requires_allocation) {
      const allocRes = await client.query(
        `SELECT * FROM time_off_allocations
         WHERE employee_id = $1 AND type_id = $2
         FOR UPDATE`,
        [request.employee_id, request.type_id]
      );

      if (allocRes.rows.length === 0) {
        const err = new Error("No leave allocation found for this employee and leave type");
        err.statusCode = 400;
        throw err;
      }

      const allocation = allocRes.rows[0];
      const remaining = Number(allocation.remaining);
      const taken = Number(allocation.taken);

      if (requestedDays > remaining) {
        const err = new Error("Insufficient leave balance.");
        err.statusCode = 400;
        throw err;
      }

      const newTaken = taken + requestedDays;
      const newRemaining = remaining - requestedDays;

      await client.query(
        `UPDATE time_off_allocations
         SET taken = $1, remaining = $2, updated_at = NOW()
         WHERE id = $3`,
        [newTaken, newRemaining, allocation.id]
      );
    }

    // Update request status to approved
    const updateRes = await client.query(
      `UPDATE time_off_requests
       SET status = 'approved', approved_by = $1, approved_at = NOW(), updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [approverUserId, id]
    );

    await client.query("COMMIT");
    return updateRes.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Reject leave request
 */
export const rejectRequest = async (id, reason = null) => {
  const existingRes = await pool.query("SELECT * FROM time_off_requests WHERE id = $1", [id]);
  if (existingRes.rows.length === 0) {
    const err = new Error("Leave request not found");
    err.statusCode = 404;
    throw err;
  }
  const request = existingRes.rows[0];

  if (request.status !== "pending") {
    const err = new Error(`Cannot reject request because it is already ${request.status === 'refused' ? 'rejected' : request.status}`);
    err.statusCode = 409;
    throw err;
  }

  const updateRes = await pool.query(
    `UPDATE time_off_requests
     SET status = 'refused', reason = COALESCE($1, reason), updated_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [reason, id]
  );

  return {
    ...updateRes.rows[0],
    status: "rejected",
  };
};

/**
 * Cancel leave request (revert balance if previously approved)
 */
export const cancelRequest = async (id, user) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const reqRes = await client.query(
      `SELECT r.*, e.user_id, tot.requires_allocation
       FROM time_off_requests r
       JOIN employees e ON r.employee_id = e.id
       JOIN time_off_types tot ON r.type_id = tot.id
       WHERE r.id = $1
       FOR UPDATE`,
      [id]
    );

    if (reqRes.rows.length === 0) {
      const err = new Error("Leave request not found");
      err.statusCode = 404;
      throw err;
    }

    const request = reqRes.rows[0];

    // Role ownership check
    if (user.role === "employee" && request.user_id !== user.id) {
      const err = new Error("You do not have permission to cancel this leave request");
      err.statusCode = 403;
      throw err;
    }

    // Employees can only cancel pending requests
    if (user.role === "employee" && request.status !== "pending") {
      const err = new Error("Employees can only cancel pending leave requests");
      err.statusCode = 409;
      throw err;
    }

    if (request.status === "refused") {
      const err = new Error("Cannot cancel an already rejected leave request");
      err.statusCode = 409;
      throw err;
    }

    // If already approved and requires allocation, restore used days
    if (request.status === "approved" && request.requires_allocation) {
      const allocRes = await client.query(
        `SELECT * FROM time_off_allocations
         WHERE employee_id = $1 AND type_id = $2
         FOR UPDATE`,
        [request.employee_id, request.type_id]
      );

      if (allocRes.rows.length > 0) {
        const allocation = allocRes.rows[0];
        const requestedDays = Number(request.duration);
        const currentTaken = Number(allocation.taken);
        const currentRemaining = Number(allocation.remaining);

        const newTaken = Math.max(0, currentTaken - requestedDays);
        const newRemaining = currentRemaining + requestedDays;

        await client.query(
          `UPDATE time_off_allocations
           SET taken = $1, remaining = $2, updated_at = NOW()
           WHERE id = $3`,
          [newTaken, newRemaining, allocation.id]
        );
      }
    }

    // Set request status to refused (with cancelled marker)
    const updateRes = await client.query(
      `UPDATE time_off_requests
       SET status = 'refused', reason = CONCAT(COALESCE(reason, ''), ' [Cancelled]'), updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    await client.query("COMMIT");
    return {
      ...updateRes.rows[0],
      status: "cancelled",
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export default {
  listTimeOffTypes,
  createTimeOffType,
  updateTimeOffType,
  listAllocations,
  getMyAllocations,
  createAllocation,
  updateAllocation,
  listRequests,
  getMyRequests,
  getRequestById,
  createRequest,
  approveRequest,
  rejectRequest,
  cancelRequest,
};