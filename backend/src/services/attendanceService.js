import pool from "../db.js";

const VALID_STATUSES = ["present", "absent", "late", "half_day", "leave", "on_leave"];

/**
 * Helper to calculate worked hours between check_in and check_out
 */
const calculateHours = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return null;
  const inTime = new Date(checkIn).getTime();
  const outTime = new Date(checkOut).getTime();
  if (isNaN(inTime) || isNaN(outTime) || outTime < inTime) return null;

  const diffMs = outTime - inTime;
  const hours = diffMs / (1000 * 60 * 60);
  return Math.round(hours * 100) / 100; // Round to 2 decimal places
};

/**
 * List attendance with optional filters and pagination
 */
export const listAttendance = async ({
  employee_id,
  date,
  from_date,
  to_date,
  status,
  department,
  page = 1,
  limit = 20,
}) => {
  const p = Math.max(1, parseInt(page, 10) || 1);
  const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const offset = (p - 1) * l;

  let whereClause = "WHERE 1=1";
  const params = [];

  if (employee_id) {
    params.push(employee_id);
    whereClause += ` AND a.employee_id = $${params.length}`;
  }

  if (date) {
    params.push(date);
    whereClause += ` AND a.attendance_date = $${params.length}`;
  }

  if (from_date) {
    params.push(from_date);
    whereClause += ` AND a.attendance_date >= $${params.length}`;
  }

  if (to_date) {
    params.push(to_date);
    whereClause += ` AND a.attendance_date <= $${params.length}`;
  }

  if (status) {
    const normalizedStatus = status === "on_leave" ? "leave" : status;
    params.push(normalizedStatus);
    whereClause += ` AND a.status = $${params.length}`;
  }

  if (department) {
    params.push(department);
    whereClause += ` AND e.department = $${params.length}`;
  }

  // Count total
  const countQuery = `
    SELECT COUNT(*) AS total
    FROM attendance a
    JOIN employees e ON a.employee_id = e.id
    ${whereClause}
  `;
  const countRes = await pool.query(countQuery, params);
  const total = parseInt(countRes.rows[0].total, 10);

  // Data query
  const dataParams = [...params, l, offset];
  const dataQuery = `
    SELECT 
      a.id,
      a.employee_id,
      e.name AS employee_name,
      e.email AS employee_email,
      e.department,
      a.attendance_date AS date,
      a.check_in,
      a.check_out,
      a.worked_hours,
      a.status,
      a.created_at,
      a.updated_at
    FROM attendance a
    JOIN employees e ON a.employee_id = e.id
    ${whereClause}
    ORDER BY a.attendance_date DESC, a.id DESC
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
      date: row.date,
      check_in: row.check_in,
      check_out: row.check_out,
      worked_hours: row.worked_hours !== null ? Number(row.worked_hours) : null,
      status: row.status,
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

/**
 * Get single attendance record by ID
 */
export const getAttendanceById = async (id) => {
  const query = `
    SELECT 
      a.id,
      a.employee_id,
      e.user_id,
      e.name AS employee_name,
      e.email AS employee_email,
      e.department,
      a.attendance_date AS date,
      a.check_in,
      a.check_out,
      a.worked_hours,
      a.status,
      a.created_at,
      a.updated_at
    FROM attendance a
    JOIN employees e ON a.employee_id = e.id
    WHERE a.id = $1
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
    date: row.date,
    check_in: row.check_in,
    check_out: row.check_out,
    worked_hours: row.worked_hours !== null ? Number(row.worked_hours) : null,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
};

/**
 * Get attendance records for a specific employee
 */
export const getEmployeeAttendance = async (employeeId, filters = {}) => {
  const empRes = await pool.query("SELECT id FROM employees WHERE id = $1", [employeeId]);
  if (empRes.rows.length === 0) {
    const err = new Error("Employee not found");
    err.statusCode = 404;
    throw err;
  }

  return await listAttendance({
    ...filters,
    employee_id: employeeId,
  });
};

/**
 * Create a manual attendance record
 */
export const createAttendance = async (data) => {
  const {
    employee_id,
    date,
    check_in,
    check_out,
    status = "present",
  } = data;

  if (!employee_id || !date) {
    const err = new Error("employee_id and date are required");
    err.statusCode = 400;
    throw err;
  }

  // Validate employee exists
  const empRes = await pool.query("SELECT id, status FROM employees WHERE id = $1", [employee_id]);
  if (empRes.rows.length === 0) {
    const err = new Error("Employee not found");
    err.statusCode = 400;
    throw err;
  }

  // Validate status
  const normalizedStatus = status === "on_leave" ? "leave" : status;
  if (!VALID_STATUSES.includes(normalizedStatus)) {
    const err = new Error(`Invalid status. Allowed: present, absent, late, half_day, leave`);
    err.statusCode = 400;
    throw err;
  }

  // Check check_in/check_out validity
  let workedHours = null;
  if (check_in && check_out) {
    if (new Date(check_out) < new Date(check_in)) {
      const err = new Error("check_out cannot be before check_in");
      err.statusCode = 400;
      throw err;
    }
    workedHours = calculateHours(check_in, check_out);
  }

  // Duplicate check
  const duplicateCheck = await pool.query(
    "SELECT id FROM attendance WHERE employee_id = $1 AND attendance_date = $2",
    [employee_id, date]
  );
  if (duplicateCheck.rows.length > 0) {
    const err = new Error("Attendance record already exists for this employee and date.");
    err.statusCode = 409;
    throw err;
  }

  const insertQuery = `
    INSERT INTO attendance (
      employee_id,
      attendance_date,
      check_in,
      check_out,
      worked_hours,
      status
    ) VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;

  const result = await pool.query(insertQuery, [
    employee_id,
    date,
    check_in || null,
    check_out || null,
    workedHours,
    normalizedStatus,
  ]);

  return result.rows[0];
};

/**
 * Update an existing attendance record
 */
export const updateAttendance = async (id, data) => {
  const {
    date,
    check_in,
    check_out,
    status,
  } = data;

  const existingRes = await pool.query("SELECT * FROM attendance WHERE id = $1", [id]);
  if (existingRes.rows.length === 0) {
    const err = new Error("Attendance record not found");
    err.statusCode = 404;
    throw err;
  }
  const existing = existingRes.rows[0];

  const newDate = date || existing.attendance_date;
  const newCheckIn = check_in !== undefined ? check_in : existing.check_in;
  const newCheckOut = check_out !== undefined ? check_out : existing.check_out;
  let newStatus = status !== undefined ? status : existing.status;

  if (newStatus === "on_leave") newStatus = "leave";
  if (newStatus && !VALID_STATUSES.includes(newStatus)) {
    const err = new Error(`Invalid status. Allowed: present, absent, late, half_day, leave`);
    err.statusCode = 400;
    throw err;
  }

  let workedHours = existing.worked_hours;
  if (newCheckIn && newCheckOut) {
    if (new Date(newCheckOut) < new Date(newCheckIn)) {
      const err = new Error("check_out cannot be before check_in");
      err.statusCode = 400;
      throw err;
    }
    workedHours = calculateHours(newCheckIn, newCheckOut);
  } else if (!newCheckIn || !newCheckOut) {
    workedHours = null;
  }

  // If date is changing, check uniqueness for same employee
  if (date && String(date) !== String(existing.attendance_date)) {
    const dupCheck = await pool.query(
      "SELECT id FROM attendance WHERE employee_id = $1 AND attendance_date = $2 AND id != $3",
      [existing.employee_id, date, id]
    );
    if (dupCheck.rows.length > 0) {
      const err = new Error("Attendance record already exists for this employee and date.");
      err.statusCode = 409;
      throw err;
    }
  }

  const updateQuery = `
    UPDATE attendance
    SET
      attendance_date = $1,
      check_in = $2,
      check_out = $3,
      worked_hours = $4,
      status = $5,
      updated_at = NOW()
    WHERE id = $6
    RETURNING *
  `;

  const result = await pool.query(updateQuery, [
    newDate,
    newCheckIn || null,
    newCheckOut || null,
    workedHours,
    newStatus,
    id,
  ]);

  return result.rows[0];
};

/**
 * Check In an employee
 */
export const checkIn = async (employeeId, date = null) => {
  // Validate employee exists
  const empRes = await pool.query("SELECT id FROM employees WHERE id = $1", [employeeId]);
  if (empRes.rows.length === 0) {
    const err = new Error("Employee not found");
    err.statusCode = 404;
    throw err;
  }

  // Check if employee has an active open check-in (without check_out)
  const openCheckRes = await pool.query(
    "SELECT * FROM attendance WHERE employee_id = $1 AND check_in IS NOT NULL AND check_out IS NULL ORDER BY check_in DESC LIMIT 1",
    [employeeId]
  );

  if (openCheckRes.rows.length > 0) {
    const err = new Error("Employee is already checked in.");
    err.statusCode = 409;
    throw err;
  }

  const targetDate = date || new Date().toLocaleDateString("en-CA");

  // Check if attendance already exists for target date
  const existingRes = await pool.query(
    "SELECT * FROM attendance WHERE employee_id = $1 AND attendance_date = $2",
    [employeeId, targetDate]
  );

  if (existingRes.rows.length > 0) {
    const record = existingRes.rows[0];
    if (record.check_in) {
      const err = new Error("Employee is already checked in for this date.");
      err.statusCode = 409;
      throw err;
    }

    // Update with check_in
    const updateRes = await pool.query(
      `UPDATE attendance
       SET check_in = NOW(), status = 'present', updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [record.id]
    );
    return updateRes.rows[0];
  }

  // Create new attendance record with current time as check_in
  const insertRes = await pool.query(
    `INSERT INTO attendance (
      employee_id,
      attendance_date,
      check_in,
      status
    ) VALUES ($1, $2, NOW(), 'present')
    RETURNING *`,
    [employeeId, targetDate]
  );

  return insertRes.rows[0];
};

/**
 * Check Out an employee and calculate worked_hours
 */
export const checkOut = async (employeeId, date = null) => {
  // Validate employee exists
  const empRes = await pool.query("SELECT id FROM employees WHERE id = $1", [employeeId]);
  if (empRes.rows.length === 0) {
    const err = new Error("Employee not found");
    err.statusCode = 404;
    throw err;
  }

  let record = null;

  if (date) {
    const existingRes = await pool.query(
      "SELECT * FROM attendance WHERE employee_id = $1 AND attendance_date = $2",
      [employeeId, date]
    );
    if (existingRes.rows.length > 0) {
      record = existingRes.rows[0];
    }
  } else {
    // Find latest open check-in record
    const openRes = await pool.query(
      "SELECT * FROM attendance WHERE employee_id = $1 AND check_in IS NOT NULL AND check_out IS NULL ORDER BY check_in DESC LIMIT 1",
      [employeeId]
    );
    if (openRes.rows.length > 0) {
      record = openRes.rows[0];
    } else {
      const targetDate = new Date().toLocaleDateString("en-CA");
      const todayRes = await pool.query(
        "SELECT * FROM attendance WHERE employee_id = $1 AND attendance_date = $2",
        [employeeId, targetDate]
      );
      if (todayRes.rows.length > 0) {
        record = todayRes.rows[0];
      }
    }
  }

  if (!record) {
    const err = new Error("No active shift found. Please check in first.");
    err.statusCode = 404;
    throw err;
  }

  if (!record.check_in) {
    const err = new Error("Cannot check out because check-in record is missing.");
    err.statusCode = 400;
    throw err;
  }

  if (record.check_out) {
    const err = new Error("Employee has already checked out for this shift.");
    err.statusCode = 409;
    throw err;
  }

  const now = new Date();
  const workedHours = calculateHours(record.check_in, now);

  const updateRes = await pool.query(
    `UPDATE attendance
     SET check_out = $1, worked_hours = $2, updated_at = NOW()
     WHERE id = $3
     RETURNING *`,
    [now, workedHours, record.id]
  );

  return updateRes.rows[0];
};

export default {
  listAttendance,
  getAttendanceById,
  getEmployeeAttendance,
  createAttendance,
  updateAttendance,
  checkIn,
  checkOut,
};
