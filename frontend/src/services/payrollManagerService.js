/**
 * Payroll Manager Service
 * Interacts with backend PostgreSQL /payruns, /payslips, /salary-structures, /salary-rules, and /reports.
 */

import api from "./api";

// ==========================================
// 1. SALARY RULES
// ==========================================

export const listSalaryRules = async ({ category, type, search } = {}) => {
  const params = new URLSearchParams();
  if (category && category !== "all") params.append("category", category);
  if (type && type !== "all") params.append("type", type);
  if (search) params.append("search", search.trim());

  const response = await api.get(`/salary-rules?${params.toString()}`);
  return response.data?.data || [];
};

export const getSalaryRuleById = async (id) => {
  const response = await api.get(`/salary-rules/${id}`);
  return response.data?.data;
};

export const createSalaryRule = async (payload) => {
  const response = await api.post("/salary-rules", payload);
  return response.data?.data;
};

export const updateSalaryRule = async (id, payload) => {
  const response = await api.put(`/salary-rules/${id}`, payload);
  return response.data?.data;
};

export const deleteSalaryRule = async (id) => {
  const response = await api.delete(`/salary-rules/${id}`);
  return response.data?.success;
};

// ==========================================
// 2. SALARY STRUCTURES
// ==========================================

export const listSalaryStructures = async () => {
  const response = await api.get("/salary-structures");
  return response.data?.data || [];
};

export const getSalaryStructureById = async (id) => {
  const response = await api.get(`/salary-structures/${id}`);
  return response.data?.data;
};

export const createSalaryStructure = async (payload) => {
  const response = await api.post("/salary-structures", payload);
  return response.data?.data;
};

export const updateSalaryStructure = async (id, payload) => {
  const response = await api.put(`/salary-structures/${id}`, payload);
  return response.data?.data;
};

export const deleteSalaryStructure = async (id) => {
  const response = await api.delete(`/salary-structures/${id}`);
  return response.data?.success;
};

// ==========================================
// 3. PAYRUNS
// ==========================================

export const listPayruns = async ({ status, page = 1, limit = 50 } = {}) => {
  const params = new URLSearchParams();
  if (status && status !== "all") params.append("status", status.toLowerCase());
  if (page) params.append("page", page);
  if (limit) params.append("limit", limit);

  const response = await api.get(`/payruns?${params.toString()}`);
  return response.data;
};

export const getPayrunById = async (id) => {
  const response = await api.get(`/payruns/${id}`);
  return response.data?.data;
};

export const createPayrun = async ({ name, period_start, period_end, structure_id }) => {
  const response = await api.post("/payruns", {
    name,
    period_start,
    period_end,
    structure_id: parseInt(structure_id, 10),
  });
  return response.data?.data;
};

export const updatePayrun = async (id, payload) => {
  const response = await api.put(`/payruns/${id}`, payload);
  return response.data?.data;
};

export const computePayrun = async (id, employeeIds = null) => {
  const payload = Array.isArray(employeeIds) && employeeIds.length > 0 ? { employee_ids: employeeIds } : {};
  const response = await api.post(`/payruns/${id}/compute`, payload);
  return response.data;
};

export const validatePayrun = async (id) => {
  const response = await api.patch(`/payruns/${id}/validate`);
  return response.data?.data;
};

export const resetPayrunToDraft = async (id) => {
  const response = await api.post(`/payruns/${id}/reset-to-draft`);
  return response.data?.data || response.data;
};

export const markPayrunPaid = async (id) => {
  const response = await api.patch(`/payruns/${id}/pay`);
  return response.data?.data;
};

export const deletePayrun = async (id) => {
  const response = await api.delete(`/payruns/${id}`);
  return response.data?.success;
};

// ==========================================
// 4. PAYSLIPS (Manager View)
// ==========================================

export const listPayslips = async ({ payrun_id, employee_id, status, page = 1, limit = 50 } = {}) => {
  const params = new URLSearchParams();
  if (payrun_id) params.append("payrun_id", payrun_id);
  if (employee_id) params.append("employee_id", employee_id);
  if (status && status !== "all") params.append("status", status.toLowerCase());
  if (page) params.append("page", page);
  if (limit) params.append("limit", limit);

  const response = await api.get(`/payslips?${params.toString()}`);
  return response.data;
};

export const getPayslipById = async (id) => {
  const response = await api.get(`/payslips/${id}`);
  return response.data?.data;
};

export const recalculatePayslip = async (id) => {
  const response = await api.post(`/payslips/${id}/recalculate`);
  return response.data?.data;
};

// ==========================================
// 5. REPORTS
// ==========================================

export const getPayrollSummaryReport = async ({ period_start, period_end } = {}) => {
  const params = new URLSearchParams();
  if (period_start) params.append("period_start", period_start);
  if (period_end) params.append("period_end", period_end);

  const response = await api.get(`/reports/payroll-summary?${params.toString()}`);
  return response.data?.data;
};

export const getDepartmentCostReport = async ({ period_start, period_end } = {}) => {
  const params = new URLSearchParams();
  if (period_start) params.append("period_start", period_start);
  if (period_end) params.append("period_end", period_end);

  const response = await api.get(`/reports/department-cost?${params.toString()}`);
  return response.data?.data;
};

export const getEmployeePayrollHistory = async (employeeId) => {
  const response = await api.get(`/reports/employee-history/${employeeId}`);
  return response.data?.data;
};

export default {
  listSalaryRules,
  getSalaryRuleById,
  createSalaryRule,
  updateSalaryRule,
  deleteSalaryRule,
  listSalaryStructures,
  getSalaryStructureById,
  createSalaryStructure,
  updateSalaryStructure,
  deleteSalaryStructure,
  listPayruns,
  getPayrunById,
  createPayrun,
  updatePayrun,
  computePayrun,
  validatePayrun,
  markPayrunPaid,
  deletePayrun,
  listPayslips,
  getPayslipById,
  recalculatePayslip,
  getPayrollSummaryReport,
  getDepartmentCostReport,
  getEmployeePayrollHistory,
};
