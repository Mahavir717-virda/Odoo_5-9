import React, { useState, useEffect } from "react";
import {
  Shield,
  Check,
  RotateCcw,
  Save,
  CheckCircle2,
  AlertCircle,
  Users,
  FileCheck,
  Clock,
  Calendar,
  DollarSign,
  BarChart3,
  Settings,
  Layers,
  Info,
} from "lucide-react";
import { PERMISSIONS, ROLE_PERMISSIONS } from "../../utils/permissions";
import {
  getRolesAndPermissions,
  saveRolePermissions,
} from "../../services/settingsService";

const ROLES = [
  {
    key: "ADMIN",
    name: "Administrator",
    description: "Unrestricted master access to all enterprise modules, system settings, and user security policies.",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
  },
  {
    key: "HR_PAYROLL_MANAGER",
    name: "HR Payroll Manager",
    description: "Complete control over payroll rules, structures, payrun batch approvals, contracts, and leave quotas.",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
  },
  {
    key: "HR_PAYROLL_USER",
    name: "HR Payroll User",
    description: "Compute payruns, manage employee attendance, validate payslips, and review time off requests.",
    badgeClass: "bg-[#f0fdfa] text-[#115e59] border-[#99f6e4]",
  },
  {
    key: "HR_MANAGER",
    name: "HR Manager",
    description: "Oversee employee profiles, recruitment contracts, schedule assignments, and leave approvals.",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
  },
  {
    key: "EMPLOYEE",
    name: "Standard Employee",
    description: "Personal self-service workspace: Punch logs, time off requests, and monthly payslips.",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
  },
];

const MODULE_DEFINITIONS = [
  {
    id: "employee",
    title: "Employee Directory & Profiles",
    icon: Users,
    color: "text-blue-600 bg-blue-50",
    permissions: [
      { key: PERMISSIONS.EMPLOYEE.VIEW, label: "View Employees", desc: "Access employee directory and profile summaries" },
      { key: PERMISSIONS.EMPLOYEE.CREATE, label: "Create Employees", desc: "Onboard new employee profiles in database" },
      { key: PERMISSIONS.EMPLOYEE.EDIT, label: "Edit Employees", desc: "Update employee details, departments, and contacts" },
      { key: PERMISSIONS.EMPLOYEE.DELETE, label: "Delete / Archive", desc: "Deactivate or archive employee records" },
    ],
  },
  {
    id: "contracts",
    title: "Contracts & Schedules",
    icon: FileCheck,
    color: "text-emerald-600 bg-emerald-50",
    permissions: [
      { key: PERMISSIONS.CONTRACT.VIEW, label: "View Contracts", desc: "Inspect employment agreements and wage terms" },
      { key: PERMISSIONS.CONTRACT.MANAGE, label: "Manage Contracts", desc: "Create, renew, and terminate employment contracts" },
      { key: PERMISSIONS.SCHEDULE.VIEW, label: "View Schedules", desc: "Browse weekly working hours and shifts" },
      { key: PERMISSIONS.SCHEDULE.MANAGE, label: "Manage Schedules", desc: "Configure custom work shift timetables" },
    ],
  },
  {
    id: "attendance",
    title: "Company Attendance",
    icon: Clock,
    color: "text-amber-600 bg-amber-50",
    permissions: [
      { key: PERMISSIONS.ATTENDANCE.VIEW, label: "View Attendance Logs", desc: "Monitor company-wide punch records" },
      { key: PERMISSIONS.ATTENDANCE.EDIT, label: "Manual Attendance", desc: "Create or adjust manual employee punches" },
    ],
  },
  {
    id: "timeoff",
    title: "Time Off & Leave Management",
    icon: Calendar,
    color: "text-rose-600 bg-rose-50",
    permissions: [
      { key: PERMISSIONS.TIMEOFF.VIEW, label: "View Leave Requests", desc: "Browse employee leave submissions" },
      { key: PERMISSIONS.TIMEOFF.APPROVE, label: "Approve & Reject", desc: "Review and approve/reject leave requests" },
      { key: PERMISSIONS.TIMEOFF.MANAGE_ALLOCATIONS, label: "Manage Allocations", desc: "Grant and edit leave balance quotas" },
      { key: PERMISSIONS.TIMEOFF.MANAGE_TYPES, label: "Manage Leave Types", desc: "Create and configure custom leave types" },
    ],
  },
  {
    id: "payroll",
    title: "Payroll & Compensation Rules",
    icon: DollarSign,
    color: "text-purple-600 bg-purple-50",
    permissions: [
      { key: PERMISSIONS.PAYROLL.VIEW, label: "View Payroll Module", desc: "Access payroll overview and payrun lists" },
      { key: PERMISSIONS.PAYRUN.VIEW, label: "View Payruns", desc: "Browse monthly payrun batch cycles" },
      { key: PERMISSIONS.PAYRUN.MANAGE, label: "Compute & Validate Payruns", desc: "Run payroll calculations and disburse payments" },
      { key: PERMISSIONS.PAYSLIP.VIEW, label: "View Payslips", desc: "Inspect itemized employee payslips" },
      { key: PERMISSIONS.SALARY_STRUCTURE.VIEW, label: "View Structures", desc: "Browse compensation structures" },
      { key: PERMISSIONS.SALARY_STRUCTURE.EDIT, label: "Manage Structures", desc: "Create and edit salary structures" },
      { key: PERMISSIONS.SALARY_RULE.VIEW, label: "View Salary Rules", desc: "Browse computational salary rules" },
      { key: PERMISSIONS.SALARY_RULE.EDIT, label: "Manage Salary Rules", desc: "Configure calculation rules and formulas" },
    ],
  },
  {
    id: "reports",
    title: "Reports & Analytics",
    icon: BarChart3,
    color: "text-[#0f766e] bg-[#f0fdfa]",
    permissions: [
      { key: PERMISSIONS.REPORTS.VIEW, label: "View BI Analytics", desc: "Access payroll summaries and cost reports" },
    ],
  },
  {
    id: "settings",
    title: "System Administration",
    icon: Settings,
    color: "text-slate-600 bg-slate-100",
    permissions: [
      { key: PERMISSIONS.SETTINGS.MANAGE_USERS, label: "Manage Users", desc: "Create accounts and manage user credentials" },
      { key: PERMISSIONS.SETTINGS.MANAGE_ROLES, label: "Manage Roles & Permissions", desc: "Customize security policies" },
      { key: PERMISSIONS.SETTINGS.MANAGE_SYSTEM, label: "Manage System Settings", desc: "Configure company parameters and policies" },
    ],
  },
];

export default function RolesSettingsPage() {
  const [activeRoleKey, setActiveRoleKey] = useState("ADMIN");
  const [rolePermissionsMatrix, setRolePermissionsMatrix] = useState({});
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const matrix = getRolesAndPermissions();
    setRolePermissionsMatrix(matrix);
  }, []);

  const currentRolePerms = rolePermissionsMatrix[activeRoleKey] || [];

  const handleTogglePermission = (permKey) => {
    if (activeRoleKey === "ADMIN") return; // Admin has permanent superuser access

    setRolePermissionsMatrix((prev) => {
      const perms = prev[activeRoleKey] || [];
      const has = perms.includes(permKey);
      const updated = has ? perms.filter((p) => p !== permKey) : [...perms, permKey];
      return {
        ...prev,
        [activeRoleKey]: updated,
      };
    });
  };

  const handleToggleModule = (modPermissions) => {
    if (activeRoleKey === "ADMIN") return;

    const modKeys = modPermissions.map((p) => p.key);
    const allSelected = modKeys.every((k) => currentRolePerms.includes(k));

    setRolePermissionsMatrix((prev) => {
      const perms = prev[activeRoleKey] || [];
      let updated;
      if (allSelected) {
        updated = perms.filter((k) => !modKeys.includes(k));
      } else {
        const set = new Set([...perms, ...modKeys]);
        updated = Array.from(set);
      }
      return {
        ...prev,
        [activeRoleKey]: updated,
      };
    });
  };

  const handleResetDefaults = () => {
    if (!window.confirm("Reset all roles to system default permissions?")) return;
    setRolePermissionsMatrix(ROLE_PERMISSIONS);
    saveRolePermissions(ROLE_PERMISSIONS);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleSave = () => {
    saveRolePermissions(rolePermissionsMatrix);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  const activeRole = ROLES.find((r) => r.key === activeRoleKey) || ROLES[0];

  return (
    <div className="space-y-6 pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Roles & Permissions
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#f0fdfa] text-[#115e59] border border-indigo-100">
              Role-Based Access Control (RBAC)
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Configure fine-grained module privileges and security policies across enterprise roles.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleResetDefaults}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition shadow-sm"
          >
            <RotateCcw className="w-4 h-4" />
            Reset Defaults
          </button>
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold bg-[#0f766e] hover:bg-[#115e59] text-white shadow-sm shadow-teal-100 transition"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-700 text-sm">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>Role permissions matrix successfully saved and applied to system sessions.</span>
        </div>
      )}

      {/* Role Selection Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {ROLES.map((role) => {
          const isSelected = activeRoleKey === role.key;
          const assignedCount = (rolePermissionsMatrix[role.key] || []).length;

          return (
            <button
              key={role.key}
              onClick={() => setActiveRoleKey(role.key)}
              className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between ${
                isSelected
                  ? "bg-[#f0fdfa]/70 border-indigo-600 shadow-sm ring-1 ring-indigo-600"
                  : "bg-white border-slate-200/80 hover:border-slate-300"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${role.badgeClass}`}>
                    {role.key}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    {role.key === "ADMIN" ? "All" : `${assignedCount} Perms`}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900">{role.name}</h3>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Role Description Banner */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-start gap-4">
        <div className="p-3 bg-[#f0fdfa] text-[#0f766e] rounded-xl shrink-0">
          <Shield className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">
              Editing: {activeRole.name}
            </h3>
            {activeRoleKey === "ADMIN" && (
              <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-700 text-xs font-semibold">
                Superuser (Read-Only Matrix)
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">{activeRole.description}</p>
        </div>
      </div>

      {/* Permissions Modules Matrix */}
      <div className="space-y-6">
        {MODULE_DEFINITIONS.map((mod) => {
          const ModIcon = mod.icon;
          const allSelected = mod.permissions.every((p) => currentRolePerms.includes(p.key));
          const someSelected =
            mod.permissions.some((p) => currentRolePerms.includes(p.key)) && !allSelected;

          return (
            <div
              key={mod.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden"
            >
              {/* Module Header */}
              <div className="p-4 sm:px-6 bg-slate-50/75 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${mod.color}`}>
                    <ModIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{mod.title}</h4>
                    <p className="text-xs text-slate-500">Module Access Policies</p>
                  </div>
                </div>

                {activeRoleKey !== "ADMIN" && (
                  <button
                    onClick={() => handleToggleModule(mod.permissions)}
                    className="text-xs font-semibold text-[#0f766e] hover:underline"
                  >
                    {allSelected ? "Deselect All" : "Select All"}
                  </button>
                )}
              </div>

              {/* Permissions List */}
              <div className="divide-y divide-slate-100 p-2 sm:p-4 grid grid-cols-1 md:grid-cols-2 gap-2">
                {mod.permissions.map((perm) => {
                  const isChecked =
                    activeRoleKey === "ADMIN" ? true : currentRolePerms.includes(perm.key);

                  return (
                    <div
                      key={perm.key}
                      onClick={() => handleTogglePermission(perm.key)}
                      className={`p-3 rounded-xl flex items-start gap-3 transition cursor-pointer ${
                        isChecked
                          ? "bg-[#f0fdfa]/60"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition ${
                          isChecked
                            ? "bg-[#0f766e] border-indigo-600 text-white"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">
                            {perm.label}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400">{perm.key}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{perm.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

