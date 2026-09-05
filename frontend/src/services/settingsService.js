/**
 * Settings & Administration Service
 * Manages Users, Roles & Permissions, and Platform Configuration.
 */

import api from "./api";
import { ROLE_PERMISSIONS, PERMISSIONS } from "../utils/permissions";

const SYSTEM_SETTINGS_KEY = "peoplepay360_system_settings";
const CUSTOM_PERMISSIONS_KEY = "peoplepay360_custom_permissions";

const DEFAULT_SYSTEM_SETTINGS = {
  company: {
    name: "PeoplePay360 Technologies Pvt Ltd",
    legalName: "PeoplePay360 Inc.",
    taxId: "TAX-US-9281923",
    email: "support@peoplepay360.com",
    phone: "+1 (555) 019-2834",
    website: "https://peoplepay360.internal",
    address: "742 Evergreen Terrace, Springfield, OR 97477",
    currency: "USD",
    timezone: "America/New_York (UTC-5)",
    fiscalYearStart: "January",
  },
  payroll: {
    workHoursPerDay: 8,
    workDaysPerWeek: 5,
    cutoffDayOfMonth: 25,
    overtimeRateMultiplier: 1.5,
    autoCalculateTax: true,
    currencySymbol: "$",
    defaultSchedule: "Standard 40h (Mon-Fri)",
  },
  security: {
    sessionTimeoutHours: 24,
    minPasswordLength: 8,
    requireSpecialChars: true,
    mfaEnabled: false,
    maxLoginAttempts: 5,
  },
  notifications: {
    emailOnPayrunComputed: true,
    emailOnLeaveApproved: true,
    emailOnAttendanceAnomaly: true,
    slackIntegrationEnabled: false,
  },
};

// ==========================================
// 1. USER MANAGEMENT
// ==========================================

// Map DB role strings (lowercase) to canonical UPPERCASE constants used in frontend
const DB_ROLE_MAP = {
  admin: "ADMIN",
  hr_manager: "HR_MANAGER",
  hr_payroll_manager: "HR_PAYROLL_MANAGER",
  hr_payroll_user: "HR_PAYROLL_USER",
  employee: "EMPLOYEE",
};

export const listUsers = async ({ role, status, search } = {}) => {
  try {
    const params = new URLSearchParams();
    if (search) params.append("search", search.trim());
    // Pass lowercase role for DB matching
    if (role && role !== "all") params.append("role", role.toLowerCase());
    if (status && status !== "all") params.append("status", status.toLowerCase());

    const response = await api.get(`/auth/users?${params.toString()}`);
    const rows = response.data?.data?.users || [];

    return rows.map((u) => ({
      id: u.employee_id || u.user_id,
      userId: u.user_id,
      name: u.name || u.email.split("@")[0],
      email: u.email,
      phone: u.phone || "—",
      role: DB_ROLE_MAP[u.role?.toLowerCase()] || "EMPLOYEE",
      department: u.department || "General",
      jobPosition: u.job_position || "Staff",
      status: (u.status || "active").toLowerCase() === "active" ? "Active" : "Inactive",
      employeeCode: u.employee_id ? `EMP-${String(u.employee_id).padStart(4, "0")}` : `USR-${String(u.user_id).padStart(4, "0")}`,
      createdAt: u.joining_date || u.user_created_at || "2024-01-15",
      lastActive: "Recent",
    }));
  } catch (err) {
    console.error("Failed to fetch users from backend:", err);
    throw err;
  }
};

export const createUser = async ({ name, email, password, role, department, jobPosition, phone }) => {
  try {
    // 1. Register user through auth endpoint
    const regRes = await api.post("/auth/register", {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
    });

    const registeredUser = regRes.data?.data?.user;

    // 2. Adjust role & department on the newly created employee record
    if (registeredUser && registeredUser.id) {
      // Find employee record by email
      const empsRes = await api.get(`/employees?search=${encodeURIComponent(email)}`);
      const emps = empsRes.data?.data?.employees || empsRes.data?.data || [];
      const newEmp = emps.find((e) => e.email.toLowerCase() === email.toLowerCase());

      if (newEmp) {
        await api.put(`/employees/${newEmp.id}`, {
          name: name.trim(),
          department: department || "Engineering",
          job_position: jobPosition || (role === "ADMIN" ? "Administrator" : role === "HR_PAYROLL_MANAGER" ? "Payroll Manager" : "Staff"),
          phone: phone || null,
        });
      }
    }

    return {
      success: true,
      message: "User and employee account created successfully.",
    };
  } catch (err) {
    console.error("Failed to create user:", err);
    throw err;
  }
};

export const updateUser = async (id, payload) => {
  try {
    const res = await api.put(`/employees/${id}`, {
      name: payload.name,
      department: payload.department,
      job_position: payload.jobPosition,
      phone: payload.phone,
      status: payload.status?.toLowerCase(),
    });

    return res.data?.data;
  } catch (err) {
    console.error(`Failed to update user #${id}:`, err);
    throw err;
  }
};

export const toggleUserStatus = async (id, newStatus) => {
  try {
    if (newStatus === "Inactive") {
      await api.patch(`/employees/${id}/deactivate`);
    } else {
      await api.patch(`/employees/${id}/reactivate`);
    }
    return true;
  } catch (err) {
    console.error(`Failed to toggle status for user #${id}:`, err);
    throw err;
  }
};

/**
 * Update a user's security role (Admin only).
 * @param {number} userId - The user_id from the users table
 * @param {string} newRole - New role in UPPERCASE format (e.g. 'HR_PAYROLL_MANAGER')
 */
export const updateUserRole = async (userId, newRole) => {
  try {
    // Convert frontend UPPERCASE role to DB lowercase format
    const dbRole = newRole.toLowerCase();
    const res = await api.patch(`/auth/users/${userId}/role`, { role: dbRole });
    return res.data?.data?.user;
  } catch (err) {
    console.error(`Failed to update role for user #${userId}:`, err);
    throw err;
  }
};

// ==========================================
// 2. ROLES & PERMISSIONS
// ==========================================

export const getRolesAndPermissions = () => {
  const saved = localStorage.getItem(CUSTOM_PERMISSIONS_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // ignore
    }
  }
  return ROLE_PERMISSIONS;
};

export const saveRolePermissions = (updatedRolePermissions) => {
  localStorage.setItem(CUSTOM_PERMISSIONS_KEY, JSON.stringify(updatedRolePermissions));
  return updatedRolePermissions;
};

// ==========================================
// 3. SYSTEM SETTINGS
// ==========================================

export const getSystemSettings = () => {
  const saved = localStorage.getItem(SYSTEM_SETTINGS_KEY);
  if (saved) {
    try {
      return { ...DEFAULT_SYSTEM_SETTINGS, ...JSON.parse(saved) };
    } catch {
      // ignore
    }
  }
  return DEFAULT_SYSTEM_SETTINGS;
};

export const updateSystemSettings = (newSettings) => {
  const merged = { ...getSystemSettings(), ...newSettings };
  localStorage.setItem(SYSTEM_SETTINGS_KEY, JSON.stringify(merged));
  return merged;
};

export default {
  listUsers,
  createUser,
  updateUser,
  toggleUserStatus,
  updateUserRole,
  getRolesAndPermissions,
  saveRolePermissions,
  getSystemSettings,
  updateSystemSettings,
};
