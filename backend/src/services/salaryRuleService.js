import pool from "../db.js";

const VALID_CATEGORIES = ["basic", "allowance", "deduction", "gross", "net"];
const VALID_TYPES = ["fixed", "percent", "formula"];

/**
 * Helper to validate integer ID
 */
const parseId = (id) => {
  const parsed = parseInt(id, 10);
  if (isNaN(parsed) || parsed <= 0 || String(parsed) !== String(id)) {
    return null;
  }
  return parsed;
};

/**
 * List salary rules with filtering, search, and pagination
 */
export const listSalaryRules = async ({
  category,
  type,
  search,
  page = 1,
  limit = 20,
}) => {
  const p = Math.max(1, parseInt(page, 10) || 1);
  const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const offset = (p - 1) * l;

  let whereClause = "WHERE 1=1";
  const params = [];

  if (category) {
    params.push(category.toLowerCase().trim());
    whereClause += ` AND LOWER(category) = $${params.length}`;
  }

  if (type) {
    params.push(type.toLowerCase().trim());
    whereClause += ` AND LOWER(type) = $${params.length}`;
  }

  if (search) {
    params.push(`%${search.trim()}%`);
    whereClause += ` AND (name ILIKE $${params.length} OR code ILIKE $${params.length})`;
  }

  // Count total matching records
  const countQuery = `
    SELECT COUNT(*) AS total
    FROM salary_rules
    ${whereClause}
  `;
  const countRes = await pool.query(countQuery, params);
  const total = parseInt(countRes.rows[0].total, 10);

  // Retrieve paginated records ordered by sequence ASC, id ASC
  const dataParams = [...params, l, offset];
  const dataQuery = `
    SELECT 
      id,
      name,
      code,
      category,
      sequence,
      type,
      value,
      created_at,
      updated_at
    FROM salary_rules
    ${whereClause}
    ORDER BY sequence ASC, id ASC
    LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}
  `;
  const dataRes = await pool.query(dataQuery, dataParams);

  return {
    data: dataRes.rows.map((row) => ({
      id: row.id,
      name: row.name,
      code: row.code,
      category: row.category,
      sequence: row.sequence,
      type: row.type,
      value: Number(row.value),
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
 * Get a single salary rule by ID
 */
export const getSalaryRuleById = async (id) => {
  const parsedId = parseId(id);
  if (!parsedId) {
    const err = new Error("Invalid salary rule ID");
    err.statusCode = 400;
    throw err;
  }

  const query = `
    SELECT 
      id,
      name,
      code,
      category,
      sequence,
      type,
      value,
      created_at,
      updated_at
    FROM salary_rules
    WHERE id = $1
    LIMIT 1
  `;
  const result = await pool.query(query, [parsedId]);

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    category: row.category,
    sequence: row.sequence,
    type: row.type,
    value: Number(row.value),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
};

/**
 * Create a new salary rule
 */
export const createSalaryRule = async (data) => {
  const {
    name,
    code,
    category,
    sequence = 10,
    type = "fixed",
    value = 0.0,
  } = data;

  if (!name || typeof name !== "string" || !name.trim()) {
    const err = new Error("Rule name is required");
    err.statusCode = 400;
    throw err;
  }

  if (!code || typeof code !== "string" || !code.trim()) {
    const err = new Error("Rule code is required");
    err.statusCode = 400;
    throw err;
  }

  const normalizedCode = code.toUpperCase().trim();
  const normalizedCategory = category ? category.toLowerCase().trim() : null;
  const normalizedType = type ? type.toLowerCase().trim() : "fixed";

  if (!normalizedCategory || !VALID_CATEGORIES.includes(normalizedCategory)) {
    const err = new Error(
      `Invalid category. Allowed values: ${VALID_CATEGORIES.join(", ")}`
    );
    err.statusCode = 400;
    throw err;
  }

  if (!VALID_TYPES.includes(normalizedType)) {
    const err = new Error(
      `Invalid amount type. Allowed values: ${VALID_TYPES.join(", ")}`
    );
    err.statusCode = 400;
    throw err;
  }

  const seq = parseInt(sequence, 10);
  if (isNaN(seq) || seq < 0) {
    const err = new Error("Sequence must be a non-negative integer");
    err.statusCode = 400;
    throw err;
  }

  const numValue = Number(value);
  if (isNaN(numValue) || numValue < 0) {
    const err = new Error("Value must be a non-negative number");
    err.statusCode = 400;
    throw err;
  }

  // Check code uniqueness
  const existingRes = await pool.query(
    "SELECT id FROM salary_rules WHERE code = $1",
    [normalizedCode]
  );
  if (existingRes.rows.length > 0) {
    const err = new Error(`Salary rule with code '${normalizedCode}' already exists`);
    err.statusCode = 409;
    throw err;
  }

  const insertQuery = `
    INSERT INTO salary_rules (name, code, category, sequence, type, value)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, name, code, category, sequence, type, value, created_at, updated_at
  `;
  const insertRes = await pool.query(insertQuery, [
    name.trim(),
    normalizedCode,
    normalizedCategory,
    seq,
    normalizedType,
    numValue,
  ]);

  const row = insertRes.rows[0];
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    category: row.category,
    sequence: row.sequence,
    type: row.type,
    value: Number(row.value),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
};

/**
 * Update an existing salary rule
 * (Code changes are prevented to maintain salary structure consistency)
 */
export const updateSalaryRule = async (id, data) => {
  const parsedId = parseId(id);
  if (!parsedId) {
    const err = new Error("Invalid salary rule ID");
    err.statusCode = 400;
    throw err;
  }

  const existing = await getSalaryRuleById(parsedId);
  if (!existing) {
    const err = new Error("Salary rule not found");
    err.statusCode = 404;
    throw err;
  }

  const { name, category, sequence, type, value } = data;

  let finalName = existing.name;
  if (name !== undefined) {
    if (!name || typeof name !== "string" || !name.trim()) {
      const err = new Error("Rule name cannot be empty");
      err.statusCode = 400;
      throw err;
    }
    finalName = name.trim();
  }

  let finalCategory = existing.category;
  if (category !== undefined) {
    const normCat = String(category).toLowerCase().trim();
    if (!VALID_CATEGORIES.includes(normCat)) {
      const err = new Error(
        `Invalid category. Allowed values: ${VALID_CATEGORIES.join(", ")}`
      );
      err.statusCode = 400;
      throw err;
    }
    finalCategory = normCat;
  }

  let finalSequence = existing.sequence;
  if (sequence !== undefined) {
    const seq = parseInt(sequence, 10);
    if (isNaN(seq) || seq < 0) {
      const err = new Error("Sequence must be a non-negative integer");
      err.statusCode = 400;
      throw err;
    }
    finalSequence = seq;
  }

  let finalType = existing.type;
  if (type !== undefined) {
    const normType = String(type).toLowerCase().trim();
    if (!VALID_TYPES.includes(normType)) {
      const err = new Error(
        `Invalid amount type. Allowed values: ${VALID_TYPES.join(", ")}`
      );
      err.statusCode = 400;
      throw err;
    }
    finalType = normType;
  }

  let finalValue = existing.value;
  if (value !== undefined) {
    const numVal = Number(value);
    if (isNaN(numVal) || numVal < 0) {
      const err = new Error("Value must be a non-negative number");
      err.statusCode = 400;
      throw err;
    }
    finalValue = numVal;
  }

  const updateQuery = `
    UPDATE salary_rules
    SET name = $1, category = $2, sequence = $3, type = $4, value = $5, updated_at = NOW()
    WHERE id = $6
    RETURNING id, name, code, category, sequence, type, value, created_at, updated_at
  `;
  const updateRes = await pool.query(updateQuery, [
    finalName,
    finalCategory,
    finalSequence,
    finalType,
    finalValue,
    parsedId,
  ]);

  const row = updateRes.rows[0];

  // Auto-detect and recalculate unfinalized payslips under structures containing this rule
  try {
    const { recalculateDraftPayslipsForRule } = await import("./payrollService.js");
    const { broadcastLeaderboardUpdate } = await import("./socketService.js");
    recalculateDraftPayslipsForRule(parsedId).catch((e) => console.warn(e.message));
    broadcastLeaderboardUpdate({ type: "RULE_UPDATED", ruleId: parsedId });
  } catch (recalcErr) {
    console.warn("Could not trigger auto-recalc for rule:", recalcErr.message);
  }

  return {
    id: row.id,
    name: row.name,
    code: row.code,
    category: row.category,
    sequence: row.sequence,
    type: row.type,
    value: Number(row.value),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
};

/**
 * Activate a salary rule (Soft status state / placeholder for rule lifecycle)
 */
export const activateSalaryRule = async (id) => {
  const parsedId = parseId(id);
  if (!parsedId) {
    const err = new Error("Invalid salary rule ID");
    err.statusCode = 400;
    throw err;
  }

  const existing = await getSalaryRuleById(parsedId);
  if (!existing) {
    const err = new Error("Salary rule not found");
    err.statusCode = 404;
    throw err;
  }

  const updateRes = await pool.query(
    "UPDATE salary_rules SET updated_at = NOW() WHERE id = $1 RETURNING *",
    [parsedId]
  );
  const row = updateRes.rows[0];
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    category: row.category,
    sequence: row.sequence,
    type: row.type,
    value: Number(row.value),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
};

/**
 * Deactivate a salary rule (Soft state change preserving structure references)
 */
export const deactivateSalaryRule = async (id) => {
  const parsedId = parseId(id);
  if (!parsedId) {
    const err = new Error("Invalid salary rule ID");
    err.statusCode = 400;
    throw err;
  }

  const existing = await getSalaryRuleById(parsedId);
  if (!existing) {
    const err = new Error("Salary rule not found");
    err.statusCode = 404;
    throw err;
  }

  const updateRes = await pool.query(
    "UPDATE salary_rules SET updated_at = NOW() WHERE id = $1 RETURNING *",
    [parsedId]
  );
  const row = updateRes.rows[0];
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    category: row.category,
    sequence: row.sequence,
    type: row.type,
    value: Number(row.value),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
};

export default {
  listSalaryRules,
  getSalaryRuleById,
  createSalaryRule,
  updateSalaryRule,
  activateSalaryRule,
  deactivateSalaryRule,
};
