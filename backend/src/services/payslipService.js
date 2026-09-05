import pool from "../db.js";

/**
 * Get payslips for an employee with YTD metrics
 */
export const getEmployeePayslips = async (employeeId) => {
  const query = `
    SELECT 
      p.id,
      p.payrun_id,
      pr.name AS payrun_name,
      pr.period_start,
      pr.period_end,
      pr.paid_at,
      p.contract_id,
      p.worked_days,
      p.basic_salary,
      p.gross_salary,
      p.total_deductions,
      p.net_salary,
      p.lines,
      p.status,
      p.created_at
    FROM payslips p
    JOIN payruns pr ON p.payrun_id = pr.id
    WHERE p.employee_id = $1
    ORDER BY pr.period_start DESC
  `;

  const result = await pool.query(query, [employeeId]);

  let totalGrossYTD = 0;
  let totalDeductionsYTD = 0;
  let totalNetYTD = 0;

  const payslips = result.rows.map((row) => {
    const gross = parseFloat(row.gross_salary) || 0;
    const deductions = parseFloat(row.total_deductions) || 0;
    const net = parseFloat(row.net_salary) || 0;
    const basic = parseFloat(row.basic_salary) || 0;

    totalGrossYTD += gross;
    totalDeductionsYTD += deductions;
    totalNetYTD += net;

    // Parse lines or structure standard allowances / deductions
    let earnings = [];
    let deductionItems = [];

    if (Array.isArray(row.lines) && row.lines.length > 0) {
      row.lines.forEach((line) => {
        if (line.category === "basic" || line.category === "allowance" || line.category === "gross") {
          earnings.push({
            name: line.name || line.code,
            amount: parseFloat(line.amount) || 0,
            type: "Earning",
          });
        } else if (line.category === "deduction") {
          deductionItems.push({
            name: line.name || line.code,
            amount: parseFloat(line.amount) || 0,
            type: "Deduction",
          });
        }
      });
    }

    if (earnings.length === 0) {
      earnings = [
        { name: "Basic Salary", amount: basic, type: "Earning" },
        { name: "House Rent Allowance (HRA)", amount: gross > basic ? gross - basic : 0, type: "Earning" },
      ];
    }

    if (deductionItems.length === 0 && deductions > 0) {
      deductionItems = [
        { name: "Provident Fund (PF)", amount: deductions * 0.6, type: "Deduction" },
        { name: "Professional Tax", amount: deductions * 0.4, type: "Deduction" },
      ];
    }

    const periodMonth = row.period_start
      ? new Date(row.period_start).toLocaleString("en-US", { month: "long", year: "numeric" })
      : "Current Period";

    return {
      id: `ps-${row.id}`,
      payslipNumber: `PAY-${String(row.id).padStart(5, "0")}`,
      period: periodMonth,
      periodStart: row.period_start ? row.period_start.toISOString().split("T")[0] : null,
      periodEnd: row.period_end ? row.period_end.toISOString().split("T")[0] : null,
      payDate: row.paid_at ? row.paid_at.toISOString().split("T")[0] : (row.period_end ? row.period_end.toISOString().split("T")[0] : null),
      basicSalary: basic,
      grossEarnings: gross,
      totalDeductions: deductions,
      netPay: net,
      workedDays: parseFloat(row.worked_days) || 0,
      status: row.status ? row.status.charAt(0).toUpperCase() + row.status.slice(1).toLowerCase() : "Paid",
      earnings,
      deductions: deductionItems,
    };
  });

  return {
    summary: {
      grossYTD: totalGrossYTD,
      deductionsYTD: totalDeductionsYTD,
      netYTD: totalNetYTD,
      totalPayslips: payslips.length,
    },
    payslips,
  };
};

/**
 * Get single payslip by ID
 */
export const getPayslipById = async (employeeId, payslipId) => {
  // If id is prefixed with ps-, strip it
  const cleanId = String(payslipId).replace(/^ps-/, "");
  const idNum = parseInt(cleanId, 10);

  const query = `
    SELECT 
      p.id,
      p.payrun_id,
      pr.name AS payrun_name,
      pr.period_start,
      pr.period_end,
      pr.paid_at,
      p.contract_id,
      p.worked_days,
      p.basic_salary,
      p.gross_salary,
      p.total_deductions,
      p.net_salary,
      p.lines,
      p.status,
      e.name AS employee_name,
      e.email AS employee_email,
      e.job_position,
      e.department
    FROM payslips p
    JOIN payruns pr ON p.payrun_id = pr.id
    JOIN employees e ON p.employee_id = e.id
    WHERE p.id = $1 AND p.employee_id = $2
    LIMIT 1
  `;

  const result = await pool.query(query, [idNum, employeeId]);

  if (result.rows.length === 0) {
    const error = new Error("Payslip not found");
    error.status = 404;
    throw error;
  }

  const row = result.rows[0];
  const gross = parseFloat(row.gross_salary) || 0;
  const deductions = parseFloat(row.total_deductions) || 0;
  const net = parseFloat(row.net_salary) || 0;
  const basic = parseFloat(row.basic_salary) || 0;

  let earnings = [];
  let deductionItems = [];

  if (Array.isArray(row.lines) && row.lines.length > 0) {
    row.lines.forEach((line) => {
      if (line.category === "basic" || line.category === "allowance" || line.category === "gross") {
        earnings.push({
          name: line.name || line.code,
          amount: parseFloat(line.amount) || 0,
          type: "Earning",
        });
      } else if (line.category === "deduction") {
        deductionItems.push({
          name: line.name || line.code,
          amount: parseFloat(line.amount) || 0,
          type: "Deduction",
        });
      }
    });
  }

  if (earnings.length === 0) {
    earnings = [
      { name: "Basic Salary", amount: basic, type: "Earning" },
      { name: "House Rent Allowance (HRA)", amount: gross > basic ? gross - basic : 0, type: "Earning" },
    ];
  }

  if (deductionItems.length === 0 && deductions > 0) {
    deductionItems = [
      { name: "Provident Fund (PF)", amount: deductions * 0.6, type: "Deduction" },
      { name: "Professional Tax", amount: deductions * 0.4, type: "Deduction" },
    ];
  }

  const periodMonth = row.period_start
    ? new Date(row.period_start).toLocaleString("en-US", { month: "long", year: "numeric" })
    : "Current Period";

  return {
    id: `ps-${row.id}`,
    payslipNumber: `PAY-${String(row.id).padStart(5, "0")}`,
    period: periodMonth,
    periodStart: row.period_start ? row.period_start.toISOString().split("T")[0] : null,
    periodEnd: row.period_end ? row.period_end.toISOString().split("T")[0] : null,
    payDate: row.paid_at ? row.paid_at.toISOString().split("T")[0] : null,
    employeeName: row.employee_name,
    jobPosition: row.job_position,
    department: row.department,
    basicSalary: basic,
    grossEarnings: gross,
    totalDeductions: deductions,
    netPay: net,
    workedDays: parseFloat(row.worked_days) || 0,
    status: row.status ? row.status.charAt(0).toUpperCase() + row.status.slice(1).toLowerCase() : "Paid",
    earnings,
    deductions: deductionItems,
  };
};

export default {
  getEmployeePayslips,
  getPayslipById,
};
