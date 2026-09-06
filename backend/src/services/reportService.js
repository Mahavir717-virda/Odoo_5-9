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
 * 1. GET /api/v1/reports/dashboard
 * Overall HR & Payroll high-level KPI dashboard metrics
 */
export const getDashboard = async () => {
  // Employees KPI
  const empRes = await pool.query(`
    SELECT
      COUNT(*)::int AS total_employees,
      COUNT(CASE WHEN status = 'active' THEN 1 END)::int AS active_employees,
      COUNT(CASE WHEN status != 'active' THEN 1 END)::int AS inactive_employees
    FROM employees
  `);

  // Contracts KPI
  const contractRes = await pool.query(`
    SELECT
      COUNT(CASE WHEN status = 'active' THEN 1 END)::int AS active_contracts,
      COUNT(CASE WHEN status = 'terminated' THEN 1 END)::int AS terminated_contracts
    FROM contracts
  `);

  // Attendance KPI (Today)
  const attRes = await pool.query(`
    SELECT
      COUNT(CASE WHEN status = 'present' OR status = 'late' THEN 1 END)::int AS present_today,
      COUNT(CASE WHEN check_in IS NOT NULL THEN 1 END)::int AS checked_in_today,
      COUNT(CASE WHEN check_out IS NOT NULL THEN 1 END)::int AS checked_out_today
    FROM attendance
    WHERE attendance_date = CURRENT_DATE
  `);

  // Leave / Time Off KPI
  const leaveRes = await pool.query(`
    SELECT
      COUNT(CASE WHEN status = 'pending' THEN 1 END)::int AS pending_leave_requests,
      COUNT(CASE WHEN status = 'approved' THEN 1 END)::int AS approved_leave_requests
    FROM time_off_requests
  `);

  // Payroll KPI
  const payrollRes = await pool.query(`
    SELECT
      COUNT(*)::int AS total_payruns,
      COUNT(CASE WHEN status = 'draft' THEN 1 END)::int AS draft_payruns,
      COUNT(CASE WHEN status = 'computed' THEN 1 END)::int AS calculated_payruns,
      COUNT(CASE WHEN status = 'validated' OR status = 'paid' THEN 1 END)::int AS finalized_payruns
    FROM payruns
  `);

  return {
    employees: empRes.rows[0] || {
      total_employees: 0,
      active_employees: 0,
      inactive_employees: 0,
    },
    contracts: contractRes.rows[0] || {
      active_contracts: 0,
      terminated_contracts: 0,
    },
    attendance: attRes.rows[0] || {
      present_today: 0,
      checked_in_today: 0,
      checked_out_today: 0,
    },
    leave: leaveRes.rows[0] || {
      pending_leave_requests: 0,
      approved_leave_requests: 0,
    },
    payroll: payrollRes.rows[0] || {
      total_payruns: 0,
      draft_payruns: 0,
      calculated_payruns: 0,
      finalized_payruns: 0,
    },
  };
};

/**
 * 2. GET /api/v1/reports/payroll-summary
 * Summary of payruns, payslips, gross, deductions, and net amounts
 */
export const getPayrollSummary = async ({ payrun_id, from_date, to_date, department }) => {
  let payrunWhere = "WHERE 1=1";
  const payrunParams = [];

  if (payrun_id) {
    const pId = parseId(payrun_id);
    if (!pId) {
      const err = new Error("Invalid payrun_id");
      err.statusCode = 400;
      throw err;
    }
    payrunParams.push(pId);
    payrunWhere += ` AND pr.id = $${payrunParams.length}`;
  }

  if (from_date) {
    payrunParams.push(from_date);
    payrunWhere += ` AND pr.period_end >= $${payrunParams.length}`;
  }

  if (to_date) {
    payrunParams.push(to_date);
    payrunWhere += ` AND pr.period_start <= $${payrunParams.length}`;
  }

  if (department && department !== "all") {
    payrunParams.push(department.toLowerCase().trim());
    payrunWhere += ` AND LOWER(TRIM(e.department)) = $${payrunParams.length}`;
  }

  const query = `
    SELECT
      COUNT(DISTINCT pr.id)::int AS payruns,
      COUNT(DISTINCT CASE WHEN pr.status = 'draft' THEN pr.id END)::int AS draft_payruns,
      COUNT(DISTINCT CASE WHEN pr.status = 'computed' THEN pr.id END)::int AS calculated_payruns,
      COUNT(DISTINCT CASE WHEN pr.status IN ('validated', 'paid') THEN pr.id END)::int AS finalized_payruns,
      COUNT(ps.id)::int AS total_payslips,
      COALESCE(SUM(ps.gross_salary), 0)::numeric(12,2) AS total_gross,
      COALESCE(SUM(ps.total_deductions), 0)::numeric(12,2) AS total_deductions,
      COALESCE(SUM(ps.net_salary), 0)::numeric(12,2) AS total_net
    FROM payruns pr
    LEFT JOIN payslips ps ON pr.id = ps.payrun_id
    LEFT JOIN employees e ON ps.employee_id = e.id
    ${payrunWhere}
  `;

  const res = await pool.query(query, payrunParams);
  const row = res.rows[0];

  return {
    payruns: row ? row.payruns : 0,
    draft_payruns: row ? row.draft_payruns : 0,
    calculated_payruns: row ? row.calculated_payruns : 0,
    finalized_payruns: row ? row.finalized_payruns : 0,
    total_payslips: row ? row.total_payslips : 0,
    total_gross: row ? Number(row.total_gross) : 0,
    total_deductions: row ? Number(row.total_deductions) : 0,
    total_net: row ? Number(row.total_net) : 0,
  };
};

/**
 * 3. GET /api/v1/reports/employee-summary
 * Employee demographic overview by status, department, and employment type
 */
export const getEmployeeSummary = async () => {
  // Totals & Status breakdown
  const totalRes = await pool.query(`
    SELECT
      COUNT(*)::int AS total_employees,
      COUNT(CASE WHEN status = 'active' THEN 1 END)::int AS active_employees,
      COUNT(CASE WHEN status != 'active' THEN 1 END)::int AS inactive_employees
    FROM employees
  `);

  // Department breakdown
  const deptRes = await pool.query(`
    SELECT
      COALESCE(NULLIF(TRIM(department), ''), 'Unassigned') AS department,
      COUNT(*)::int AS count
    FROM employees
    GROUP BY COALESCE(NULLIF(TRIM(department), ''), 'Unassigned')
    ORDER BY count DESC, department ASC
  `);

  // Employee type breakdown
  const typeRes = await pool.query(`
    SELECT
      employee_type,
      COUNT(*)::int AS count
    FROM employees
    GROUP BY employee_type
    ORDER BY count DESC, employee_type ASC
  `);

  const totals = totalRes.rows[0] || {
    total_employees: 0,
    active_employees: 0,
    inactive_employees: 0,
  };

  return {
    total_employees: totals.total_employees,
    active_employees: totals.active_employees,
    inactive_employees: totals.inactive_employees,
    employees_by_department: deptRes.rows,
    employees_by_type: typeRes.rows,
  };
};

/**
 * 4. GET /api/v1/reports/attendance-summary
 * Attendance overview with optional filters and daily grouped breakdown
 */
export const getAttendanceSummary = async ({
  date,
  from_date,
  to_date,
  employee_id,
}) => {
  let whereClause = "WHERE 1=1";
  const params = [];

  if (employee_id) {
    const eId = parseId(employee_id);
    if (!eId) {
      const err = new Error("Invalid employee_id");
      err.statusCode = 400;
      throw err;
    }
    params.push(eId);
    whereClause += ` AND employee_id = $${params.length}`;
  }

  if (date) {
    params.push(date);
    whereClause += ` AND attendance_date = $${params.length}`;
  }

  if (from_date) {
    params.push(from_date);
    whereClause += ` AND attendance_date >= $${params.length}`;
  }

  if (to_date) {
    params.push(to_date);
    whereClause += ` AND attendance_date <= $${params.length}`;
  }

  // Aggregate metrics
  const aggQuery = `
    SELECT
      COUNT(*)::int AS total_attendance_records,
      COUNT(CASE WHEN status = 'present' THEN 1 END)::int AS present_count,
      COUNT(CASE WHEN status = 'absent' THEN 1 END)::int AS absent_count,
      COUNT(CASE WHEN status = 'late' THEN 1 END)::int AS late_count,
      COUNT(CASE WHEN check_in IS NOT NULL THEN 1 END)::int AS checked_in_count,
      COUNT(CASE WHEN check_out IS NOT NULL THEN 1 END)::int AS checked_out_count,
      COALESCE(SUM(worked_hours), 0)::numeric(10,2) AS total_worked_hours
    FROM attendance
    ${whereClause}
  `;
  const aggRes = await pool.query(aggQuery, params);
  const summary = aggRes.rows[0] || {};

  // Daily breakdown when date range or date filter is present
  let dailySummary = [];
  if (from_date || to_date || date) {
    const dailyQuery = `
      SELECT
        attendance_date AS date,
        COUNT(CASE WHEN status = 'present' OR status = 'late' THEN 1 END)::int AS present,
        COUNT(CASE WHEN status = 'absent' THEN 1 END)::int AS absent,
        COALESCE(SUM(worked_hours), 0)::numeric(10,2) AS total_worked_hours
      FROM attendance
      ${whereClause}
      GROUP BY attendance_date
      ORDER BY attendance_date ASC
    `;
    const dailyRes = await pool.query(dailyQuery, params);
    dailySummary = dailyRes.rows.map((r) => ({
      date: r.date,
      present: r.present,
      absent: r.absent,
      total_worked_hours: Number(r.total_worked_hours),
    }));
  }

  return {
    total_attendance_records: summary.total_attendance_records || 0,
    present_count: summary.present_count || 0,
    absent_count: summary.absent_count || 0,
    late_count: summary.late_count || 0,
    checked_in_count: summary.checked_in_count || 0,
    checked_out_count: summary.checked_out_count || 0,
    total_worked_hours: Number(summary.total_worked_hours) || 0,
    ...(dailySummary.length > 0 ? { daily_summary: dailySummary } : {}),
  };
};

/**
 * 5. GET /api/v1/reports/time-off-summary
 * Leave / Time off metrics breakdown by status and time off type
 */
export const getTimeOffSummary = async ({
  from_date,
  to_date,
  employee_id,
  time_off_type_id,
}) => {
  let whereClause = "WHERE 1=1";
  const params = [];

  if (employee_id) {
    const eId = parseId(employee_id);
    if (!eId) {
      const err = new Error("Invalid employee_id");
      err.statusCode = 400;
      throw err;
    }
    params.push(eId);
    whereClause += ` AND r.employee_id = $${params.length}`;
  }

  if (time_off_type_id) {
    const tId = parseId(time_off_type_id);
    if (!tId) {
      const err = new Error("Invalid time_off_type_id");
      err.statusCode = 400;
      throw err;
    }
    params.push(tId);
    whereClause += ` AND r.type_id = $${params.length}`;
  }

  if (from_date) {
    params.push(from_date);
    whereClause += ` AND r.start_date >= $${params.length}`;
  }

  if (to_date) {
    params.push(to_date);
    whereClause += ` AND r.end_date <= $${params.length}`;
  }

  // Aggregate request counts & approved days
  const aggQuery = `
    SELECT
      COUNT(*)::int AS total_requests,
      COUNT(CASE WHEN r.status = 'pending' THEN 1 END)::int AS pending_requests,
      COUNT(CASE WHEN r.status = 'approved' THEN 1 END)::int AS approved_requests,
      COUNT(CASE WHEN r.status = 'refused' THEN 1 END)::int AS rejected_requests,
      COUNT(CASE WHEN r.status = 'cancelled' THEN 1 END)::int AS cancelled_requests,
      COALESCE(SUM(CASE WHEN r.status = 'approved' THEN r.duration ELSE 0 END), 0)::numeric(10,2) AS total_approved_days
    FROM time_off_requests r
    ${whereClause}
  `;
  const aggRes = await pool.query(aggQuery, params);
  const totals = aggRes.rows[0] || {};

  // Summary by leave type
  const typeQuery = `
    SELECT
      t.name AS type,
      COUNT(r.id)::int AS requests,
      COALESCE(SUM(CASE WHEN r.status = 'approved' THEN r.duration ELSE 0 END), 0)::numeric(10,2) AS approved_days
    FROM time_off_types t
    LEFT JOIN time_off_requests r ON t.id = r.type_id
    ${whereClause}
    GROUP BY t.id, t.name
    ORDER BY t.name ASC
  `;
  const typeRes = await pool.query(typeQuery, params);

  return {
    total_requests: totals.total_requests || 0,
    pending_requests: totals.pending_requests || 0,
    approved_requests: totals.approved_requests || 0,
    rejected_requests: totals.rejected_requests || 0,
    cancelled_requests: totals.cancelled_requests || 0,
    total_approved_days: Number(totals.total_approved_days) || 0,
    by_type: typeRes.rows.map((row) => ({
      type: row.type,
      requests: row.requests,
      approved_days: Number(row.approved_days),
    })),
  };
};

/**
 * 6. GET /api/v1/reports/department-cost
 * Payroll costs grouped by department
 */
export const getDepartmentCost = async ({ period_start, period_end } = {}) => {
  let whereConditions = [];
  let params = [];

  if (period_start) {
    params.push(period_start);
    whereConditions.push(`pr.period_end >= $${params.length}`);
  }

  if (period_end) {
    params.push(period_end);
    whereConditions.push(`pr.period_start <= $${params.length}`);
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";

  const query = `
    SELECT
      COALESCE(NULLIF(TRIM(e.department), ''), 'General') AS department_name,
      COUNT(DISTINCT e.id)::int AS headcount,
      COALESCE(SUM(ps.gross_salary), 0)::numeric(12,2) AS total_gross_cost,
      COALESCE(SUM(ps.net_salary), 0)::numeric(12,2) AS total_net_cost
    FROM employees e
    JOIN payslips ps ON e.id = ps.employee_id
    JOIN payruns pr ON ps.payrun_id = pr.id
    ${whereClause}
    GROUP BY COALESCE(NULLIF(TRIM(e.department), ''), 'General')
    ORDER BY total_gross_cost DESC, department_name ASC
  `;

  const res = await pool.query(query, params);

  return res.rows.map((row) => ({
    department_name: row.department_name,
    name: row.department_name,
    headcount: parseInt(row.headcount, 10) || 0,
    total_gross_cost: parseFloat(row.total_gross_cost) || 0,
    gross_wages: parseFloat(row.total_gross_cost) || 0,
    total_net_cost: parseFloat(row.total_net_cost) || 0,
    net_wages: parseFloat(row.total_net_cost) || 0,
  }));
};

/**
 * 7. GET /api/v1/reports/employee-history/:employeeId
 * Employee wage and slip historical progression
 */
export const getEmployeePayrollHistory = async (employeeId) => {
  const eId = parseId(employeeId);
  if (!eId) {
    const err = new Error("Invalid employee ID");
    err.statusCode = 400;
    throw err;
  }

  const query = `
    SELECT
      ps.id AS payslip_id,
      pr.id AS payrun_id,
      pr.name AS payrun_name,
      pr.period_start,
      pr.period_end,
      ps.basic_salary,
      ps.gross_salary,
      ps.total_deductions,
      ps.net_salary,
      ps.status,
      ps.created_at
    FROM payslips ps
    JOIN payruns pr ON ps.payrun_id = pr.id
    WHERE ps.employee_id = $1
    ORDER BY pr.period_start DESC
  `;

  const res = await pool.query(query, [eId]);
  return res.rows;
};

export default {
  getDashboard,
  getPayrollSummary,
  getEmployeeSummary,
  getAttendanceSummary,
  getTimeOffSummary,
  getDepartmentCost,
  getEmployeePayrollHistory,
};
