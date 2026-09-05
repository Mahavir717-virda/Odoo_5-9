import pool from "../db.js";

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
 * Helper to fetch salary rules ordered by sequence ASC for a given list of rule IDs
 */
const fetchRulesForIds = async (ruleIds) => {
  if (!ruleIds || !Array.isArray(ruleIds) || ruleIds.length === 0) {
    return [];
  }

  const query = `
    SELECT 
      id,
      name,
      code,
      category,
      sequence,
      type,
      value
    FROM salary_rules
    WHERE id = ANY($1::int[])
    ORDER BY sequence ASC, id ASC
  `;
  const res = await pool.query(query, [ruleIds]);
  return res.rows.map((r) => ({
    id: r.id,
    name: r.name,
    code: r.code,
    category: r.category,
    sequence: r.sequence,
    type: r.type,
    value: Number(r.value),
  }));
};

/**
 * List all salary structures with rules, search, and pagination
 */
export const listSalaryStructures = async ({
  search,
  page = 1,
  limit = 20,
}) => {
  const p = Math.max(1, parseInt(page, 10) || 1);
  const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const offset = (p - 1) * l;

  let whereClause = "WHERE 1=1";
  const params = [];

  if (search) {
    params.push(`%${search.trim()}%`);
    whereClause += ` AND name ILIKE $${params.length}`;
  }

  // Count total structures
  const countQuery = `
    SELECT COUNT(*) AS total
    FROM salary_structures
    ${whereClause}
  `;
  const countRes = await pool.query(countQuery, params);
  const total = parseInt(countRes.rows[0].total, 10);

  // Retrieve paginated structures
  const dataParams = [...params, l, offset];
  const dataQuery = `
    SELECT 
      id,
      name,
      rule_ids,
      created_at,
      updated_at
    FROM salary_structures
    ${whereClause}
    ORDER BY id ASC
    LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}
  `;
  const dataRes = await pool.query(dataQuery, dataParams);

  // Fetch populated rules for each structure
  const structuresWithRules = await Promise.all(
    dataRes.rows.map(async (row) => {
      const rules = await fetchRulesForIds(row.rule_ids || []);
      return {
        id: row.id,
        name: row.name,
        rule_ids: row.rule_ids || [],
        rules,
        created_at: row.created_at,
        updated_at: row.updated_at,
      };
    })
  );

  return {
    data: structuresWithRules,
    pagination: {
      page: p,
      limit: l,
      total,
      totalPages: Math.ceil(total / l) || 1,
    },
  };
};

/**
 * Get single salary structure by ID with detailed rules in sequence order
 */
export const getSalaryStructureById = async (id) => {
  const parsedId = parseId(id);
  if (!parsedId) {
    const err = new Error("Invalid salary structure ID");
    err.statusCode = 400;
    throw err;
  }

  const query = `
    SELECT 
      id,
      name,
      rule_ids,
      created_at,
      updated_at
    FROM salary_structures
    WHERE id = $1
    LIMIT 1
  `;
  const result = await pool.query(query, [parsedId]);

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  const rules = await fetchRulesForIds(row.rule_ids || []);

  return {
    id: row.id,
    name: row.name,
    rule_ids: row.rule_ids || [],
    rules,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
};

/**
 * Create a new salary structure
 */
export const createSalaryStructure = async (data) => {
  const { name, rule_ids = [] } = data;

  if (!name || typeof name !== "string" || !name.trim()) {
    const err = new Error("Structure name is required");
    err.statusCode = 400;
    throw err;
  }

  if (!Array.isArray(rule_ids)) {
    const err = new Error("rule_ids must be an array of integers");
    err.statusCode = 400;
    throw err;
  }

  // Parse and deduplicate rule IDs
  const parsedRuleIds = [];
  for (const rid of rule_ids) {
    const p = parseId(rid);
    if (!p) {
      const err = new Error(`Invalid rule ID in rule_ids: ${rid}`);
      err.statusCode = 400;
      throw err;
    }
    if (!parsedRuleIds.includes(p)) {
      parsedRuleIds.push(p);
    }
  }

  // Check structure name uniqueness
  const existingNameRes = await pool.query(
    "SELECT id FROM salary_structures WHERE name = $1",
    [name.trim()]
  );
  if (existingNameRes.rows.length > 0) {
    const err = new Error(`Salary structure with name '${name.trim()}' already exists`);
    err.statusCode = 409;
    throw err;
  }

  // Validate that all referenced rules exist
  if (parsedRuleIds.length > 0) {
    const checkRulesRes = await pool.query(
      "SELECT id FROM salary_rules WHERE id = ANY($1::int[])",
      [parsedRuleIds]
    );
    const existingRuleIds = checkRulesRes.rows.map((r) => r.id);
    const missingIds = parsedRuleIds.filter((id) => !existingRuleIds.includes(id));
    if (missingIds.length > 0) {
      const err = new Error(
        `Referenced salary rule ID(s) do not exist: ${missingIds.join(", ")}`
      );
      err.statusCode = 400;
      throw err;
    }
  }

  const insertQuery = `
    INSERT INTO salary_structures (name, rule_ids)
    VALUES ($1, $2)
    RETURNING id, name, rule_ids, created_at, updated_at
  `;
  const insertRes = await pool.query(insertQuery, [name.trim(), parsedRuleIds]);
  const row = insertRes.rows[0];

  const rules = await fetchRulesForIds(row.rule_ids || []);

  return {
    id: row.id,
    name: row.name,
    rule_ids: row.rule_ids || [],
    rules,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
};

/**
 * Update an existing salary structure
 */
export const updateSalaryStructure = async (id, data) => {
  const parsedId = parseId(id);
  if (!parsedId) {
    const err = new Error("Invalid salary structure ID");
    err.statusCode = 400;
    throw err;
  }

  const existing = await getSalaryStructureById(parsedId);
  if (!existing) {
    const err = new Error("Salary structure not found");
    err.statusCode = 404;
    throw err;
  }

  const { name, rule_ids } = data;

  let finalName = existing.name;
  if (name !== undefined) {
    if (!name || typeof name !== "string" || !name.trim()) {
      const err = new Error("Structure name cannot be empty");
      err.statusCode = 400;
      throw err;
    }
    const trimmed = name.trim();
    if (trimmed !== existing.name) {
      const dupRes = await pool.query(
        "SELECT id FROM salary_structures WHERE name = $1 AND id != $2",
        [trimmed, parsedId]
      );
      if (dupRes.rows.length > 0) {
        const err = new Error(`Salary structure with name '${trimmed}' already exists`);
        err.statusCode = 409;
        throw err;
      }
      finalName = trimmed;
    }
  }

  let finalRuleIds = existing.rule_ids;
  if (rule_ids !== undefined) {
    if (!Array.isArray(rule_ids)) {
      const err = new Error("rule_ids must be an array of integers");
      err.statusCode = 400;
      throw err;
    }

    const parsed = [];
    for (const rid of rule_ids) {
      const p = parseId(rid);
      if (!p) {
        const err = new Error(`Invalid rule ID in rule_ids: ${rid}`);
        err.statusCode = 400;
        throw err;
      }
      if (!parsed.includes(p)) {
        parsed.push(p);
      }
    }

    if (parsed.length > 0) {
      const checkRulesRes = await pool.query(
        "SELECT id FROM salary_rules WHERE id = ANY($1::int[])",
        [parsed]
      );
      const existingRuleIds = checkRulesRes.rows.map((r) => r.id);
      const missingIds = parsed.filter((id) => !existingRuleIds.includes(id));
      if (missingIds.length > 0) {
        const err = new Error(
          `Referenced salary rule ID(s) do not exist: ${missingIds.join(", ")}`
        );
        err.statusCode = 400;
        throw err;
      }
    }
    finalRuleIds = parsed;
  }

  const updateQuery = `
    UPDATE salary_structures
    SET name = $1, rule_ids = $2, updated_at = NOW()
    WHERE id = $3
    RETURNING id, name, rule_ids, created_at, updated_at
  `;
  const updateRes = await pool.query(updateQuery, [finalName, finalRuleIds, parsedId]);
  const row = updateRes.rows[0];

  const rules = await fetchRulesForIds(row.rule_ids || []);

  return {
    id: row.id,
    name: row.name,
    rule_ids: row.rule_ids || [],
    rules,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
};

/**
 * Activate a salary structure (Soft status state / placeholder for structure lifecycle)
 */
export const activateSalaryStructure = async (id) => {
  const parsedId = parseId(id);
  if (!parsedId) {
    const err = new Error("Invalid salary structure ID");
    err.statusCode = 400;
    throw err;
  }

  const existing = await getSalaryStructureById(parsedId);
  if (!existing) {
    const err = new Error("Salary structure not found");
    err.statusCode = 404;
    throw err;
  }

  const updateRes = await pool.query(
    "UPDATE salary_structures SET updated_at = NOW() WHERE id = $1 RETURNING *",
    [parsedId]
  );
  const row = updateRes.rows[0];
  const rules = await fetchRulesForIds(row.rule_ids || []);

  return {
    id: row.id,
    name: row.name,
    rule_ids: row.rule_ids || [],
    rules,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
};

/**
 * Deactivate a salary structure (Soft state change preserving contracts references)
 */
export const deactivateSalaryStructure = async (id) => {
  const parsedId = parseId(id);
  if (!parsedId) {
    const err = new Error("Invalid salary structure ID");
    err.statusCode = 400;
    throw err;
  }

  const existing = await getSalaryStructureById(parsedId);
  if (!existing) {
    const err = new Error("Salary structure not found");
    err.statusCode = 404;
    throw err;
  }

  const updateRes = await pool.query(
    "UPDATE salary_structures SET updated_at = NOW() WHERE id = $1 RETURNING *",
    [parsedId]
  );
  const row = updateRes.rows[0];
  const rules = await fetchRulesForIds(row.rule_ids || []);

  return {
    id: row.id,
    name: row.name,
    rule_ids: row.rule_ids || [],
    rules,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
};

export default {
  listSalaryStructures,
  getSalaryStructureById,
  createSalaryStructure,
  updateSalaryStructure,
  activateSalaryStructure,
  deactivateSalaryStructure,
};
