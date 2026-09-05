import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
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
  Briefcase,
} from "lucide-react";

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
        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 relative group ${
          isActive
            ? "bg-[#7743db] text-white shadow-sm shadow-[#7743db]/25 font-semibold"
            : "text-[#c3acd0]/85 hover:bg-[#231c34] hover:text-white"
        }`}
      >
        <Icon className="w-4.5 h-4.5 shrink-0 w-[18px] h-[18px]" />
        {showLabel && <span className="truncate">{label}</span>}
        {!showLabel && (
          <span className="absolute left-full ml-3 px-2 py-1 text-xs font-medium bg-[#1e182a] text-white rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-lg border border-[#28203b] transition-opacity duration-150">
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
      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
        isActiveSection
          ? "text-white bg-[#231c34]/70"
          : "text-[#c3acd0]/85 hover:bg-[#231c34] hover:text-white"
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon className="w-[18px] h-[18px] shrink-0" />
        {showLabel && <span className="truncate">{label}</span>}
      </div>
      {showLabel && (
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-150 text-[#c3acd0]/70 ${
            openSections[sectionKey] ? "rotate-180" : ""
          }`}
        />
      )}
    </button>
  );

  /* ─── Section label ─── */
  const SectionLabel = ({ children }) =>
    showLabel ? (
      <div className="px-3 pt-4 pb-1">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#6b5880]">
          {children}
        </span>
      </div>
    ) : (
      <div className="py-2">
        <div className="mx-auto w-6 border-t border-[#28203b]" />
      </div>
    );

  return (
    <aside
      className={`h-full flex flex-col transition-all duration-200 ${
        isMobileSheet ? "w-64" : collapsed ? "w-16" : "w-64"
      }`}
      style={{ backgroundColor: "#120e1c", borderRight: "1px solid #28203b" }}
    >
      {/* ── Brand Header ── */}
      <div
        className="h-16 flex items-center px-4 shrink-0"
        style={{ borderBottom: "1px solid #28203b" }}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-white font-bold text-xs shadow-sm shadow-[#7743db]/30"
            style={{ background: "linear-gradient(135deg, #7743db 0%, #6334b8 100%)" }}
          >
            <Briefcase className="w-4 h-4" />
          </div>
          {showLabel && (
            <div className="overflow-hidden">
              <p className="font-bold text-sm text-white truncate leading-tight">
                PeoplePay<span className="text-[#c3acd0]">360</span>
              </p>
              <p className="text-[10px] text-[#8f7a9f] truncate">HR & Payroll</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Navigation ── */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {isEmployeeRole ? (
          /* Employee-only reduced menu */
          <>
            <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" exact />
            <SectionLabel>My Workspace</SectionLabel>
            <NavItem to="/profile"      icon={User}     label="My Profile" />
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
                  location.pathname.startsWith("/my-") || location.pathname === "/profile"
                }
              />
              {(openSections.workspace || (!showLabel)) && (
                <div className={`mt-0.5 space-y-0.5 ${showLabel ? "pl-7" : ""}`}>
                  <NavItem to="/profile"       icon={User}     label="My Profile" />
                  <NavItem to="/my-attendance"  icon={Clock}    label="My Attendance" />
                  <NavItem to="/my-time-off"   icon={Calendar} label="My Time Off" />
                  <NavItem to="/my-payslips"   icon={FileText}  label="My Payslips" />
                </div>
              )}
            </div>

            <SectionLabel>HR & Payroll Ops</SectionLabel>

            <NavItem to="/employees"  icon={Users}         label="Employees"     permission={PERMISSIONS.EMPLOYEE.VIEW} />
            <NavItem to="/contracts"  icon={FileCheck}     label="Contracts"     permission={PERMISSIONS.CONTRACT.VIEW} />
            <NavItem to="/schedules"  icon={CalendarClock} label="Schedules"     permission={PERMISSIONS.SCHEDULE.VIEW} />
            <NavItem to="/attendance" icon={Clock}         label="Attendance"    permission={PERMISSIONS.ATTENDANCE.VIEW} />

            {/* Time Off */}
            <PermissionGuard permission={PERMISSIONS.TIMEOFF.VIEW}>
              <div>
                <SectionToggle
                  sectionKey="timeoff"
                  icon={Calendar}
                  label="Time Off"
                  isActiveSection={location.pathname.startsWith("/time-off")}
                />
                {(openSections.timeoff || (!showLabel)) && (
                  <div className={`mt-0.5 space-y-0.5 ${showLabel ? "pl-7" : ""}`}>
                    <NavItem to="/time-off/requests"    icon={Calendar} label="Requests" />
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

            {/* Payroll */}
            <PermissionGuard permission={PERMISSIONS.PAYROLL.VIEW}>
              <div>
                <SectionToggle
                  sectionKey="payroll"
                  icon={DollarSign}
                  label="Payroll"
                  isActiveSection={location.pathname.startsWith("/payroll")}
                />
                {(openSections.payroll || (!showLabel)) && (
                  <div className={`mt-0.5 space-y-0.5 ${showLabel ? "pl-7" : ""}`}>
                    <NavItem to="/payroll/payruns"           icon={DollarSign} label="Payruns"           permission={PERMISSIONS.PAYRUN.VIEW} />
                    <NavItem to="/payroll/payslips"          icon={FileText}   label="Payslips"          permission={PERMISSIONS.PAYSLIP.VIEW} />
                    <NavItem to="/payroll/salary-structures" icon={Building2}  label="Salary Structures" permission={PERMISSIONS.SALARY_STRUCTURE.VIEW} />
                    <NavItem to="/payroll/salary-rules"      icon={FileText}   label="Salary Rules"      permission={PERMISSIONS.SALARY_RULE.VIEW} />
                  </div>
                )}
              </div>
            </PermissionGuard>

            <NavItem to="/reports" icon={BarChart3} label="Reports" permission={PERMISSIONS.REPORTS.VIEW} />

            {/* Settings */}
            <PermissionGuard
              anyOf={[
                PERMISSIONS.SETTINGS.MANAGE_USERS,
                PERMISSIONS.SETTINGS.MANAGE_ROLES,
                PERMISSIONS.SETTINGS.MANAGE_SYSTEM,
              ]}
            >
              <div>
                <SectionToggle
                  sectionKey="settings"
                  icon={Settings}
                  label="Settings"
                  isActiveSection={location.pathname.startsWith("/settings")}
                />
                {(openSections.settings || (!showLabel)) && (
                  <div className={`mt-0.5 space-y-0.5 ${showLabel ? "pl-7" : ""}`}>
                    <NavItem to="/settings/users"  icon={Users}    label="Users"             permission={PERMISSIONS.SETTINGS.MANAGE_USERS} />
                    <NavItem to="/settings/roles"  icon={Settings} label="Roles & Perms"     permission={PERMISSIONS.SETTINGS.MANAGE_ROLES} />
                    <NavItem to="/settings/system" icon={Settings} label="System Settings"   permission={PERMISSIONS.SETTINGS.MANAGE_SYSTEM} />
                  </div>
                )}
              </div>
            </PermissionGuard>
          </>
        )}
      </div>

      {/* ── Collapse Toggle ── */}
      {!isMobileSheet && (
        <div className="p-2 shrink-0" style={{ borderTop: "1px solid #28203b" }}>
          <button
            onClick={onToggleCollapse}
            aria-label="Toggle sidebar"
            className="w-full flex items-center justify-center p-2 rounded-lg text-[#8f7a9f] hover:bg-[#231c34] hover:text-white transition-colors duration-150"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>
      )}
    </aside>
  );
}
