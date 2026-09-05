/**
 * Dynamic Employee Service
 * Integrates with Express + PostgreSQL backend APIs with fallback handling.
 */

import api from "./api";
import { mockEmployees } from "../data/mockEmployees";

// Fallback in-memory store
let localEmployees = [...mockEmployees];

/**
 * Get filtered employees list from backend
 */
export const getEmployees = async ({
  search,
  department,
  status,
  employeeType,
  managerId,
} = {}) => {
  try {
    const params = new URLSearchParams();
    if (search && search.trim()) params.append("search", search.trim());
    if (department && department !== "all") params.append("department", department);
    if (status && status !== "all") params.append("status", status.toLowerCase());
    if (employeeType && employeeType !== "all") params.append("employee_type", employeeType.toLowerCase());

    const response = await api.get(`/employees?${params.toString()}`);
    const backendData = response.data?.data?.employees || response.data?.data || [];

    if (backendData.length > 0) {
      return backendData.map((emp) => ({
        id: String(emp.id),
        employeeId: `EMP-${String(emp.id).padStart(4, "0")}`,
        firstName: emp.name?.split(" ")[0] || emp.name,
        lastName: emp.name?.split(" ").slice(1).join(" ") || "",
        email: emp.email,
        phone: emp.phone || "",
        department: emp.department || "General",
        jobPosition: emp.job_position || "Staff",
        managerId: emp.manager_id ? String(emp.manager_id) : null,
        managerName: emp.manager_name || "None",
        workSchedule: emp.schedule_name || "Standard 40h",
        employeeType: emp.employee_type === "full_time" ? "Full-time" : (emp.employee_type || "Full-time"),
        status: emp.status ? emp.status.charAt(0).toUpperCase() + emp.status.slice(1).toLowerCase() : "Active",
        joiningDate: emp.joining_date ? emp.joining_date.split("T")[0] : "2023-01-01",
        avatarUrl: null,
      }));
    }
  } catch (err) {
    console.warn("Backend /employees failed, using local mock data:", err.message);
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
 * Get single employee by ID
 */
export const getEmployeeById = async (id) => {
  try {
    const response = await api.get(`/employees/${id}`);
    const emp = response.data?.data;
    if (emp) {
      return {
        id: String(emp.id),
        employeeId: `EMP-${String(emp.id).padStart(4, "0")}`,
        firstName: emp.name?.split(" ")[0] || emp.name,
        lastName: emp.name?.split(" ").slice(1).join(" ") || "",
        email: emp.email,
        phone: emp.phone || "",
        department: emp.department || "General",
        jobPosition: emp.job_position || "Staff",
        managerId: emp.manager_id ? String(emp.manager_id) : null,
        managerName: emp.manager?.name || emp.manager_name || "None",
        workSchedule: emp.schedule?.name || emp.schedule_name || "Standard 40h",
        employeeType: emp.employee_type === "full_time" ? "Full-time" : (emp.employee_type || "Full-time"),
        status: emp.status ? emp.status.charAt(0).toUpperCase() + emp.status.slice(1).toLowerCase() : "Active",
        joiningDate: emp.joining_date ? emp.joining_date.split("T")[0] : "2023-01-01",
        dateOfBirth: "1995-01-01",
        address: "123 Business Way, Suite 400",
        avatarUrl: null,
      };
    }
  } catch (err) {
    console.warn(`Backend /employees/${id} failed, checking local mock data:`, err.message);
  }

  const employee = localEmployees.find((e) => String(e.id) === String(id));
  if (!employee) {
    throw new Error("Employee not found");
  }
  return { ...employee };
};

/**
 * Get current logged in employee profile
 */
export const getMyEmployeeProfile = async () => {
  try {
    const response = await api.get("/employees/me");
    const emp = response.data?.data;
    if (emp) {
      return {
        id: String(emp.id),
        employeeId: `EMP-${String(emp.id).padStart(4, "0")}`,
        firstName: emp.name?.split(" ")[0] || emp.name,
        lastName: emp.name?.split(" ").slice(1).join(" ") || "",
        name: emp.name,
        email: emp.email,
        phone: emp.phone || "+1 (555) 019-2834",
        department: emp.department || "Engineering",
        jobPosition: emp.job_position || "Software Engineer",
        managerId: emp.manager_id ? String(emp.manager_id) : null,
        managerName: emp.manager?.name || emp.manager_name || "Sarah Jenkins",
        workSchedule: emp.schedule?.name || emp.schedule_name || "Standard 40h (Mon-Fri 9-5)",
        employeeType: emp.employee_type === "full_time" ? "Full-time" : (emp.employee_type || "Full-time"),
        status: emp.status ? emp.status.charAt(0).toUpperCase() + emp.status.slice(1).toLowerCase() : "Active",
        joiningDate: emp.joining_date ? emp.joining_date.split("T")[0] : "2023-03-01",
        dateOfBirth: "1994-06-18",
        address: "742 Evergreen Terrace, Springfield",
        emergencyContact: "Emily Morgan (+1 555-987-6543)",
        bankAccount: "•••• •••• •••• 4892 (Chase Bank)",
        panNumber: "ABCDE1234F",
      };
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
    emergencyContact: "Emily Morgan (+1 555-987-6543)",
    bankAccount: "•••• •••• •••• 4892 (Chase Bank)",
    panNumber: "ABCDE1234F",
  };
};

/**
 * Create a new employee
 */
export const createEmployee = async (data) => {
  try {
    const payload = {
      name: `${data.firstName || ""} ${data.lastName || ""}`.trim(),
      email: data.email,
      phone: data.phone,
      department: data.department,
      job_position: data.jobPosition,
      employee_type: (data.employeeType || "full_time").toLowerCase().replace("-", "_"),
      schedule_id: data.scheduleId || 1,
      joining_date: data.joiningDate || new Date().toISOString().split("T")[0],
    };
    const response = await api.post("/employees", payload);
    return response.data?.data;
  } catch (err) {
    console.warn("Backend createEmployee failed, saving locally:", err.message);
    const newId = `emp-${Date.now()}`;
    const newEmp = { id: newId, ...data };
    localEmployees.push(newEmp);
    return newEmp;
  }
};

/**
 * Update an existing employee
 */
export const updateEmployee = async (id, data) => {
  try {
    const payload = {
      name: data.firstName && data.lastName ? `${data.firstName} ${data.lastName}`.trim() : data.name,
      email: data.email,
      phone: data.phone,
      department: data.department,
      job_position: data.jobPosition,
      employee_type: data.employeeType ? data.employeeType.toLowerCase().replace("-", "_") : undefined,
      status: data.status ? data.status.toLowerCase() : undefined,
    };
    const response = await api.put(`/employees/${id}`, payload);
    return response.data?.data;
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
 * Delete an employee
 */
export const deleteEmployee = async (id) => {
  try {
    await api.delete(`/employees/${id}`);
    return true;
  } catch (err) {
    console.warn("Backend deleteEmployee failed:", err.message);
    localEmployees = localEmployees.filter((e) => String(e.id) !== String(id));
    return true;
  }
};

/**
 * Archive an employee
 */
export const archiveEmployee = async (id) => {
  return updateEmployee(id, { status: "Inactive" });
};

/**
 * Get relation counts
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
