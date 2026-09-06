/**
 * PeoplePay360 Employee Service
 * Connects directly to Node.js Express + PostgreSQL /employees endpoints.
 */

import api from "./api";

/**
 * Normalizes backend employee record to frontend model
 */
export const formatEmployee = (emp) => {
  if (!emp) return null;
  const nameParts = (emp.name || "").trim().split(" ");
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || "";

  return {
    id: String(emp.id),
    employeeId: `EMP-${String(emp.id).padStart(4, "0")}`,
    firstName: emp.firstName || firstName,
    lastName: emp.lastName || lastName,
    name: emp.name || `${firstName} ${lastName}`.trim(),
    email: emp.email,
    phone: emp.phone || "",
    department: emp.department || "General",
    jobPosition: emp.job_position || emp.jobPosition || "Staff",
    managerId: emp.manager_id ? String(emp.manager_id) : (emp.managerId || null),
    managerName: emp.manager?.name || emp.manager_name || emp.managerName || "None",
    workSchedule: emp.schedule?.name || emp.schedule_name || emp.workSchedule || "Standard 40h",
    scheduleId: emp.schedule_id || emp.scheduleId || 1,
    employeeType:
      emp.employee_type === "full_time"
        ? "Full-time"
        : emp.employee_type === "part_time"
        ? "Part-time"
        : emp.employee_type === "contract"
        ? "Contract"
        : emp.employee_type === "intern"
        ? "Intern"
        : (emp.employeeType || "Full-time"),
    status: emp.status ? emp.status.charAt(0).toUpperCase() + emp.status.slice(1).toLowerCase() : "Active",
    joiningDate: emp.joining_date ? emp.joining_date.split("T")[0] : (emp.joiningDate || "2023-01-01"),
    dateOfBirth: emp.date_of_birth || emp.dateOfBirth || "1995-01-01",
    address: emp.address || "123 Business Way, Suite 400",
    avatarUrl: emp.avatar || null,
  };
};

/**
 * GET /employees
 * List all employees with filters & pagination
 */
export const getEmployees = async ({
  search,
  department,
  status,
  employeeType,
  managerId,
  page = 1,
  limit = 20,
} = {}) => {
  const params = new URLSearchParams();
  if (search && search.trim()) params.append("search", search.trim());
  if (department && department !== "all") params.append("department", department);
  if (status && status !== "all") params.append("status", status.toLowerCase());
  if (employeeType && employeeType !== "all") params.append("employee_type", employeeType.toLowerCase().replace("-", "_"));
  if (page) params.append("page", page);
  if (limit) params.append("limit", limit);

  const response = await api.get(`/employees?${params.toString()}`);
  const rows = response.data?.data?.employees || response.data?.data || [];

  if (Array.isArray(rows)) {
    return rows.map(formatEmployee);
  }
  return [];
};

/**
 * GET /employees/:id
 * Single employee details
 */
export const getEmployeeById = async (id) => {
  const response = await api.get(`/employees/${id}`);
  const emp = response.data?.data?.employee || response.data?.data;
  if (!emp) {
    throw new Error("Employee not found");
  }
  return formatEmployee(emp);
};

/**
 * GET /employees/me
 * Current logged-in user's employee record
 */
export const getMyEmployeeProfile = async () => {
  const response = await api.get("/employees/me");
  const emp = response.data?.data?.employee || response.data?.data;
  return formatEmployee(emp);
};

/**
 * POST /employees
 * Create new employee
 */
export const createEmployee = async (data) => {
  const payload = {
    name: data.name || `${data.firstName || ""} ${data.lastName || ""}`.trim(),
    email: data.email,
    phone: data.phone || null,
    department: data.department,
    manager_id: data.managerId ? parseInt(data.managerId, 10) : null,
    job_position: data.jobPosition || data.job_position,
    employee_type: (data.employeeType || "full_time").toLowerCase().replace("-", "_"),
    schedule_id: data.scheduleId ? parseInt(data.scheduleId, 10) : 1,
    joining_date: data.joiningDate || new Date().toISOString().split("T")[0],
    status: (data.status || "active").toLowerCase(),
  };

  const response = await api.post("/employees", payload);
  const created = response.data?.data?.employee || response.data?.data;
  return formatEmployee(created);
};

/**
 * PUT /employees/:id
 * Update employee fields
 */
export const updateEmployee = async (id, data) => {
  const payload = {
    name: data.name || (data.firstName && data.lastName ? `${data.firstName} ${data.lastName}`.trim() : undefined),
    email: data.email,
    phone: data.phone,
    department: data.department,
    manager_id: data.managerId ? parseInt(data.managerId, 10) : undefined,
    job_position: data.jobPosition || data.job_position,
    employee_type: data.employeeType ? data.employeeType.toLowerCase().replace("-", "_") : undefined,
    status: data.status ? data.status.toLowerCase() : undefined,
  };

  const response = await api.put(`/employees/${id}`, payload);
  const updated = response.data?.data?.employee || response.data?.data;
  return formatEmployee(updated);
};

/**
 * PATCH /employees/:id/deactivate
 * Deactivate employee
 */
export const deactivateEmployee = async (id) => {
  await api.patch(`/employees/${id}/deactivate`);
  return true;
};

/**
 * PATCH /employees/:id/reactivate
 * Reactivate employee
 */
export const reactivateEmployee = async (id) => {
  await api.patch(`/employees/${id}/reactivate`);
  return true;
};

/**
 * Delete employee
 */
export const deleteEmployee = async (id) => {
  return deactivateEmployee(id);
};

/**
 * Archive employee
 */
export const archiveEmployee = async (id) => {
  return deactivateEmployee(id);
};

/**
 * Get employee relation counts for detail page smart buttons
 */
export const getEmployeeRelationCounts = async (employeeId) => {
  const [cRes, aRes, tRes, pRes] = await Promise.all([
    api.get(`/contracts/employee/${employeeId}`).catch(() => ({ data: { data: { contracts: [] } } })),
    api.get(`/attendance/me`).catch(() => ({ data: { data: [] } })),
    api.get(`/time-off/requests/me`).catch(() => ({ data: { data: [] } })),
    api.get(`/payslips/me`).catch(() => ({ data: { data: { payslips: [] } } })),
  ]);

  const contractCount = cRes.data?.data?.contracts?.length || (Array.isArray(cRes.data?.data) ? cRes.data.data.length : 0);
  const attendanceCount = Array.isArray(aRes.data?.data) ? aRes.data.data.length : 0;
  const timeOffCount = Array.isArray(tRes.data?.data) ? tRes.data.data.length : 0;
  const payslipCount = pRes.data?.data?.payslips?.length || (Array.isArray(pRes.data?.data) ? pRes.data.data.length : 0);

  return {
    contracts: contractCount,
    attendanceRecords: attendanceCount,
    timeOffRequests: timeOffCount,
    allocations: 0,
    payslips: payslipCount,
  };
};

export default {
  getEmployees,
  getEmployeeById,
  getMyEmployeeProfile,
  createEmployee,
  updateEmployee,
  deactivateEmployee,
  reactivateEmployee,
  deleteEmployee,
  archiveEmployee,
  getEmployeeRelationCounts,
};
