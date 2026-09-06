import pool from "../db.js";
import notificationService from "./notificationService.js";

const VALID_PAYRUN_STATUSES = ["draft", "computed", "validated", "paid"];
const VALID_PAYSLIP_STATUSES = ["draft", "computed", "validated", "paid"];

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
 * Helper to round to 2 decimal places
 */
const round2 = (num) => Math.round((Number(num) + Number.EPSILON) * 100) / 100;

// =============================================================================
// PAYRUN FUNCTIONS
// =============================================================================

/**
 * List payruns with optional filters and pagination
 */
export const listPayruns = async ({
  status,
  from_date,
  to_date,
  page = 1,
  limit = 20,
}) => {
  const p = Math.max(1, parseInt(page, 10) || 1);
  const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const offset = (p - 1) * l;

  let whereClause = "WHERE 1=1";
  const params = [];

  if (status && status !== "all") {
    params.push(status.toLowerCase().trim());
    whereClause += ` AND pr.status = $${params.length}`;
  }

  if (from_date) {
    params.push(from_date);
    whereClause += ` AND pr.period_start >= $${params.length}`;
  }

  if (to_date) {
    params.push(to_date);
    whereClause += ` AND pr.period_end <= $${params.length}`;
  }

  // Count total payruns
  const countQuery = `
    SELECT COUNT(*) AS total
    FROM payruns pr
    ${whereClause}
  `;
  const countRes = await pool.query(countQuery, params);
  const total = parseInt(countRes.rows[0].total, 10);

  // Data query with payslip counts & structure name
  const dataParams = [...params, l, offset];
  const dataQuery = `
    SELECT 
      pr.id,
      pr.name,
      pr.period_start,
      pr.period_end,
      pr.structure_id,
      ss.name AS structure_name,
      pr.status,
      pr.paid_at,
      pr.created_at,
      pr.updated_at,
      COUNT(ps.id)::int AS payslip_count,
      COALESCE(SUM(ps.gross_salary), 0)::numeric(12,2) AS total_gross,
      COALESCE(SUM(ps.total_deductions), 0)::numeric(12,2) AS total_deductions,
      COALESCE(SUM(ps.net_salary), 0)::numeric(12,2) AS total_net
    FROM payruns pr
    JOIN salary_structures ss ON pr.structure_id = ss.id
    LEFT JOIN payslips ps ON pr.id = ps.payrun_id
    ${whereClause}
    GROUP BY pr.id, ss.name
    ORDER BY pr.period_start DESC, pr.id DESC
    LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}
  `;
  const dataRes = await pool.query(dataQuery, dataParams);

  return {
    data: dataRes.rows.map((row) => ({
      id: row.id,
      name: row.name,
      period_start: row.period_start,
      period_end: row.period_end,
      structure_id: row.structure_id,
      structure_name: row.structure_name,
      status: row.status,
      paid_at: row.paid_at,
      payslip_count: row.payslip_count,
      total_gross: Number(row.total_gross),
      total_deductions: Number(row.total_deductions),
      total_net: Number(row.total_net),
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
 * Get single payrun by ID
 */
export const getPayrunById = async (id) => {
  const parsedId = parseId(id);
  if (!parsedId) {
    const err = new Error("Invalid payrun ID");
    err.statusCode = 400;
    throw err;
  }

  const query = `
    SELECT 
      pr.id,
      pr.name,
      pr.period_start,
      pr.period_end,
      pr.structure_id,
      ss.name AS structure_name,
      pr.status,
      pr.paid_at,
      pr.created_at,
      pr.updated_at,
      COUNT(ps.id)::int AS payslip_count,
      COALESCE(SUM(ps.gross_salary), 0)::numeric(12,2) AS total_gross,
      COALESCE(SUM(ps.total_deductions), 0)::numeric(12,2) AS total_deductions,
      COALESCE(SUM(ps.net_salary), 0)::numeric(12,2) AS total_net
    FROM payruns pr
    JOIN salary_structures ss ON pr.structure_id = ss.id
    LEFT JOIN payslips ps ON pr.id = ps.payrun_id
    WHERE pr.id = $1
    GROUP BY pr.id, ss.name
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
    period_start: row.period_start,
    period_end: row.period_end,
    structure_id: row.structure_id,
    structure_name: row.structure_name,
    status: row.status,
    paid_at: row.paid_at,
    payslip_count: row.payslip_count,
    total_gross: Number(row.total_gross),
    total_deductions: Number(row.total_deductions),
    total_net: Number(row.total_net),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
};

/**
 * Create a new Payrun
 */
export const createPayrun = async (data) => {
  const { name, period_start, period_end, structure_id } = data;

  if (!name || typeof name !== "string" || !name.trim()) {
    const err = new Error("Payrun name is required");
    err.statusCode = 400;
    throw err;
  }

  if (!period_start || !period_end) {
    const err = new Error("period_start and period_end are required");
    err.statusCode = 400;
    throw err;
  }

  if (new Date(period_end) < new Date(period_start)) {
    const err = new Error("period_end must be greater than or equal to period_start");
    err.statusCode = 400;
    throw err;
  }

  // Determine structure_id: if not explicitly supplied, fallback to default first structure
  let finalStructureId = structure_id ? parseId(structure_id) : null;
  if (!finalStructureId) {
    const defaultStructRes = await pool.query(
      "SELECT id FROM salary_structures ORDER BY id ASC LIMIT 1"
    );
    if (defaultStructRes.rows.length === 0) {
      const err = new Error("No salary structure found to associate with payrun");
      err.statusCode = 400;
      throw err;
    }
    finalStructureId = defaultStructRes.rows[0].id;
  } else {
    const structCheck = await pool.query(
      "SELECT id FROM salary_structures WHERE id = $1",
      [finalStructureId]
    );
    if (structCheck.rows.length === 0) {
      const err = new Error("Referenced salary structure not found");
      err.statusCode = 400;
      throw err;
    }
  }

  // Prevent duplicate payruns with same name and overlapping/exact period
  const dupCheck = await pool.query(
    `SELECT id FROM payruns 
     WHERE name = $1 AND period_start = $2 AND period_end = $3`,
    [name.trim(), period_start, period_end]
  );
  if (dupCheck.rows.length > 0) {
    const err = new Error("A payrun with this name and exact period already exists");
    err.statusCode = 409;
    throw err;
  }

  const insertQuery = `
    INSERT INTO payruns (name, period_start, period_end, structure_id, status)
    VALUES ($1, $2, $3, $4, 'draft')
    RETURNING id, name, period_start, period_end, structure_id, status, created_at, updated_at
  `;
  const insertRes = await pool.query(insertQuery, [
    name.trim(),
    period_start,
    period_end,
    finalStructureId,
  ]);

  return insertRes.rows[0];
};

/**
 * Update an existing draft payrun
 */
export const updatePayrun = async (id, data) => {
  const parsedId = parseId(id);
  if (!parsedId) {
    const err = new Error("Invalid payrun ID");
    err.statusCode = 400;
    throw err;
  }

  const existing = await getPayrunById(parsedId);
  if (!existing) {
    const err = new Error("Payrun not found");
    err.statusCode = 404;
    throw err;
  }

  if (existing.status !== "draft") {
    const err = new Error("Only draft payruns can be edited");
    err.statusCode = 409;
    throw err;
  }

  const { name, period_start, period_end, structure_id } = data;

  const finalName = name !== undefined ? name.trim() : existing.name;
  const finalStart = period_start !== undefined ? period_start : existing.period_start;
  const finalEnd = period_end !== undefined ? period_end : existing.period_end;
  let finalStructureId = existing.structure_id;

  if (new Date(finalEnd) < new Date(finalStart)) {
    const err = new Error("period_end must be greater than or equal to period_start");
    err.statusCode = 400;
    throw err;
  }

  if (structure_id !== undefined) {
    const pStruct = parseId(structure_id);
    if (!pStruct) {
      const err = new Error("Invalid structure_id");
      err.statusCode = 400;
      throw err;
    }
    const structCheck = await pool.query(
      "SELECT id FROM salary_structures WHERE id = $1",
      [pStruct]
    );
    if (structCheck.rows.length === 0) {
      const err = new Error("Salary structure not found");
      err.statusCode = 400;
      throw err;
    }
    finalStructureId = pStruct;
  }

  const updateQuery = `
    UPDATE payruns
    SET name = $1, period_start = $2, period_end = $3, structure_id = $4, updated_at = NOW()
    WHERE id = $5
    RETURNING id, name, period_start, period_end, structure_id, status, created_at, updated_at
  `;
  const updateRes = await pool.query(updateQuery, [
    finalName,
    finalStart,
    finalEnd,
    finalStructureId,
    parsedId,
  ]);

  return updateRes.rows[0];
};

// =============================================================================
// PAYROLL CALCULATION ENGINE
// =============================================================================

/**
 * Internal calculation engine for one employee given contract, rules, attendance, and leaves
 */
const calculateEmployeePayrollInternal = ({
  employee,
  contract,
  rules,
  attendanceRecords,
  timeOffRequests,
}) => {
  const wage = Number(contract.wage) || 0;
  const lines = [];
  const context = {
    contract_wage: wage,
    basic: 0,
    gross: 0,
    allowance: 0,
    deduction: 0,
  };

  let basicSalary = 0;
  let grossSalary = 0;
  let totalDeductions = 0;

  // Process rules ordered by sequence ASC
  for (const rule of rules) {
    const ruleType = (rule.type || "fixed").toLowerCase();
    const ruleCategory = (rule.category || "basic").toLowerCase();
    const ruleValue = Number(rule.value) || 0;
    let amount = 0;

    if (ruleType === "fixed") {
      // If basic and value is 0, defaults to contract wage
      if (ruleCategory === "basic" && ruleValue === 0) {
        amount = wage;
      } else {
        amount = ruleValue;
      }
    } else if (ruleType === "percent") {
      // Percent is calculated against base (Basic salary if available, else contract wage)
      const baseAmount = context.basic > 0 ? context.basic : wage;
      amount = round2((baseAmount * ruleValue) / 100);
    } else if (ruleType === "formula") {
      if (ruleCategory === "gross" || rule.code === "GROSS") {
        amount = round2(context.basic + context.allowance);
      } else if (ruleCategory === "net" || rule.code === "NET") {
        const curGross = context.gross > 0 ? context.gross : (context.basic + context.allowance);
        amount = round2(Math.max(0, curGross - context.deduction));
      } else {
        amount = ruleValue;
      }
    }

    amount = round2(Math.max(0, amount));

    // Update calculation context
    if (ruleCategory === "basic" || rule.code === "BASIC") {
      context.basic = amount;
      basicSalary = amount;
    } else if (ruleCategory === "allowance") {
      context.allowance = round2(context.allowance + amount);
    } else if (ruleCategory === "gross" || rule.code === "GROSS") {
      context.gross = amount;
      grossSalary = amount;
    } else if (ruleCategory === "deduction") {
      context.deduction = round2(context.deduction + amount);
      totalDeductions = round2(totalDeductions + amount);
    }

    context[rule.code] = amount;

    lines.push({
      code: rule.code,
      name: rule.name,
      category: ruleCategory,
      type: ruleType,
      amount: amount,
    });
  }

  // Ensure gross & net are non-zero / consistent if not explicit
  if (grossSalary === 0) {
    grossSalary = round2(context.basic + context.allowance);
  }
  const netSalary = round2(Math.max(0, grossSalary - totalDeductions));

  // Compute worked days from attendance records
  let workedDays = 0;
  for (const att of attendanceRecords) {
    if (att.status === "present" || att.status === "late") {
      workedDays += 1;
    } else if (att.status === "half_day") {
      workedDays += 0.5;
    }
  }

  // Detect pre-flight warnings
  const warnings = [];
  if (!employee.bank_account_number && !employee.bank_name) {
    warnings.push({ code: "MISSING_BANK_DETAILS", message: "Employee does not have bank account information configured on profile" });
  }
  if (!contract || contract.status !== "active") {
    warnings.push({ code: "INACTIVE_CONTRACT", message: "Contract is not in active status for the current pay period" });
  }
  const unclosedAttendance = attendanceRecords.filter((a) => !a.check_out && a.status !== "absent");
  if (unclosedAttendance.length > 0) {
    warnings.push({ code: "UNCLOSED_ATTENDANCE", message: `${unclosedAttendance.length} attendance record(s) with missing check-out detected` });
  }

  return {
    contract_id: contract.id,
    worked_days: workedDays,
    basic_salary: basicSalary,
    gross_salary: grossSalary,
    total_deductions: totalDeductions,
    net_salary: netSalary,
    lines,
    warnings,
    attendance_summary: {
      total_records: attendanceRecords.length,
      worked_days: workedDays,
      unclosed_punches: unclosedAttendance.length,
    },
    leave_summary: {
      total_requests: timeOffRequests.length,
    },
  };
};

/**
 * Calculate payroll for an entire payrun
 */
export const calculatePayrun = async (id, options = {}) => {
  const parsedId = parseId(id);
  if (!parsedId) {
    const err = new Error("Invalid payrun ID");
    err.statusCode = 400;
    throw err;
  }

  const payrun = await getPayrunById(parsedId);
  if (!payrun) {
    const err = new Error("Payrun not found");
    err.statusCode = 404;
    throw err;
  }

  if (payrun.status === "validated" || payrun.status === "paid") {
    const err = new Error("Cannot recalculate a finalized or paid payrun");
    err.statusCode = 409;
    throw err;
  }

  const { employee_ids } = options || {};

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Fetch active employees (or specific selected employees)
    let employeesQuery = "SELECT id, name, email, department, job_position, status FROM employees WHERE status = 'active'";
    const empParams = [];
    if (Array.isArray(employee_ids) && employee_ids.length > 0) {
      empParams.push(employee_ids.map(Number));
      employeesQuery += ` AND id = ANY($1::int[])`;
    }
    employeesQuery += " ORDER BY id ASC";

    const employeesRes = await client.query(employeesQuery, empParams);
    const employees = employeesRes.rows;

    let employeesProcessed = 0;
    let employeesSkipped = 0;
    const skippedDetails = [];
    const createdPayslips = [];

    let sumGross = 0;
    let sumDeductions = 0;
    let sumNet = 0;

    for (const emp of employees) {
      // 2. Find contract covering the FULL payroll period: start_date <= period_start AND (end_date IS NULL OR end_date >= period_end)
      const contractRes = await client.query(
        `SELECT id, structure_id, wage, start_date, end_date, status
         FROM contracts
         WHERE employee_id = $1
           AND start_date <= $2
           AND (end_date IS NULL OR end_date >= $3)
         ORDER BY start_date DESC
         LIMIT 1`,
        [emp.id, payrun.period_start, payrun.period_end]
      );

      if (contractRes.rows.length === 0) {
        employeesSkipped++;
        skippedDetails.push({
          employee_id: emp.id,
          name: emp.name,
          reason: "No active contract covering the full payroll period",
        });
        continue;
      }

      const contract = contractRes.rows[0];

      // 3. Fetch structure rules
      const structureId = contract.structure_id || payrun.structure_id;
      const structRes = await client.query(
        "SELECT rule_ids FROM salary_structures WHERE id = $1",
        [structureId]
      );

      let ruleIds = [];
      if (structRes.rows.length > 0 && Array.isArray(structRes.rows[0].rule_ids)) {
        ruleIds = structRes.rows[0].rule_ids;
      }

      let rules = [];
      if (ruleIds.length > 0) {
        const rulesRes = await client.query(
          "SELECT id, name, code, category, sequence, type, value FROM salary_rules WHERE id = ANY($1::int[]) ORDER BY sequence ASC, id ASC",
          [ruleIds]
        );
        rules = rulesRes.rows;
      }

      // 4. Fetch attendance records in period
      const attRes = await client.query(
        `SELECT id, attendance_date, worked_hours, status
         FROM attendance
         WHERE employee_id = $1
           AND attendance_date >= $2
           AND attendance_date <= $3`,
        [emp.id, payrun.period_start, payrun.period_end]
      );
      const attendanceRecords = attRes.rows;

      // 5. Fetch approved time-off requests in period
      const leaveRes = await client.query(
        `SELECT id, type_id, start_date, end_date, duration, status
         FROM time_off_requests
         WHERE employee_id = $1
           AND status = 'approved'
           AND start_date <= $3
           AND end_date >= $2`,
        [emp.id, payrun.period_start, payrun.period_end]
      );
      const timeOffRequests = leaveRes.rows;

      // 6. Calculate payslip metrics
      const calculated = calculateEmployeePayrollInternal({
        employee: emp,
        contract,
        rules,
        attendanceRecords,
        timeOffRequests,
      });

      // 7. Upsert payslip (replace if draft already exists for this payrun & employee)
      const upsertQuery = `
        INSERT INTO payslips (
          payrun_id,
          employee_id,
          contract_id,
          worked_days,
          basic_salary,
          gross_salary,
          total_deductions,
          net_salary,
          lines,
          status,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'computed', NOW())
        ON CONFLICT (payrun_id, employee_id) DO UPDATE SET
          contract_id = EXCLUDED.contract_id,
          worked_days = EXCLUDED.worked_days,
          basic_salary = EXCLUDED.basic_salary,
          gross_salary = EXCLUDED.gross_salary,
          total_deductions = EXCLUDED.total_deductions,
          net_salary = EXCLUDED.net_salary,
          lines = EXCLUDED.lines,
          status = 'computed',
          updated_at = NOW()
        RETURNING id, payrun_id, employee_id, basic_salary, gross_salary, total_deductions, net_salary, status
      `;

      const payslipRes = await client.query(upsertQuery, [
        parsedId,
        emp.id,
        contract.id,
        calculated.worked_days,
        calculated.basic_salary,
        calculated.gross_salary,
        calculated.total_deductions,
        calculated.net_salary,
        JSON.stringify(calculated.lines),
      ]);

      createdPayslips.push(payslipRes.rows[0]);
      employeesProcessed++;
      sumGross = round2(sumGross + calculated.gross_salary);
      sumDeductions = round2(sumDeductions + calculated.total_deductions);
      sumNet = round2(sumNet + calculated.net_salary);
    }

    // 8. Update payrun status to 'computed'
    await client.query(
      "UPDATE payruns SET status = 'computed', updated_at = NOW() WHERE id = $1",
      [parsedId]
    );

    await client.query("COMMIT");

    return {
      payrun_id: parsedId,
      name: payrun.name,
      status: "computed",
      employees_processed: employeesProcessed,
      payslips_created: createdPayslips.length,
      employees_skipped: employeesSkipped,
      skipped_details: skippedDetails,
      total_gross: sumGross,
      total_deductions: sumDeductions,
      total_net: sumNet,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Finalize Payrun (Transitions payrun and its payslips to 'validated' / locked state)
 */
export const finalizePayrun = async (id) => {
  const parsedId = parseId(id);
  if (!parsedId) {
    const err = new Error("Invalid payrun ID");
    err.statusCode = 400;
    throw err;
  }

  const payrun = await getPayrunById(parsedId);
  if (!payrun) {
    const err = new Error("Payrun not found");
    err.statusCode = 404;
    throw err;
  }

  if (payrun.status === "validated" || payrun.status === "paid") {
    const err = new Error("Payrun is already finalized");
    err.statusCode = 409;
    throw err;
  }

  if (!payrun.payslip_count || parseInt(payrun.payslip_count, 10) === 0) {
    await calculatePayrun(parsedId);
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Update payslips to validated
    await client.query(
      "UPDATE payslips SET status = 'validated', updated_at = NOW() WHERE payrun_id = $1",
      [parsedId]
    );

    // Update payrun to validated
    const payrunUpdateRes = await client.query(
      "UPDATE payruns SET status = 'validated', updated_at = NOW() WHERE id = $1 RETURNING id, name, status, period_start, period_end, paid_at, updated_at",
      [parsedId]
    );

    await client.query("COMMIT");

    // Send notification to payroll users/admins
    try {
      await notificationService.notifyRoles(["admin", "hr_payroll_manager", "hr_payroll_user"], {
        title: "Payrun Batch Validated",
        message: `Payrun "${payrun.name}" has been validated and locked for disbursement.`,
        type: "info",
        link: `/payroll/payruns/${parsedId}`,
      });
    } catch (notifErr) {
      console.warn("Failed to dispatch payrun validation notification:", notifErr.message);
    }

    return payrunUpdateRes.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Mark Payrun as Paid (Transitions payrun and payslips to 'paid' state)
 */
export const markPayrunPaid = async (id) => {
  const parsedId = parseId(id);
  if (!parsedId) {
    const err = new Error("Invalid payrun ID");
    err.statusCode = 400;
    throw err;
  }

  const payrun = await getPayrunById(parsedId);
  if (!payrun) {
    const err = new Error("Payrun not found");
    err.statusCode = 404;
    throw err;
  }

  if (payrun.status === "paid") {
    const err = new Error("Payrun is already marked as paid");
    err.statusCode = 409;
    throw err;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Update payslips to paid
    await client.query(
      "UPDATE payslips SET status = 'paid', updated_at = NOW() WHERE payrun_id = $1",
      [parsedId]
    );

    // Update payrun to paid with paid_at timestamp
    const payrunUpdateRes = await client.query(
      "UPDATE payruns SET status = 'paid', paid_at = NOW(), updated_at = NOW() WHERE id = $1 RETURNING id, name, status, period_start, period_end, paid_at, updated_at",
      [parsedId]
    );

    await client.query("COMMIT");

    // Send notifications to all paid employees
    try {
      const empUsersRes = await pool.query(
        `SELECT DISTINCT e.user_id, e.name
         FROM payslips ps
         JOIN employees e ON ps.employee_id = e.id
         WHERE ps.payrun_id = $1 AND e.user_id IS NOT NULL`,
        [parsedId]
      );
      for (const emp of empUsersRes.rows) {
        await notificationService.createNotification({
          userId: emp.user_id,
          title: "Payslip Disbursed",
          message: `Your salary for ${payrun.period_start} to ${payrun.period_end} has been disbursed.`,
          type: "success",
          link: "/my-payslips",
        });
      }
    } catch (notifErr) {
      console.warn("Failed to dispatch payslip disbursement notifications:", notifErr.message);
    }

    return payrunUpdateRes.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Reset Payrun to Draft (transitions payrun and payslips to draft state)
 */
export const resetPayrunToDraft = async (id) => {
  const parsedId = parseId(id);
  if (!parsedId) {
    const err = new Error("Invalid payrun ID");
    err.statusCode = 400;
    throw err;
  }

  const payrun = await getPayrunById(parsedId);
  if (!payrun) {
    const err = new Error("Payrun not found");
    err.statusCode = 404;
    throw err;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Reset payslips to draft
    await client.query(
      "UPDATE payslips SET status = 'draft', updated_at = NOW() WHERE payrun_id = $1",
      [parsedId]
    );

    // Reset payrun to draft
    const payrunUpdateRes = await client.query(
      "UPDATE payruns SET status = 'draft', paid_at = NULL, updated_at = NOW() WHERE id = $1 RETURNING id, name, status, period_start, period_end, paid_at, updated_at",
      [parsedId]
    );

    await client.query("COMMIT");
    return payrunUpdateRes.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Delete a Payrun (and its associated payslips)
 */
export const deletePayrun = async (id) => {
  const parsedId = parseId(id);
  if (!parsedId) {
    const err = new Error("Invalid payrun ID");
    err.statusCode = 400;
    throw err;
  }

  const payrun = await getPayrunById(parsedId);
  if (!payrun) {
    const err = new Error("Payrun not found");
    err.statusCode = 404;
    throw err;
  }

  if (payrun.status === "paid") {
    const err = new Error("Cannot delete a paid payrun");
    err.statusCode = 400;
    throw err;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM payslips WHERE payrun_id = $1", [parsedId]);
    await client.query("DELETE FROM payruns WHERE id = $1", [parsedId]);
    await client.query("COMMIT");
    return true;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

// =============================================================================
// PAYSLIP FUNCTIONS
// =============================================================================

/**
 * List all payslips with filters and pagination
 */
export const listPayslips = async ({
  payrun_id,
  employee_id,
  status,
  page = 1,
  limit = 20,
}) => {
  const p = Math.max(1, parseInt(page, 10) || 1);
  const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const offset = (p - 1) * l;

  let whereClause = "WHERE 1=1";
  const params = [];

  if (payrun_id) {
    params.push(parseId(payrun_id));
    whereClause += ` AND ps.payrun_id = $${params.length}`;
  }

  if (employee_id) {
    params.push(parseId(employee_id));
    whereClause += ` AND ps.employee_id = $${params.length}`;
  }

  if (status && status !== "all") {
    params.push(status.toLowerCase().trim());
    whereClause += ` AND ps.status = $${params.length}`;
  }

  // Total count
  const countQuery = `
    SELECT COUNT(*) AS total
    FROM payslips ps
    ${whereClause}
  `;
  const countRes = await pool.query(countQuery, params);
  const total = parseInt(countRes.rows[0].total, 10);

  // Data query
  const dataParams = [...params, l, offset];
  const dataQuery = `
    SELECT 
      ps.id,
      ps.payrun_id,
      pr.name AS payrun_name,
      pr.period_start,
      pr.period_end,
      ps.employee_id,
      e.name AS employee_name,
      e.email AS employee_email,
      e.department,
      e.job_position,
      ps.contract_id,
      ps.worked_days,
      ps.basic_salary,
      ps.gross_salary,
      ps.total_deductions,
      ps.net_salary,
      ps.lines,
      ps.status,
      ps.created_at,
      ps.updated_at
    FROM payslips ps
    JOIN payruns pr ON ps.payrun_id = pr.id
    JOIN employees e ON ps.employee_id = e.id
    ${whereClause}
    ORDER BY pr.period_start DESC, ps.id DESC
    LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}
  `;
  const dataRes = await pool.query(dataQuery, dataParams);

  return {
    data: dataRes.rows.map((row) => ({
      id: row.id,
      payrun_id: row.payrun_id,
      payrun_name: row.payrun_name,
      period_start: row.period_start,
      period_end: row.period_end,
      employee_id: row.employee_id,
      employee_name: row.employee_name,
      employee_email: row.employee_email,
      department: row.department,
      job_position: row.job_position,
      contract_id: row.contract_id,
      worked_days: Number(row.worked_days),
      basic_salary: Number(row.basic_salary),
      gross_salary: Number(row.gross_salary),
      total_deductions: Number(row.total_deductions),
      net_salary: Number(row.net_salary),
      lines: row.lines,
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
 * Get single payslip by ID
 */
export const getPayslipById = async (id) => {
  const parsedId = parseId(id);
  if (!parsedId) {
    const err = new Error("Invalid payslip ID");
    err.statusCode = 400;
    throw err;
  }

  const query = `
    SELECT 
      ps.id,
      ps.payrun_id,
      pr.name AS payrun_name,
      pr.period_start,
      pr.period_end,
      ps.employee_id,
      e.user_id,
      e.name AS employee_name,
      e.email AS employee_email,
      e.department,
      e.job_position,
      ps.contract_id,
      c.wage AS contract_wage,
      c.structure_id,
      ss.name AS structure_name,
      ps.worked_days,
      ps.basic_salary,
      ps.gross_salary,
      ps.total_deductions,
      ps.net_salary,
      ps.lines,
      ps.status,
      ps.created_at,
      ps.updated_at
    FROM payslips ps
    JOIN payruns pr ON ps.payrun_id = pr.id
    JOIN employees e ON ps.employee_id = e.id
    JOIN contracts c ON ps.contract_id = c.id
    JOIN salary_structures ss ON c.structure_id = ss.id
    WHERE ps.id = $1
    LIMIT 1
  `;
  const result = await pool.query(query, [parsedId]);

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    id: row.id,
    payrun_id: row.payrun_id,
    payrun_name: row.payrun_name,
    period_start: row.period_start,
    period_end: row.period_end,
    employee_id: row.employee_id,
    user_id: row.user_id,
    employee_name: row.employee_name,
    employee_email: row.employee_email,
    department: row.department,
    job_position: row.job_position,
    contract_id: row.contract_id,
    contract_wage: Number(row.contract_wage),
    structure_id: row.structure_id,
    structure_name: row.structure_name,
    worked_days: Number(row.worked_days),
    basic_salary: Number(row.basic_salary),
    gross_salary: Number(row.gross_salary),
    total_deductions: Number(row.total_deductions),
    net_salary: Number(row.net_salary),
    lines: row.lines,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
};

/**
 * Get all payslips for an employee with optional filters & pagination
 */
export const getEmployeePayslips = async (employeeId, { payrun_id, page = 1, limit = 20 }) => {
  return await listPayslips({
    employee_id: employeeId,
    payrun_id,
    page,
    limit,
  });
};

/**
 * Get all payslips belonging to a specific payrun
 */
export const getPayrunPayslips = async (payrunId) => {
  const parsedPayrunId = parseId(payrunId);
  if (!parsedPayrunId) {
    const err = new Error("Invalid payrun ID");
    err.statusCode = 400;
    throw err;
  }

  const result = await listPayslips({ payrun_id: parsedPayrunId, limit: 100 });
  return result.data;
};

/**
 * Recalculate a single payslip
 */
export const recalculatePayslip = async (id) => {
  const parsedId = parseId(id);
  if (!parsedId) {
    const err = new Error("Invalid payslip ID");
    err.statusCode = 400;
    throw err;
  }

  const existing = await getPayslipById(parsedId);
  if (!existing) {
    const err = new Error("Payslip not found");
    err.statusCode = 404;
    throw err;
  }

  const payrun = await getPayrunById(existing.payrun_id);
  if (payrun.status === "validated" || payrun.status === "paid") {
    const err = new Error("Cannot recalculate payslip of a finalized or paid payrun");
    err.statusCode = 409;
    throw err;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Employee
    const empRes = await client.query(
      "SELECT id, name, email, department, job_position FROM employees WHERE id = $1",
      [existing.employee_id]
    );
    const emp = empRes.rows[0];

    // 2. Contract covering full period
    const contractRes = await client.query(
      `SELECT id, structure_id, wage, start_date, end_date, status
       FROM contracts
       WHERE employee_id = $1
         AND start_date <= $2
         AND (end_date IS NULL OR end_date >= $3)
       ORDER BY start_date DESC
       LIMIT 1`,
      [emp.id, payrun.period_start, payrun.period_end]
    );
    if (contractRes.rows.length === 0) {
      const err = new Error("Employee no longer has a contract covering the entire payrun period");
      err.statusCode = 400;
      throw err;
    }
    const contract = contractRes.rows[0];

    // 3. Structure & Rules
    const structureId = contract.structure_id || payrun.structure_id;
    const structRes = await client.query(
      "SELECT rule_ids FROM salary_structures WHERE id = $1",
      [structureId]
    );

    let ruleIds = [];
    if (structRes.rows.length > 0 && Array.isArray(structRes.rows[0].rule_ids)) {
      ruleIds = structRes.rows[0].rule_ids;
    }

    let rules = [];
    if (ruleIds.length > 0) {
      const rulesRes = await client.query(
        "SELECT id, name, code, category, sequence, type, value FROM salary_rules WHERE id = ANY($1::int[]) ORDER BY sequence ASC, id ASC",
        [ruleIds]
      );
      rules = rulesRes.rows;
    }

    // 4. Attendance
    const attRes = await client.query(
      `SELECT id, attendance_date, worked_hours, status
       FROM attendance
       WHERE employee_id = $1
         AND attendance_date >= $2
         AND attendance_date <= $3`,
      [emp.id, payrun.period_start, payrun.period_end]
    );

    // 5. Approved Leaves
    const leaveRes = await client.query(
      `SELECT id, type_id, start_date, end_date, duration, status
       FROM time_off_requests
       WHERE employee_id = $1
         AND status = 'approved'
         AND start_date <= $3
         AND end_date >= $2`,
      [emp.id, payrun.period_start, payrun.period_end]
    );

    // 6. Calculate
    const calculated = calculateEmployeePayrollInternal({
      employee: emp,
      contract,
      rules,
      attendanceRecords: attRes.rows,
      timeOffRequests: leaveRes.rows,
    });

    // 7. Update Payslip
    const updateQuery = `
      UPDATE payslips
      SET contract_id = $1,
          worked_days = $2,
          basic_salary = $3,
          gross_salary = $4,
          total_deductions = $5,
          net_salary = $6,
          lines = $7,
          status = 'computed',
          updated_at = NOW()
      WHERE id = $8
      RETURNING id, payrun_id, employee_id, basic_salary, gross_salary, total_deductions, net_salary, lines, status, updated_at
    `;
    const updateRes = await client.query(updateQuery, [
      contract.id,
      calculated.worked_days,
      calculated.basic_salary,
      calculated.gross_salary,
      calculated.total_deductions,
      calculated.net_salary,
      JSON.stringify(calculated.lines),
      parsedId,
    ]);

    await client.query("COMMIT");

    return await getPayslipById(parsedId);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Automatically recompute all active draft/computed payslips that depend on a modified salary structure
 */
export const recalculateDraftPayslipsForStructure = async (structureId) => {
  try {
    const sId = parseId(structureId);
    if (!sId) return;

    // Find all unfinalized payslips (status IN ('draft', 'computed')) under this structure
    const query = `
      SELECT ps.id AS payslip_id, ps.payrun_id
      FROM payslips ps
      JOIN contracts c ON ps.contract_id = c.id
      JOIN payruns pr ON ps.payrun_id = pr.id
      WHERE (c.structure_id = $1 OR pr.structure_id = $1)
        AND ps.status IN ('draft', 'computed')
        AND pr.status IN ('draft', 'computed')
    `;
    const res = await pool.query(query, [sId]);

    for (const row of res.rows) {
      try {
        await recalculatePayslip(row.payslip_id);
      } catch (recalcErr) {
        console.warn(`[Auto-Recalc] Failed to recompute payslip #${row.payslip_id}:`, recalcErr.message);
      }
    }
  } catch (err) {
    console.error(`[Auto-Recalc] Error in recalculateDraftPayslipsForStructure:`, err);
  }
};

/**
 * Automatically recompute all active draft/computed payslips that depend on a modified salary rule
 */
export const recalculateDraftPayslipsForRule = async (ruleId) => {
  try {
    const rId = parseId(ruleId);
    if (!rId) return;

    // Find all structures that include this rule
    const structRes = await pool.query(
      "SELECT id FROM salary_structures WHERE $1 = ANY(rule_ids)",
      [rId]
    );

    for (const s of structRes.rows) {
      await recalculateDraftPayslipsForStructure(s.id);
    }
  } catch (err) {
    console.error(`[Auto-Recalc] Error in recalculateDraftPayslipsForRule:`, err);
  }
};

export default {
  listPayruns,
  getPayrunById,
  createPayrun,
  updatePayrun,
  calculatePayrun,
  finalizePayrun,
  resetPayrunToDraft,
  markPayrunPaid,
  deletePayrun,
  listPayslips,
  getPayslipById,
  getEmployeePayslips,
  getPayrunPayslips,
  recalculatePayslip,
  recalculateDraftPayslipsForStructure,
  recalculateDraftPayslipsForRule,
};
