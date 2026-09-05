/**
 * Map route pathnames to human-readable page titles
 */
export function getPageTitle(pathname) {
  if (!pathname) return "Dashboard";

  // Exact matches
  const staticTitles = {
    "/dashboard": "Dashboard",
    "/employees": "Employees",
    "/employees/new": "Add Employee",
    "/contracts": "Contracts",
    "/schedules": "Schedules",
    "/attendance": "Attendance",
    "/time-off/requests": "Time Off Requests",
    "/time-off/allocations": "Time Off Allocations",
    "/time-off/types": "Time Off Types",
    "/payroll/payruns": "Payruns",
    "/payroll/payruns/new": "New Payrun",
    "/payroll/payslips": "Payslips",
    "/payroll/salary-structures": "Salary Structures",
    "/payroll/salary-rules": "Salary Rules",
    "/reports": "Reports",
    "/settings/users": "User Management",
    "/settings/roles": "Roles & Permissions",
    "/settings/system": "System Settings",
    "/my-attendance": "My Attendance",
    "/my-time-off": "My Time Off",
    "/my-payslips": "My Payslips",
    "/profile": "User Profile",
    "/change-password": "Change Password",
  };

  if (staticTitles[pathname]) {
    return staticTitles[pathname];
  }

  // Dynamic route matches
  if (pathname.startsWith("/contracts/")) {
    return "Contract Details";
  }
  if (pathname.startsWith("/employees/")) {
    if (pathname.endsWith("/edit")) return "Edit Employee";
    return "Employee Details";
  }
  if (pathname.startsWith("/payroll/payruns/")) {
    return "Payrun Details";
  }
  if (pathname.startsWith("/payroll/payslips/")) {
    return "Payslip Details";
  }

  // Fallback: title-case the last path segment
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return "Dashboard";

  const lastSegment = segments[segments.length - 1];
  return lastSegment
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
