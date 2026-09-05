/**
 * CENTRALIZED PERMISSIONS DEFINITION & ROLE PERMISSION MAPPINGS
 */

export const PERMISSIONS = {
  EMPLOYEE: {
    VIEW: "employee.view",
    CREATE: "employee.create",
    EDIT: "employee.edit",
    DELETE: "employee.delete",
    ARCHIVE: "employee.archive",
  },
  CONTRACT: {
    VIEW: "contract.view",
    MANAGE: "contract.manage",
  },
  SCHEDULE: {
    VIEW: "schedule.view",
    MANAGE: "schedule.manage",
  },
  ATTENDANCE: {
    VIEW: "attendance.view",
    EDIT: "attendance.edit",
  },
  TIMEOFF: {
    VIEW: "timeoff.view",
    APPROVE: "timeoff.approve",
    MANAGE_TYPES: "timeoff.manage_types",
    MANAGE_ALLOCATIONS: "timeoff.manage_allocations",
  },
  PAYROLL: {
    VIEW: "payroll.view",
  },
  PAYRUN: {
    VIEW: "payrun.view",
    MANAGE: "payrun.manage",
  },
  PAYSLIP: {
    VIEW: "payslip.view",
    MANAGE: "payslip.manage",
  },
  SALARY_STRUCTURE: {
    VIEW: "salary_structure.view",
    EDIT: "salary_structure.edit",
  },
  SALARY_RULE: {
    VIEW: "salary_rule.view",
    EDIT: "salary_rule.edit",
  },
  REPORTS: {
    VIEW: "reports.view",
  },
  SETTINGS: {
    MANAGE_USERS: "settings.manage_users",
    MANAGE_ROLES: "settings.manage_roles",
    MANAGE_SYSTEM: "settings.manage_system",
  },
};

const HR_MANAGER_PERMISSIONS = [
  PERMISSIONS.EMPLOYEE.VIEW,
  PERMISSIONS.EMPLOYEE.CREATE,
  PERMISSIONS.EMPLOYEE.EDIT,
  PERMISSIONS.EMPLOYEE.DELETE,
  PERMISSIONS.EMPLOYEE.ARCHIVE,
  PERMISSIONS.CONTRACT.VIEW,
  PERMISSIONS.CONTRACT.MANAGE,
  PERMISSIONS.SCHEDULE.VIEW,
  PERMISSIONS.SCHEDULE.MANAGE,
  PERMISSIONS.ATTENDANCE.VIEW,
  PERMISSIONS.ATTENDANCE.EDIT,
  PERMISSIONS.TIMEOFF.VIEW,
  PERMISSIONS.TIMEOFF.APPROVE,
  PERMISSIONS.TIMEOFF.MANAGE_TYPES,
  PERMISSIONS.TIMEOFF.MANAGE_ALLOCATIONS,
  PERMISSIONS.REPORTS.VIEW,
];

const HR_PAYROLL_USER_PERMISSIONS = [
  ...HR_MANAGER_PERMISSIONS,
  PERMISSIONS.PAYROLL.VIEW,
  PERMISSIONS.PAYRUN.VIEW,
  PERMISSIONS.PAYRUN.MANAGE,
  PERMISSIONS.PAYSLIP.VIEW,
  PERMISSIONS.PAYSLIP.MANAGE,
  PERMISSIONS.SALARY_STRUCTURE.VIEW,
  PERMISSIONS.SALARY_RULE.VIEW,
];

const HR_PAYROLL_MANAGER_PERMISSIONS = [
  ...HR_PAYROLL_USER_PERMISSIONS,
  PERMISSIONS.SALARY_STRUCTURE.EDIT,
  PERMISSIONS.SALARY_RULE.EDIT,
];

const ADMIN_PERMISSIONS = [
  ...HR_PAYROLL_MANAGER_PERMISSIONS,
  PERMISSIONS.SETTINGS.MANAGE_USERS,
  PERMISSIONS.SETTINGS.MANAGE_ROLES,
  PERMISSIONS.SETTINGS.MANAGE_SYSTEM,
];

export const ROLE_PERMISSIONS = {
  EMPLOYEE: [],
  HR_MANAGER: HR_MANAGER_PERMISSIONS,
  HR_PAYROLL_USER: HR_PAYROLL_USER_PERMISSIONS,
  HR_PAYROLL_MANAGER: HR_PAYROLL_MANAGER_PERMISSIONS,
  ADMIN: ADMIN_PERMISSIONS,
};

/**
 * Checks if a given role has a specific permission.
 * @param {string|null|undefined} role 
 * @param {string} permission 
 * @returns {boolean}
 */
export function hasPermission(role, permission) {
  if (!role || !ROLE_PERMISSIONS[role] || !permission) {
    return false;
  }
  return ROLE_PERMISSIONS[role].includes(permission);
}

/**
 * Checks if a given role has ANY of the specified permissions.
 * @param {string|null|undefined} role 
 * @param {string[]} permissionsArray 
 * @returns {boolean}
 */
export function hasAnyPermission(role, permissionsArray) {
  if (!role || !ROLE_PERMISSIONS[role] || !Array.isArray(permissionsArray) || permissionsArray.length === 0) {
    return false;
  }
  return permissionsArray.some((permission) => hasPermission(role, permission));
}

/**
 * Checks if a given role has ALL of the specified permissions.
 * @param {string|null|undefined} role 
 * @param {string[]} permissionsArray 
 * @returns {boolean}
 */
export function hasAllPermissions(role, permissionsArray) {
  if (!role || !ROLE_PERMISSIONS[role] || !Array.isArray(permissionsArray) || permissionsArray.length === 0) {
    return false;
  }
  return permissionsArray.every((permission) => hasPermission(role, permission));
}
