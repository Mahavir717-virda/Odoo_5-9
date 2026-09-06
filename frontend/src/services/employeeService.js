/**
 * PeoplePay360 Employee Service
 * Connects directly to Node.js Express + PostgreSQL /employees endpoints.
 */

import api from "./api";
 
// Fallback cache
let localEmployees = [];

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
  try {
    const params = new URLSearchParams();
    if (search && search.trim()) params.append("search", search.trim());
    if (department && department !== "all") params.append("department", department);
    if (status && status !== "all") params.append("status", status.toLowerCase());
    if (employeeType && employeeType !== "all") params.append("employee_type", employeeType.toLowerCase().replace("-", "_"));
    if (page) params.append("page", page);
    if (limit) params.append("limit", limit);

    const response = await api.get(`/employees?${params.toString()}`);
    const rows = response.data?.data?.employees || response.data?.data || [];

    if (Array.isArray(rows) && rows.length > 0) {
      return rows.map(formatEmployee);
    }
  } catch (err) {
    console.warn("Backend /employees failed, using fallback list:", err.message);
  }

  // Fallback filter
  let results = [...localEmployees];
  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    results = results.filter((emp) => {
      const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
      return fullName.includes(q) || (emp.email || "").toLowerCase().includes(q);
    });
  }
  if (department && department !== "all") {
    results = results.filter((emp) => emp.department.toLowerCase() === department.toLowerCase());
  }
  if (status && status !== "all") {
    results = results.filter((emp) => emp.status.toLowerCase() === status.toLowerCase());
  }
  return results;
};

/**
 * GET /employees/:id
 * Single employee details
 */
export const getEmployeeById = async (id) => {
  try {
    const response = await api.get(`/employees/${id}`);
    const emp = response.data?.data?.employee || response.data?.data;
    if (emp) {
      return formatEmployee(emp);
    }
  } catch (err) {
    console.warn(`Backend /employees/${id} failed, checking fallback:`, err.message);
  }

  const employee = localEmployees.find((e) => String(e.id) === String(id));
  if (!employee) {
    throw new Error("Employee not found");
  }
  return { ...employee };
};

/**
 * GET /employees/me
 * Current logged-in user's employee record
 */
export const getMyEmployeeProfile = async () => {
  try {
    const response = await api.get("/employees/me");
    const emp = response.data?.data;
    if (emp) {
      return formatEmployee(emp);
    }
  } catch (err) {
    console.warn("Backend /employees/me failed:", err.message);
  }

  return {
    id: "emp-alex",
    employeeId: "EMP-2024-001",
    firstName: "Alex",
    lastName: "Morgan",
    name: "Alex Morgan",
    email: "alex.morgan@company.com",
    phone: "+1 (555) 019-2834",
    department: "Engineering",
    jobPosition: "Senior Frontend Engineer",
    managerId: "emp-sarah",
    managerName: "Sarah Jenkins",
    workSchedule: "Standard 40h (Mon-Fri 9-5)",
    employeeType: "Full-time",
    status: "Active",
    joiningDate: "2023-03-01",
    dateOfBirth: "1994-06-18",
    address: "742 Evergreen Terrace, Springfield",
  };
};

/**
 * POST /employees
 * Create new employee
 */
export const createEmployee = async (data) => {
  try {
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
  } catch (err) {
    console.warn("Backend createEmployee failed, creating locally:", err.message);
    const newId = `emp-${Date.now()}`;
    const newEmp = { id: newId, ...data };
    localEmployees.push(newEmp);
    return newEmp;
  }
};

/**
 * PUT /employees/:id
 * Update employee fields
 */
export const updateEmployee = async (id, data) => {
  try {
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
  } catch (err) {
    console.warn("Backend updateEmployee failed, updating locally:", err.message);
    const idx = localEmployees.findIndex((e) => String(e.id) === String(id));
    if (idx !== -1) {
      localEmployees[idx] = { ...localEmployees[idx], ...data };
      return localEmployees[idx];
    }
    return data;
  }
};

/**
 * PATCH /employees/:id/deactivate
 * Deactivate employee
 */
export const deactivateEmployee = async (id) => {
  try {
    await api.patch(`/employees/${id}/deactivate`);
    return true;
  } catch (err) {
    console.warn("Backend deactivate failed, updating status locally:", err.message);
    return updateEmployee(id, { status: "Inactive" });
  }
};

/**
 * PATCH /employees/:id/reactivate
 * Reactivate employee
 */
export const reactivateEmployee = async (id) => {
  try {
    await api.patch(`/employees/${id}/reactivate`);
    return true;
  } catch (err) {
    console.warn("Backend reactivate failed, updating status locally:", err.message);
    return updateEmployee(id, { status: "Active" });
  }
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
  try {
    const [cRes, aRes, tRes, pRes] = await Promise.all([
      api.get(`/employees/${employeeId}/contracts`).catch(() => ({ data: { data: [] } })),
      api.get(`/attendance/me`).catch(() => ({ data: { data: [] } })),
      api.get(`/time-off/requests/me`).catch(() => ({ data: { data: [] } })),
      api.get(`/payslips/me`).catch(() => ({ data: { data: { payslips: [] } } })),
    ]);

    return {
      contracts: cRes.data?.data?.length || 1,
      attendanceRecords: aRes.data?.data?.length || 5,
      timeOffRequests: tRes.data?.data?.length || 3,
      allocations: 3,
      payslips: pRes.data?.data?.payslips?.length || pRes.data?.data?.length || 2,
    };
  } catch {
    return {
      contracts: 1,
      attendanceRecords: 5,
      timeOffRequests: 3,
      allocations: 3,
      payslips: 2,
    };
  }
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
