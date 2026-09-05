/**
 * MOCK SERVICE — replace each function body with a real axios call to the backend when available.
 * Function signatures and return shapes are designed to stay the same.
 */

import { mockEmployees } from "../data/mockEmployees";

const SIMULATED_DELAY_MS = 300;

const delay = (ms = SIMULATED_DELAY_MS) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// In-memory mutable array (resets on page refresh)
let employees = [...mockEmployees];

/**
 * Get filtered employees list.
 * @param {Object} [filters]
 * @param {string} [filters.search] - Case-insensitive match on firstName, lastName, or email.
 * @param {string} [filters.department] - Exact match department.
 * @param {string} [filters.status] - Exact match status.
 * @param {string} [filters.employeeType] - Exact match employeeType.
 * @param {string} [filters.managerId] - Exact match managerId.
 * @returns {Promise<Array<Object>>}
 */
export const getEmployees = async ({
  search,
  department,
  status,
  employeeType,
  managerId,
} = {}) => {
  await delay();

  let results = [...employees];

  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    results = results.filter((emp) => {
      const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
      const email = (emp.email || "").toLowerCase();
      const employeeId = (emp.employeeId || "").toLowerCase();
      return (
        fullName.includes(q) ||
        email.includes(q) ||
        employeeId.includes(q)
      );
    });
  }

  if (department && department !== "all") {
    results = results.filter(
      (emp) => emp.department.toLowerCase() === department.toLowerCase()
    );
  }

  if (status && status !== "all") {
    results = results.filter(
      (emp) => emp.status.toLowerCase() === status.toLowerCase()
    );
  }

  if (employeeType && employeeType !== "all") {
    results = results.filter(
      (emp) => emp.employeeType.toLowerCase() === employeeType.toLowerCase()
    );
  }

  if (managerId && managerId !== "all") {
    results = results.filter((emp) => emp.managerId === managerId);
  }

  return results;
};

/**
 * Get single employee by ID.
 * @param {string} id 
 * @returns {Promise<Object>}
 */
export const getEmployeeById = async (id) => {
  await delay();

  const employee = employees.find((emp) => emp.id === id);
  if (!employee) {
    throw new Error("Employee not found");
  }

  return { ...employee };
};

/**
 * Create a new employee record.
 * @param {Object} data 
 * @returns {Promise<Object>}
 */
export const createEmployee = async (data) => {
  await delay();

  const newId = `emp-${Date.now()}`;
  const count = employees.length + 1;
  const padIndex = String(count).padStart(3, "0");
  const employeeId = data.employeeId || `EMP-2024-${padIndex}`;

  const newEmployee = {
    id: newId,
    employeeId,
    avatarUrl: null,
    workSchedule: data.workSchedule || "40 Hours / Week",
    employeeType: data.employeeType || "Full-time",
    status: data.status || "Active",
    joiningDate: data.joiningDate || new Date().toISOString().split("T")[0],
    dateOfBirth: data.dateOfBirth || "1995-01-01",
    address: data.address || "",
    ...data,
  };

  employees.push(newEmployee);
  return { ...newEmployee };
};

/**
 * Update an existing employee record.
 * @param {string} id 
 * @param {Object} data 
 * @returns {Promise<Object>}
 */
export const updateEmployee = async (id, data) => {
  await delay();

  const index = employees.findIndex((emp) => emp.id === id);
  if (index === -1) {
    throw new Error("Employee not found");
  }

  const updated = {
    ...employees[index],
    ...data,
    id, // protect ID from mutation
  };

  employees[index] = updated;
  return { ...updated };
};

/**
 * Delete an employee record.
 * @param {string} id 
 * @returns {Promise<boolean>}
 */
export const deleteEmployee = async (id) => {
  await delay();

  const index = employees.findIndex((emp) => emp.id === id);
  if (index === -1) {
    throw new Error("Employee not found");
  }

  employees.splice(index, 1);
  return true;
};

/**
 * Archive an employee record (marks status as Inactive).
 * @param {string} id 
 * @returns {Promise<boolean>}
 */
export const archiveEmployee = async (id) => {
  await delay();

  const employee = employees.find((emp) => emp.id === id);
  if (!employee) {
    throw new Error("Employee not found");
  }

  employee.status = "Inactive";
  return true;
};

/**
 * MOCK — replace with real counts once Contracts/Attendance/TimeOff/Payroll services exist in later phases.
 * Returns deterministic-but-varied counts based on the employeeId character codes.
 *
 * @param {string} employeeId 
 * @returns {Promise<{ contracts: number, attendanceRecords: number, timeOffRequests: number, allocations: number, payslips: number }>}
 */
export const getEmployeeRelationCounts = async (employeeId) => {
  await delay(200);

  const seed = String(employeeId || "")
    .split("")
    .reduce((acc, char, index) => acc + char.charCodeAt(0) * (index + 1), 0);

  return {
    contracts: 1 + (seed % 3), // 1 - 3
    attendanceRecords: 100 + (seed % 161), // 100 - 260
    timeOffRequests: 2 + (seed % 14), // 2 - 15
    allocations: 2 + (seed % 3), // 2 - 4
    payslips: seed % 9, // 0 - 8
  };
};
