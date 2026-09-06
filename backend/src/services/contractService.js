import pool from "../db.js";

const VALID_STATUSES = ["draft", "active", "expired", "terminated"];

/**
 * Check if a date range [start_date, end_date] overlaps with an existing contract for the employee.
 * Exclude excludeContractId if updating.
 */
export const checkContractOverlap = async (
  employee_id,
  start_date,
  end_date,
  excludeContractId = null
) => {
  let query = `
    SELECT id, start_date, end_date, status
    FROM contracts
    WHERE employee_id = $1
  `;
  const params = [employee_id];

  if (excludeContractId) {
    params.push(excludeContractId);
    query += ` AND id != $${params.length}`;
  }

  // Overlap condition logic:
  // (A.start <= B.end OR B.end IS NULL) AND (A.end >= B.start OR A.end IS NULL)
  if (end_date) {
    params.push(start_date, end_date);
    query += ` AND (
      start_date <= $${params.length}
      AND (end_date IS NULL OR end_date >= $${params.length - 1})
    )`;
  } else {
    // New contract is open-ended (end_date is NULL)
    params.push(start_date);
    query += ` AND (
      end_date IS NULL
      OR end_date >= $${params.length}
    )`;
  }

  const result = await pool.query(query, params);
  return result.rows.length > 0;
};

/**
 * List all contracts with basic employee and salary structure info
 */
export const listContracts = async ({ employee_id, status, department, search }) => {
  let query = `
    SELECT 
      c.id,
      c.employee_id,
      e.name AS employee_name,
      e.email AS employee_email,
      c.start_date,
      c.end_date,
      c.wage,
      c.structure_id,
      ss.name AS structure_name,
      c.department,
      c.job_position,
      c.status,
      c.created_at,
      c.updated_at
    FROM contracts c
    LEFT JOIN employees e ON c.employee_id = e.id
    LEFT JOIN salary_structures ss ON c.structure_id = ss.id
    WHERE 1=1
  `;
  const params = [];

  if (employee_id) {
    params.push(employee_id);
    query += ` AND c.employee_id = $${params.length}`;
  }

  if (status) {
    params.push(status);
    query += ` AND c.status = $${params.length}`;
  }

  if (department) {
    params.push(department);
    query += ` AND c.department = $${params.length}`;
  }

  if (search && search.trim()) {
    const term = `%${search.trim().toLowerCase()}%`;
    params.push(term);
    const pIdx = params.length;
    query += ` AND (
      LOWER(e.name) LIKE $${pIdx}
      OR LOWER(e.email) LIKE $${pIdx}
      OR LOWER(c.job_position) LIKE $${pIdx}
      OR LOWER(c.department) LIKE $${pIdx}
      OR LOWER(CAST(c.id AS TEXT)) LIKE $${pIdx}
      OR LOWER(CONCAT('con-', LPAD(CAST(c.id AS TEXT), 4, '0'))) LIKE $${pIdx}
    )`;
  }

  query += ` ORDER BY c.start_date DESC, c.id DESC`;

  const result = await pool.query(query, params);

  return result.rows.map((row) => ({
    id: row.id,
    employee_id: row.employee_id,
    employee: {
      id: row.employee_id,
      name: row.employee_name,
      email: row.employee_email,
    },
    start_date: row.start_date,
    end_date: row.end_date,
    wage: Number(row.wage),
    structure_id: row.structure_id,
    structure_name: row.structure_name,
    department: row.department,
    job_position: row.job_position,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));
};

/**
 * Get single contract by ID
 */
export const getContractById = async (id) => {
  const query = `
    SELECT 
      c.id,
      c.employee_id,
      e.user_id,
      e.name AS employee_name,
      e.email AS employee_email,
      c.start_date,
      c.end_date,
      c.wage,
      c.structure_id,
      ss.name AS structure_name,
      c.department,
      c.job_position,
      c.status,
      c.created_at,
      c.updated_at
    FROM contracts c
    LEFT JOIN employees e ON c.employee_id = e.id
    LEFT JOIN salary_structures ss ON c.structure_id = ss.id
    WHERE c.id = $1
    LIMIT 1
  `;
  const result = await pool.query(query, [id]);

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    id: row.id,
    employee_id: row.employee_id,
    user_id: row.user_id,
    employee: {
      id: row.employee_id,
      name: row.employee_name,
      email: row.employee_email,
    },
    start_date: row.start_date,
    end_date: row.end_date,
    wage: Number(row.wage),
    structure_id: row.structure_id,
    structure_name: row.structure_name,
    department: row.department,
    job_position: row.job_position,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
};

/**
 * Get all contracts for an employee ID
 */
export const getEmployeeContracts = async (employeeId) => {
  const empCheck = await pool.query(
    "SELECT id, user_id FROM employees WHERE id = $1",
    [employeeId]
  );
  if (empCheck.rows.length === 0) {
    const err = new Error("Employee not found");
    err.statusCode = 404;
    throw err;
  }

  const query = `
    SELECT 
      c.id,
      c.employee_id,
      e.name AS employee_name,
      e.email AS employee_email,
      c.start_date,
      c.end_date,
      c.wage,
      c.structure_id,
      ss.name AS structure_name,
      c.department,
      c.job_position,
      c.status,
      c.created_at,
      c.updated_at
    FROM contracts c
    LEFT JOIN employees e ON c.employee_id = e.id
    LEFT JOIN salary_structures ss ON c.structure_id = ss.id
    WHERE c.employee_id = $1
    ORDER BY c.start_date DESC
  `;
  const result = await pool.query(query, [employeeId]);

  return result.rows.map((row) => ({
    id: row.id,
    employee_id: row.employee_id,
    employee: {
      id: row.employee_id,
      name: row.employee_name,
      email: row.employee_email,
    },
    start_date: row.start_date,
    end_date: row.end_date,
    wage: Number(row.wage),
    structure_id: row.structure_id,
    structure_name: row.structure_name,
    department: row.department,
    job_position: row.job_position,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));
};

/**
 * Get contracts for authenticated employee
 */
export const getMyContracts = async (userId) => {
  const empRes = await pool.query(
    "SELECT id FROM employees WHERE user_id = $1",
    [userId]
  );
  if (empRes.rows.length === 0) {
    const err = new Error("Employee profile not found");
    err.statusCode = 404;
    throw err;
  }

  const employeeId = empRes.rows[0].id;
  return await getEmployeeContracts(employeeId);
};

/**
 * Create a new contract safely with overlap checks
 */
export const createContract = async (data) => {
  const {
    employee_id,
    start_date,
    end_date = null,
    wage,
    structure_id,
    department,
    job_position,
    status = "draft",
  } = data;

  // Validate employee exists
  const empRes = await pool.query(
    "SELECT id, department, job_position FROM employees WHERE id = $1",
    [employee_id]
  );
  if (empRes.rows.length === 0) {
    const err = new Error("Employee not found");
    err.statusCode = 400;
    throw err;
  }
  const emp = empRes.rows[0];

  // Validate salary structure exists
  const structRes = await pool.query(
    "SELECT id FROM salary_structures WHERE id = $1",
    [structure_id]
  );
  if (structRes.rows.length === 0) {
    const err = new Error("Salary structure not found");
    err.statusCode = 400;
    throw err;
  }

  // Validate wage
  if (wage === undefined || wage === null || Number(wage) < 0) {
    const err = new Error("Wage must be greater than or equal to 0");
    err.statusCode = 400;
    throw err;
  }

  // Validate status
  if (!VALID_STATUSES.includes(status)) {
    const err = new Error(
      `Invalid contract status. Allowed: ${VALID_STATUSES.join(", ")}`
    );
    err.statusCode = 400;
    throw err;
  }

  // Validate dates
  if (end_date && new Date(end_date) < new Date(start_date)) {
    const err = new Error("End date must be greater than or equal to start date");
    err.statusCode = 400;
    throw err;
  }

  // Check date overlap
  const isOverlapping = await checkContractOverlap(
    employee_id,
    start_date,
    end_date
  );
  if (isOverlapping) {
    const err = new Error(
      "Contract period overlaps with an existing contract for this employee"
    );
    err.statusCode = 409;
    throw err;
  }

  const finalDept = department || emp.department;
  const finalPosition = job_position || emp.job_position;

  const insertQuery = `
    INSERT INTO contracts (
      employee_id,
      start_date,
      end_date,
      wage,
      structure_id,
      department,
      job_position,
      status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `;

  const result = await pool.query(insertQuery, [
    employee_id,
    start_date,
    end_date || null,
    wage,
    structure_id,
    finalDept,
    finalPosition,
    status,
  ]);

  return result.rows[0];
};

/**
 * Update an existing contract
 */
export const updateContract = async (id, data) => {
  const {
    start_date,
    end_date,
    wage,
    structure_id,
    department,
    job_position,
    status,
  } = data;

  const existingRes = await pool.query(
    "SELECT * FROM contracts WHERE id = $1",
    [id]
  );
  if (existingRes.rows.length === 0) {
    const err = new Error("Contract not found");
    err.statusCode = 404;
    throw err;
  }
  const existing = existingRes.rows[0];

  if (wage !== undefined && Number(wage) < 0) {
    const err = new Error("Wage must be greater than or equal to 0");
    err.statusCode = 400;
    throw err;
  }

  if (status && !VALID_STATUSES.includes(status)) {
    const err = new Error(
      `Invalid contract status. Allowed: ${VALID_STATUSES.join(", ")}`
    );
    err.statusCode = 400;
    throw err;
  }

  if (structure_id) {
    const structRes = await pool.query(
      "SELECT id FROM salary_structures WHERE id = $1",
      [structure_id]
    );
    if (structRes.rows.length === 0) {
      const err = new Error("Salary structure not found");
      err.statusCode = 400;
      throw err;
    }
  }

  const newStartDate =
    start_date !== undefined ? start_date : existing.start_date;
  const newEndDate = end_date !== undefined ? end_date : existing.end_date;

  if (newEndDate && new Date(newEndDate) < new Date(newStartDate)) {
    const err = new Error("End date must be greater than or equal to start date");
    err.statusCode = 400;
    throw err;
  }

  // Re-check overlap if dates changed
  if (start_date !== undefined || end_date !== undefined) {
    const isOverlapping = await checkContractOverlap(
      existing.employee_id,
      newStartDate,
      newEndDate,
      id
    );
    if (isOverlapping) {
      const err = new Error(
        "Contract period overlaps with an existing contract for this employee"
      );
      err.statusCode = 409;
      throw err;
    }
  }

  const updatedWage = wage !== undefined ? wage : existing.wage;
  const updatedStructureId =
    structure_id !== undefined ? structure_id : existing.structure_id;
  const updatedDepartment =
    department !== undefined ? department : existing.department;
  const updatedJobPosition =
    job_position !== undefined ? job_position : existing.job_position;
  const updatedStatus = status !== undefined ? status : existing.status;

  const updateQuery = `
    UPDATE contracts
    SET
      start_date = $1,
      end_date = $2,
      wage = $3,
      structure_id = $4,
      department = $5,
      job_position = $6,
      status = $7,
      updated_at = NOW()
    WHERE id = $8
    RETURNING *
  `;

  const result = await pool.query(updateQuery, [
    newStartDate,
    newEndDate || null,
    updatedWage,
    updatedStructureId,
    updatedDepartment,
    updatedJobPosition,
    updatedStatus,
    id,
  ]);

  return result.rows[0];
};

/**
 * Activate contract (status = 'active')
 */
export const activateContract = async (id) => {
  const existingRes = await pool.query(
    "SELECT * FROM contracts WHERE id = $1",
    [id]
  );
  if (existingRes.rows.length === 0) {
    const err = new Error("Contract not found");
    err.statusCode = 404;
    throw err;
  }
  const contract = existingRes.rows[0];

  const isOverlapping = await checkContractOverlap(
    contract.employee_id,
    contract.start_date,
    contract.end_date,
    id
  );
  if (isOverlapping) {
    const err = new Error(
      "Cannot activate contract because its period overlaps with another contract"
    );
    err.statusCode = 409;
    throw err;
  }

  const result = await pool.query(
    "UPDATE contracts SET status = 'active', updated_at = NOW() WHERE id = $1 RETURNING *",
    [id]
  );

  return result.rows[0];
};

/**
 * Terminate contract (status = 'terminated')
 */
export const terminateContract = async (id) => {
  const result = await pool.query(
    "UPDATE contracts SET status = 'terminated', updated_at = NOW() WHERE id = $1 RETURNING *",
    [id]
  );

  if (result.rows.length === 0) {
    const err = new Error("Contract not found");
    err.statusCode = 404;
    throw err;
  }

  return result.rows[0];
};

/**
 * Foundation for Payroll: Selects the valid contract covering the entire period
 * @param {number} employeeId
 * @param {string|Date} periodStart
 * @param {string|Date} periodEnd
 */
export const getContractForPeriod = async (
  employeeId,
  periodStart,
  periodEnd
) => {
  const query = `
    SELECT
      c.*,
      ss.name AS structure_name
    FROM contracts c
    LEFT JOIN salary_structures ss
      ON ss.id = c.structure_id
    WHERE c.employee_id = $1
      AND c.start_date <= $2
      AND (
        c.end_date IS NULL
        OR c.end_date >= $3
      )
    ORDER BY c.start_date DESC
    LIMIT 1
  `;

  const result = await pool.query(query, [employeeId, periodStart, periodEnd]);
  return result.rows.length > 0 ? result.rows[0] : null;
};

export default {
  listContracts,
  getContractById,
  getEmployeeContracts,
  getMyContracts,
  createContract,
  updateContract,
  activateContract,
  terminateContract,
  getContractForPeriod,
  checkContractOverlap,
};
