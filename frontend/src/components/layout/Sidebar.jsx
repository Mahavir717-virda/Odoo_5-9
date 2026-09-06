import React, { useState } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { PERMISSIONS } from "../../utils/permissions";
import PermissionGuard from "../common/PermissionGuard";
import {
  LayoutDashboard,
  Users,
  FileCheck,
  CalendarClock,
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

import Logo from "../common/Logo";

export default function Sidebar({ collapsed, onToggleCollapse, isMobileSheet = false }) {
  const { user } = useAuth();
  const location = useLocation();
  const isEmployeeRole = user?.role === "EMPLOYEE";

  const [openSections, setOpenSections] = useState({
    workspace:
      location.pathname.startsWith("/my-") || location.pathname === "/profile",
    timeoff:  location.pathname.startsWith("/time-off"),
    payroll:  location.pathname.startsWith("/payroll"),
    settings: location.pathname.startsWith("/settings"),
  });

  const toggleSection = (section) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const showLabel = !collapsed || isMobileSheet;

  /* ─── Individual nav link ─── */
  const NavItem = ({ to, icon: Icon, label, permission, anyOf, exact = false }) => {
    const isActive = exact
      ? location.pathname === to
      : location.pathname === to || location.pathname.startsWith(`${to}/`);

    const content = (
      <NavLink
        to={to}
        title={!showLabel ? label : undefined}
        className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 relative group ${
          isActive
            ? "bg-teal-50 text-teal-900 border-l-4 border-teal-700 shadow-xs font-semibold"
            : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
        }`}
      >
        <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-teal-700" : "text-slate-400 group-hover:text-slate-700"}`} />
        {showLabel && (
          <span className="truncate">{label}</span>
        )}
        {!showLabel && (
          <span className="absolute left-full ml-3 px-2.5 py-1 text-xs font-medium bg-slate-800 text-white rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-md transition-opacity duration-150">
            {label}
          </span>
        )}
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

  /* ─── Collapsible section header ─── */
  const SectionToggle = ({ sectionKey, icon: Icon, label, isActiveSection }) => (
    <button
      onClick={() => toggleSection(sectionKey)}
      title={!showLabel ? label : undefined}
      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer ${
        isActiveSection
          ? "text-teal-900 bg-teal-50/60 font-semibold"
          : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
      }`}
    >
      <div className="flex items-center gap-2.5">
        <Icon className={`w-4 h-4 shrink-0 ${isActiveSection ? "text-teal-700" : "text-slate-400"}`} />
        {showLabel && (
          <span className="truncate">{label}</span>
        )}
      </div>
      {showLabel && (
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-150 ${
            isActiveSection ? "text-teal-700" : "text-slate-400"
          } ${openSections[sectionKey] ? "rotate-180" : ""}`}
        />
      )}
    </button>
  );

  /* ─── Section label ─── */
  const SectionLabel = ({ children }) =>
    showLabel ? (
      <div className="px-3.5 pt-4 pb-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {children}
        </span>
      </div>
    ) : (
      <div className="py-2">
        <div className="mx-auto w-6 border-t border-slate-200" />
      </div>
    );

  return (
    <aside
      className={`h-full flex flex-col transition-all duration-200 bg-white border-r border-slate-200/80 ${
        isMobileSheet ? "w-64" : collapsed ? "w-16" : "w-64"
      }`}
    >
      {/* ── Brand Header ── */}
      <div className="h-16 flex items-center px-4 shrink-0 border-b border-slate-200/80">
        <Link to="/dashboard" className="flex items-center gap-2 overflow-hidden py-1">
          <Logo size={showLabel ? 36 : 28} showText={showLabel} lightText={false} />
        </Link>
      </div>

      {/* ── Navigation ── */}
      <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-1">
        {isEmployeeRole ? (
          /* Employee-only reduced menu */
          <>
            <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" exact />
            <SectionLabel>My Workspace</SectionLabel>
            <NavItem to="/profile"       icon={User}     label="My Profile" />
            <NavItem to="/calendar"      icon={Calendar} label="Calendar" />
            <NavItem to="/my-attendance" icon={Clock}    label="My Attendance" />
            <NavItem to="/my-time-off"  icon={Calendar} label="My Time Off" />
            <NavItem to="/my-payslips"  icon={FileText}  label="My Payslips" />
          </>
        ) : (
          <>
            <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" exact />

            {/* My Workspace */}
            <div>
              <SectionToggle
                sectionKey="workspace"
                icon={User}
                label="My Workspace"
                isActiveSection={
                  location.pathname.startsWith("/my-") || location.pathname === "/profile" || location.pathname === "/calendar"
                }
              />
              {(openSections.workspace || (!showLabel)) && (
                <div className={`mt-1 space-y-1 ${showLabel ? "pl-4" : ""}`}>
                  <NavItem to="/profile"       icon={User}     label="My Profile" />
                  <NavItem to="/calendar"      icon={Calendar} label="Calendar" />
                  <NavItem to="/my-attendance"  icon={Clock}    label="My Attendance" />
                  <NavItem to="/my-time-off"   icon={Calendar} label="My Time Off" />
                  <NavItem to="/my-payslips"   icon={FileText}  label="My Payslips" />
                </div>
              )}
            </div>

            {/* Employees */}
            <NavItem
              to="/employees"
              icon={Users}
              label="Employees"
              permission={PERMISSIONS.EMPLOYEE.VIEW}
            />

            {/* Contracts */}
            <NavItem
              to="/contracts"
              icon={FileCheck}
              label="Contracts"
              permission={PERMISSIONS.CONTRACT.VIEW}
            />

            {/* Working Schedules */}
            <NavItem
              to="/schedules"
              icon={CalendarClock}
              label="Work Schedules"
              permission={PERMISSIONS.SCHEDULE.VIEW}
            />

            {/* Attendance Overview */}
            <NavItem
              to="/attendance"
              icon={Clock}
              label="Attendance Overview"
              permission={PERMISSIONS.ATTENDANCE.VIEW}
            />

            {/* Time Off Section */}
            <div>
              <SectionToggle
                sectionKey="timeoff"
                icon={Calendar}
                label="Time Off"
                isActiveSection={location.pathname.startsWith("/time-off")}
              />
              {(openSections.timeoff || (!showLabel)) && (
                <div className={`mt-1 space-y-1 ${showLabel ? "pl-4" : ""}`}>
                  <NavItem
                    to="/time-off/requests"
                    icon={FileText}
                    label="Leave Requests"
                    permission={PERMISSIONS.TIMEOFF.VIEW}
                  />
                  <NavItem
                    to="/time-off/allocations"
                    icon={Building2}
                    label="Leave Allocations"
                    permission={PERMISSIONS.TIMEOFF.VIEW}
                  />
                  <NavItem
                    to="/time-off/types"
                    icon={Settings}
                    label="Leave Types"
                    permission={PERMISSIONS.TIMEOFF.MANAGE_TYPES}
                  />
                </div>
              )}
            </div>

            {/* Payroll Section */}
            <div>
              <SectionToggle
                sectionKey="payroll"
                icon={DollarSign}
                label="Payroll"
                isActiveSection={location.pathname.startsWith("/payroll")}
              />
              {(openSections.payroll || (!showLabel)) && (
                <div className={`mt-1 space-y-1 ${showLabel ? "pl-4" : ""}`}>
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
                    icon={Settings}
                    label="Salary Rules"
                    permission={PERMISSIONS.SALARY_RULE.VIEW}
                  />
                </div>
              )}
            </div>

            {/* Reports */}
            <NavItem
              to="/reports"
              icon={BarChart3}
              label="Reports & Analytics"
              permission={PERMISSIONS.REPORTS.VIEW}
            />

            {/* Settings Section */}
            <div>
              <SectionToggle
                sectionKey="settings"
                icon={Settings}
                label="System Settings"
                isActiveSection={location.pathname.startsWith("/settings")}
              />
              {(openSections.settings || (!showLabel)) && (
                <div className={`mt-1 space-y-1 ${showLabel ? "pl-4" : ""}`}>
                  <NavItem
                    to="/settings/users"
                    icon={Users}
                    label="Users & Access"
                    permission={PERMISSIONS.SETTINGS.MANAGE_USERS}
                  />
                  <NavItem
                    to="/settings/roles"
                    icon={Settings}
                    label="Roles & Rights"
                    permission={PERMISSIONS.SETTINGS.MANAGE_ROLES}
                  />
                  <NavItem
                    to="/settings/system"
                    icon={Building2}
                    label="Company Profile"
                    permission={PERMISSIONS.SETTINGS.MANAGE_SYSTEM}
                  />
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Collapse Toggle */}
      {!isMobileSheet && (
        <div className="p-3 shrink-0 border-t border-slate-200/80">
          <button
            onClick={onToggleCollapse}
            className="w-full flex items-center justify-center p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100/80 rounded-xl transition-colors cursor-pointer"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                <ChevronLeft className="w-4 h-4" />
                <span>Collapse Sidebar</span>
              </div>
            )}
          </button>
        </div>
      )}
    </aside>
  );
}
