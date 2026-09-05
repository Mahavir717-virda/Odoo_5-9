import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { PERMISSIONS } from "../../utils/permissions";
import PermissionGuard from "../common/PermissionGuard";
import {
  LayoutDashboard,
  Users,
  FileCheck,
  Clock,
  Calendar,
  DollarSign,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  User,
  FileText,
  Building2,
} from "lucide-react";

export default function Sidebar({ collapsed, onToggleCollapse, isMobileSheet = false }) {
  const { user } = useAuth();
  const location = useLocation();
  const isEmployeeRole = user?.role === "EMPLOYEE";

  // State for expandable menu sections
  const [openSections, setOpenSections] = useState({
    timeoff: location.pathname.startsWith("/time-off"),
    payroll: location.pathname.startsWith("/payroll"),
    settings: location.pathname.startsWith("/settings"),
  });

  const toggleSection = (section) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const NavItem = ({ to, icon: Icon, label, permission, anyOf, exact = false }) => {
    const isActive = exact
      ? location.pathname === to
      : location.pathname === to || location.pathname.startsWith(`${to}/`);

    const content = (
      <NavLink
        to={to}
        className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors relative group ${
          isActive
            ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 font-semibold"
            : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
        }`}
        title={collapsed && !isMobileSheet ? label : undefined}
      >
        <Icon className="w-5 h-5 shrink-0" />
        {(!collapsed || isMobileSheet) && <span className="truncate">{label}</span>}
      </NavLink>
    );

    if (permission || anyOf) {
      return (
        <PermissionGuard permission={permission} anyOf={anyOf}>
          {content}
        </PermissionGuard>
      );
    }

    return content;
  };

  return (
    <aside
      className={`h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col transition-all duration-200 ${
        isMobileSheet
          ? "w-64"
          : collapsed
          ? "w-16"
          : "w-64"
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center px-4 border-b border-gray-200 dark:border-gray-800 shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
            P360
          </div>
          {(!collapsed || isMobileSheet) && (
            <span className="font-bold text-lg text-gray-900 dark:text-gray-100 truncate">
              PeoplePay<span className="text-blue-600">360</span>
            </span>
          )}
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {isEmployeeRole ? (
          /* Reduced menu for EMPLOYEE role */
          <>
            <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" exact />
            <NavItem to="/profile" icon={User} label="My Profile" />
            <NavItem to="/my-attendance" icon={Clock} label="My Attendance" />
            <NavItem to="/my-time-off" icon={Calendar} label="My Time Off" />
            <NavItem to="/my-payslips" icon={FileText} label="My Payslips" />
          </>
        ) : (
          /* Full Gated Menu for HR & Admin */
          <>
            <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" exact />

            <NavItem
              to="/employees"
              icon={Users}
              label="Employees"
              permission={PERMISSIONS.EMPLOYEE.VIEW}
            />

            <NavItem
              to="/contracts"
              icon={FileCheck}
              label="Contracts"
              permission={PERMISSIONS.CONTRACT.VIEW}
            />

            <NavItem
              to="/attendance"
              icon={Clock}
              label="Attendance"
              permission={PERMISSIONS.ATTENDANCE.VIEW}
            />

            {/* Time Off Section */}
            <PermissionGuard permission={PERMISSIONS.TIMEOFF.VIEW}>
              <div>
                <button
                  onClick={() => toggleSection("timeoff")}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    location.pathname.startsWith("/time-off")
                      ? "text-blue-600 dark:text-blue-400 font-semibold"
                      : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                  }`}
                  title={collapsed && !isMobileSheet ? "Time Off" : undefined}
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 shrink-0" />
                    {(!collapsed || isMobileSheet) && <span className="truncate">Time Off</span>}
                  </div>
                  {(!collapsed || isMobileSheet) && (
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${
                        openSections.timeoff ? "rotate-180" : ""
                      }`}
                    />
                  )}
                </button>
                {(openSections.timeoff || (collapsed && !isMobileSheet)) && (
                  <div className={`mt-1 space-y-1 ${!collapsed || isMobileSheet ? "pl-8" : ""}`}>
                    <NavItem to="/time-off/requests" icon={Calendar} label="Requests" />
                    <NavItem to="/time-off/allocations" icon={Calendar} label="Allocations" />
                    <NavItem
                      to="/time-off/types"
                      icon={Calendar}
                      label="Types"
                      permission={PERMISSIONS.TIMEOFF.MANAGE_TYPES}
                    />
                  </div>
                )}
              </div>
            </PermissionGuard>

            {/* Payroll Section */}
            <PermissionGuard permission={PERMISSIONS.PAYROLL.VIEW}>
              <div>
                <button
                  onClick={() => toggleSection("payroll")}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    location.pathname.startsWith("/payroll")
                      ? "text-blue-600 dark:text-blue-400 font-semibold"
                      : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                  }`}
                  title={collapsed && !isMobileSheet ? "Payroll" : undefined}
                >
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-5 h-5 shrink-0" />
                    {(!collapsed || isMobileSheet) && <span className="truncate">Payroll</span>}
                  </div>
                  {(!collapsed || isMobileSheet) && (
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${
                        openSections.payroll ? "rotate-180" : ""
                      }`}
                    />
                  )}
                </button>
                {(openSections.payroll || (collapsed && !isMobileSheet)) && (
                  <div className={`mt-1 space-y-1 ${!collapsed || isMobileSheet ? "pl-8" : ""}`}>
                    <NavItem
                      to="/payroll/payruns"
                      icon={DollarSign}
                      label="Payruns"
                      permission={PERMISSIONS.PAYRUN.VIEW}
                    />
                    <NavItem
                      to="/payroll/payslips"
                      icon={FileText}
                      label="Payslips"
                      permission={PERMISSIONS.PAYSLIP.VIEW}
                    />
                    <NavItem
                      to="/payroll/salary-structures"
                      icon={Building2}
                      label="Salary Structures"
                      permission={PERMISSIONS.SALARY_STRUCTURE.VIEW}
                    />
                    <NavItem
                      to="/payroll/salary-rules"
                      icon={FileText}
                      label="Salary Rules"
                      permission={PERMISSIONS.SALARY_RULE.VIEW}
                    />
                  </div>
                )}
              </div>
            </PermissionGuard>

            <NavItem
              to="/reports"
              icon={BarChart3}
              label="Reports"
              permission={PERMISSIONS.REPORTS.VIEW}
            />

            {/* Settings Section */}
            <PermissionGuard
              anyOf={[
                PERMISSIONS.SETTINGS.MANAGE_USERS,
                PERMISSIONS.SETTINGS.MANAGE_ROLES,
                PERMISSIONS.SETTINGS.MANAGE_SYSTEM,
              ]}
            >
              <div>
                <button
                  onClick={() => toggleSection("settings")}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    location.pathname.startsWith("/settings")
                      ? "text-blue-600 dark:text-blue-400 font-semibold"
                      : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                  }`}
                  title={collapsed && !isMobileSheet ? "Settings" : undefined}
                >
                  <div className="flex items-center gap-3">
                    <Settings className="w-5 h-5 shrink-0" />
                    {(!collapsed || isMobileSheet) && <span className="truncate">Settings</span>}
                  </div>
                  {(!collapsed || isMobileSheet) && (
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${
                        openSections.settings ? "rotate-180" : ""
                      }`}
                    />
                  )}
                </button>
                {(openSections.settings || (collapsed && !isMobileSheet)) && (
                  <div className={`mt-1 space-y-1 ${!collapsed || isMobileSheet ? "pl-8" : ""}`}>
                    <NavItem
                      to="/settings/users"
                      icon={Users}
                      label="Users"
                      permission={PERMISSIONS.SETTINGS.MANAGE_USERS}
                    />
                    <NavItem
                      to="/settings/roles"
                      icon={Settings}
                      label="Roles & Permissions"
                      permission={PERMISSIONS.SETTINGS.MANAGE_ROLES}
                    />
                    <NavItem
                      to="/settings/system"
                      icon={Settings}
                      label="System Settings"
                      permission={PERMISSIONS.SETTINGS.MANAGE_SYSTEM}
                    />
                  </div>
                )}
              </div>
            </PermissionGuard>
          </>
        )}
      </div>

      {/* Collapse Toggle Footer */}
      {!isMobileSheet && (
        <div className="p-3 border-t border-gray-200 dark:border-gray-800 shrink-0">
          <button
            onClick={onToggleCollapse}
            className="w-full flex items-center justify-center p-2 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Toggle sidebar collapse"
          >
            {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>
      )}
    </aside>
  );
}
