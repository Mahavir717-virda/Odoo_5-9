import crypto from "crypto";
import bcrypt from "bcrypt";
import pool from "../db.js";

const VALID_EMPLOYEE_TYPES = ["full_time", "part_time", "contract", "intern"];
const VALID_STATUSES = ["active", "inactive", "terminated"];

/**
 * List employees with optional filters: department, status, employee_type, search
 */
export const listEmployees = async ({ department, status, employee_type, search }) => {
  let query = `
    SELECT 
      e.id,
      e.user_id,
      e.name,
      e.email,
      e.phone,
      e.department,
      e.manager_id,
      m.name AS manager_name,
      m.email AS manager_email,
      e.job_position,
      e.employee_type,
      e.schedule_id,
      ws.name AS schedule_name,
      e.joining_date,
      e.status,
      e.created_at,
      e.updated_at
    FROM employees e
    LEFT JOIN employees m ON e.manager_id = m.id
    LEFT JOIN working_schedules ws ON e.schedule_id = ws.id
    WHERE 1=1
  `;
  const params = [];

  if (department) {
    params.push(department);
    query += ` AND e.department = $${params.length}`;
  }

  if (status) {
    params.push(status);
    query += ` AND e.status = $${params.length}`;
  }

  if (employee_type) {
    params.push(employee_type);
    query += ` AND e.employee_type = $${params.length}`;
  }

  if (search) {
    params.push(`%${search}%`);
    const pIdx = params.length;
    query += ` AND (
      e.name ILIKE $${pIdx} OR 
      e.email ILIKE $${pIdx} OR 
      e.phone ILIKE $${pIdx} OR 
      e.job_position ILIKE $${pIdx}
    )`;
  }

  query += ` ORDER BY e.id ASC`;

  const result = await pool.query(query, params);

  return result.rows.map((row) => ({
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    department: row.department,
    manager_id: row.manager_id,
    job_position: row.job_position,
    employee_type: row.employee_type,
    schedule_id: row.schedule_id,
    joining_date: row.joining_date,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
    manager: row.manager_id
      ? {
          id: row.manager_id,
          name: row.manager_name,
          email: row.manager_email,
        }
      : null,
    schedule: row.schedule_id
      ? {
          id: row.schedule_id,
          name: row.schedule_name,
        }
      : null,
  }));
};

/**
 * Get single employee by ID
 */
export const getEmployeeById = async (id) => {
  const query = `
    SELECT 
      e.id,
      e.user_id,
      e.name,
      e.email,
      e.phone,
      e.department,
      e.manager_id,
      m.name AS manager_name,
      m.email AS manager_email,
      e.job_position,
      e.employee_type,
      e.schedule_id,
      ws.name AS schedule_name,
      e.joining_date,
      e.status,
      e.created_at,
      e.updated_at
    FROM employees e
    LEFT JOIN employees m ON e.manager_id = m.id
    LEFT JOIN working_schedules ws ON e.schedule_id = ws.id
    WHERE e.id = $1
    LIMIT 1
  `;
  const result = await pool.query(query, [id]);

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    department: row.department,
    manager_id: row.manager_id,
    job_position: row.job_position,
    employee_type: row.employee_type,
    schedule_id: row.schedule_id,
    joining_date: row.joining_date,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
    manager: row.manager_id
      ? {
          id: row.manager_id,
          name: row.manager_name,
          email: row.manager_email,
        }
      : null,
    schedule: row.schedule_id
      ? {
          id: row.schedule_id,
          name: row.schedule_name,
        }
      : null,
  };
};

/**
 * Get authenticated user's own employee profile
 */
export const getMyEmployeeProfile = async (userId) => {
  const query = `
    SELECT 
      e.id,
      e.user_id,
      e.name,
      e.email,
      e.phone,
      e.department,
      e.manager_id,
      m.name AS manager_name,
      m.email AS manager_email,
      e.job_position,
      e.employee_type,
      e.schedule_id,
      ws.name AS schedule_name,
      e.joining_date,
      e.status,
      e.created_at,
      e.updated_at
    FROM employees e
    LEFT JOIN employees m ON e.manager_id = m.id
    LEFT JOIN working_schedules ws ON e.schedule_id = ws.id
    WHERE e.user_id = $1
    LIMIT 1
  `;
  const result = await pool.query(query, [userId]);

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    department: row.department,
    manager_id: row.manager_id,
    job_position: row.job_position,
    employee_type: row.employee_type,
    schedule_id: row.schedule_id,
    joining_date: row.joining_date,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
    manager: row.manager_id
      ? {
          id: row.manager_id,
          name: row.manager_name,
          email: row.manager_email,
        }
      : null,
    schedule: row.schedule_id
      ? {
          id: row.schedule_id,
          name: row.schedule_name,
        }
      : null,
  };
};

/**
 * Create a new employee transactionally with user account creation
 */
export const createEmployee = async (data) => {
  const {
    name,
    email,
    phone,
    department,
    manager_id,
    job_position,
    employee_type,
    schedule_id,
    joining_date,
    status = "active",
  } = data;

  const normalizedEmail = email.toLowerCase().trim();

  // Validate employee type & status
  if (!VALID_EMPLOYEE_TYPES.includes(employee_type)) {
    const err = new Error(`Invalid employee type. Allowed: ${VALID_EMPLOYEE_TYPES.join(", ")}`);
    err.statusCode = 400;
    throw err;
  }

  if (!VALID_STATUSES.includes(status)) {
    const err = new Error(`Invalid status. Allowed: ${VALID_STATUSES.join(", ")}`);
    err.statusCode = 400;
    throw err;
  }

  // Validate working schedule exists
  const schedRes = await pool.query("SELECT id FROM working_schedules WHERE id = $1", [schedule_id]);
  if (schedRes.rows.length === 0) {
    const err = new Error("Working schedule not found");
    err.statusCode = 400;
    throw err;
  }

  // Validate manager if provided
  if (manager_id) {
    const mgrRes = await pool.query("SELECT id FROM employees WHERE id = $1", [manager_id]);
    if (mgrRes.rows.length === 0) {
      const err = new Error("Manager employee record not found");
      err.statusCode = 400;
      throw err;
    }
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Check if email already has an employee record
    const existingEmp = await client.query("SELECT id FROM employees WHERE email = $1", [normalizedEmail]);
    if (existingEmp.rows.length > 0) {
      const err = new Error("Email is already in use by another employee");
      err.statusCode = 409;
      throw err;
    }

    // Check if user already exists
    let userId = null;
    const userRes = await client.query("SELECT id, role FROM users WHERE email = $1", [normalizedEmail]);

    if (userRes.rows.length > 0) {
      const existingUser = userRes.rows[0];

      // Check if user is already linked to another employee
      const empWithUser = await client.query("SELECT id FROM employees WHERE user_id = $1", [existingUser.id]);
      if (empWithUser.rows.length > 0) {
        const err = new Error("A user account with this email is already linked to an employee");
        err.statusCode = 409;
        throw err;
      }

      if (existingUser.role !== "employee") {
        const err = new Error("Existing user has a non-employee role and cannot be linked automatically");
        err.statusCode = 409;
        throw err;
      }

      userId = existingUser.id;
    } else {
      // Create user with temporary hashed password
      const randomPassword = crypto.randomBytes(16).toString("hex");
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      const newUserRes = await client.query(
        `INSERT INTO users (email, password, role)
         VALUES ($1, $2, 'employee')
         RETURNING id`,
        [normalizedEmail, hashedPassword]
      );
      userId = newUserRes.rows[0].id;
    }

    // Insert employee
    const insertEmpQuery = `
      INSERT INTO employees (
        user_id,
        name,
        email,
        phone,
        department,
        manager_id,
        job_position,
        employee_type,
        schedule_id,
        joining_date,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const empRes = await client.query(insertEmpQuery, [
      userId,
      name.trim(),
      normalizedEmail,
      phone || null,
      department.trim(),
      manager_id || null,
      job_position.trim(),
      employee_type,
      schedule_id,
      joining_date,
      status,
    ]);

    await client.query("COMMIT");

    return empRes.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    if (error.code === "23505") {
      const conflictErr = new Error("Email is already in use");
      conflictErr.statusCode = 409;
      throw conflictErr;
    }
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Update an existing employee with email synchronization across users table
 */
export const updateEmployee = async (id, data) => {
  const {
    name,
    email,
    phone,
    department,
    manager_id,
    job_position,
    employee_type,
    schedule_id,
    joining_date,
    status,
  } = data;

  const currentEmp = await pool.query("SELECT * FROM employees WHERE id = $1", [id]);
  if (currentEmp.rows.length === 0) {
    const err = new Error("Employee not found");
    err.statusCode = 404;
    throw err;
  }
  const existing = currentEmp.rows[0];

  if (employee_type && !VALID_EMPLOYEE_TYPES.includes(employee_type)) {
    const err = new Error(`Invalid employee type. Allowed: ${VALID_EMPLOYEE_TYPES.join(", ")}`);
    err.statusCode = 400;
    throw err;
  }

  if (status && !VALID_STATUSES.includes(status)) {
    const err = new Error(`Invalid status. Allowed: ${VALID_STATUSES.join(", ")}`);
    err.statusCode = 400;
    throw err;
  }

  if (schedule_id) {
    const schedRes = await pool.query("SELECT id FROM working_schedules WHERE id = $1", [schedule_id]);
    if (schedRes.rows.length === 0) {
      const err = new Error("Working schedule not found");
      err.statusCode = 400;
      throw err;
    }
  }

  if (manager_id !== undefined && manager_id !== null) {
    if (Number(manager_id) === Number(id)) {
      const err = new Error("An employee cannot be their own manager");
      err.statusCode = 400;
      throw err;
    }
    const mgrRes = await pool.query("SELECT id FROM employees WHERE id = $1", [manager_id]);
    if (mgrRes.rows.length === 0) {
      const err = new Error("Manager employee record not found");
      err.statusCode = 400;
      throw err;
    }
  }

  const normalizedEmail = email ? email.toLowerCase().trim() : existing.email;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // If email is changing, ensure uniqueness and update linked user
    if (email && normalizedEmail !== existing.email) {
      const conflictEmp = await client.query(
        "SELECT id FROM employees WHERE email = $1 AND id != $2",
        [normalizedEmail, id]
      );
      if (conflictEmp.rows.length > 0) {
        const err = new Error("Email is already in use by another employee");
        err.statusCode = 409;
        throw err;
      }

      if (existing.user_id) {
        const conflictUser = await client.query(
          "SELECT id FROM users WHERE email = $1 AND id != $2",
          [normalizedEmail, existing.user_id]
        );
        if (conflictUser.rows.length > 0) {
          const err = new Error("Email is already in use by another user account");
          err.statusCode = 409;
          throw err;
        }

        await client.query(
          "UPDATE users SET email = $1, updated_at = NOW() WHERE id = $2",
          [normalizedEmail, existing.user_id]
        );
      }
    }

    const updatedName = name !== undefined ? name.trim() : existing.name;
    const updatedPhone = phone !== undefined ? phone : existing.phone;
    const updatedDepartment = department !== undefined ? department.trim() : existing.department;
    const updatedManagerId = manager_id !== undefined ? manager_id : existing.manager_id;
    const updatedJobPosition = job_position !== undefined ? job_position.trim() : existing.job_position;
    const updatedEmployeeType = employee_type !== undefined ? employee_type : existing.employee_type;
    const updatedScheduleId = schedule_id !== undefined ? schedule_id : existing.schedule_id;
    const updatedJoiningDate = joining_date !== undefined ? joining_date : existing.joining_date;
    const updatedStatus = status !== undefined ? status : existing.status;

    const updateQuery = `
      UPDATE employees
      SET
        name = $1,
        email = $2,
        phone = $3,
        department = $4,
        manager_id = $5,
        job_position = $6,
        employee_type = $7,
        schedule_id = $8,
        joining_date = $9,
        status = $10,
        updated_at = NOW()
      WHERE id = $11
      RETURNING *
    `;

    const result = await client.query(updateQuery, [
      updatedName,
      normalizedEmail,
      updatedPhone,
      updatedDepartment,
      updatedManagerId,
      updatedJobPosition,
      updatedEmployeeType,
      updatedScheduleId,
      updatedJoiningDate,
      updatedStatus,
      id,
    ]);

    await client.query("COMMIT");
    return result.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    if (error.code === "23505") {
      const conflictErr = new Error("Email is already in use");
      conflictErr.statusCode = 409;
      throw conflictErr;
    }
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Deactivate employee (status = 'inactive')
 */
export const deactivateEmployee = async (id) => {
  const result = await pool.query(
    "UPDATE employees SET status = 'inactive', updated_at = NOW() WHERE id = $1 RETURNING id",
    [id]
  );

  if (result.rows.length === 0) {
    const err = new Error("Employee not found");
    err.statusCode = 404;
    throw err;
  }

  return true;
};

/**
 * Reactivate employee (status = 'active')
 */
export const reactivateEmployee = async (id) => {
  const result = await pool.query(
    "UPDATE employees SET status = 'active', updated_at = NOW() WHERE id = $1 RETURNING id",
    [id]
  );

  if (result.rows.length === 0) {
    const err = new Error("Employee not found");
    err.statusCode = 404;
    throw err;
  }

  return true;
};

export default {
  listEmployees,
  getEmployeeById,
  getMyEmployeeProfile,
  createEmployee,
  updateEmployee,
  deactivateEmployee,
  reactivateEmployee,
};
