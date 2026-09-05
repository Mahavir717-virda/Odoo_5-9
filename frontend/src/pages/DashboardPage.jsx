import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  User,
  Mail,
  Shield,
  Clock,
  Calendar,
  FileText,
  CheckCircle2,
  Coffee,
  Play,
  Square,
  ArrowRight,
  TrendingUp,
  Sparkles,
  PartyPopper,
  DollarSign,
  AlertCircle,
  Users,
  Layers,
  Building2,
  Check,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Skeleton } from "../components/ui/skeleton";
import StatusBadge from "../components/common/StatusBadge";
import * as portalService from "../services/employeePortalService";
import { listPayruns } from "../services/payrollManagerService";
import { listRequests } from "../services/managerTimeOffService";
import { getEmployees } from "../services/employeeService";
import AttendanceLeaderboard from "../components/attendance/AttendanceLeaderboard";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEmployeeRole = user?.role === "EMPLOYEE";

  // State
  const [dashboardData, setDashboardData] = useState(null);
  const [managerMetrics, setManagerMetrics] = useState({
    totalEmployees: 0,
    pendingLeaves: 0,
    activePayruns: 0,
  });
  const [loading, setLoading] = useState(true);
  const [punchLoading, setPunchLoading] = useState(false);

  const loadData = async () => {
    try {
      // Load employee portal data for everyone (including HR Payroll Users)
      const essData = await portalService.getEmployeeDashboardData().catch(() => null);
      setDashboardData(essData);

      if (!isEmployeeRole) {
        // Load manager-level counts
        const [empRes, leaveRes, payrunRes] = await Promise.all([
          getEmployees().catch(() => []),
          listRequests({ status: "pending" }).catch(() => ({ data: [] })),
          listPayruns({ limit: 10 }).catch(() => ({ data: [] })),
        ]);

        setManagerMetrics({
          totalEmployees: Array.isArray(empRes) ? empRes.length : 0,
          pendingLeaves: Array.isArray(leaveRes.data) ? leaveRes.data.length : 0,
          activePayruns: Array.isArray(payrunRes.data) ? payrunRes.data.length : 0,
        });
      }
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadData();
  }, [isEmployeeRole]);

  // Handle live punch actions
  const handlePunchAction = async (action) => {
    setPunchLoading(true);
    try {
      const updatedPunch = await portalService.recordClockInOut(action);
      setDashboardData((prev) => ({
        ...prev,
        punchState: updatedPunch,
      }));
      await loadData();
    } catch (err) {
      console.error("Punch action error:", err);
      alert(err.response?.data?.message || err.message || "Failed to complete punch action.");
    } finally {
      setPunchLoading(false);
    }
  };

  const formatRole = (role) => {
    if (!role) return "User";
    return role
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const todayFormatted = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const { punchState, stats, recentAttendance, recentLeaves, holidays } =
    dashboardData || {};

  if (loading) {
    return (
      <div className="space-y-6 pb-12 max-w-6xl mx-auto">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-72 lg:col-span-2 rounded-2xl" />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      {/* Welcome & Live Clock-In Hero Banner */}
      <Card className="border-border bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white shadow-md overflow-hidden relative rounded-2xl">
        <div className="absolute right-0 top-0 w-96 h-full bg-white/5 skew-x-12 pointer-events-none" />
        <CardContent className="p-6 relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-blue-100 text-xs font-medium mb-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{todayFormatted}</span>
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-semibold uppercase tracking-wider">
                {formatRole(user?.role)}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Good day, {user?.name || "Team Member"}!
            </h1>
            <p className="text-blue-100 text-sm mt-1 max-w-md">
              {isEmployeeRole
                ? "Welcome to your PeoplePay360 self-service workspace. Track your daily hours, leave allowances, and payslips."
                : "Manage company payroll cycles, time off approvals, employee attendance, and your personal portal."}
            </p>
          </div>

          {/* Live Clock-In / Clock-Out Widget (Available to all logged in users) */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full md:w-auto shrink-0 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    punchState?.isClockedIn
                      ? punchState?.isOnBreak
                        ? "bg-amber-400 animate-pulse"
                        : "bg-emerald-400 animate-pulse"
                      : "bg-rose-400"
                  }`}
                />
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-100">
                  {punchState?.isClockedIn
                    ? punchState?.isOnBreak
                      ? "On Break"
                      : "Checked In"
                    : "Checked Out"}
                </span>
              </div>
              <p className="text-base font-mono font-bold mt-0.5">
                {punchState?.isClockedIn
                  ? `Since ${punchState?.clockInTime}`
                  : "Not Clocked In"}
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {punchState?.isClockedIn ? (
                <>
                  {punchState?.isOnBreak ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={punchLoading}
                      onClick={() => handlePunchAction("end-break")}
                      className="bg-white text-blue-900 hover:bg-white/90 text-xs gap-1.5 font-semibold"
                    >
                      <Play className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
                      Resume
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={punchLoading}
                      onClick={() => handlePunchAction("start-break")}
                      className="bg-white/20 hover:bg-white/30 text-white text-xs gap-1.5 border border-white/20"
                    >
                      <Coffee className="w-3.5 h-3.5 text-amber-300" />
                      Break
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={punchLoading}
                    onClick={() => handlePunchAction("clock-out")}
                    className="bg-rose-500/90 hover:bg-rose-600 text-white text-xs gap-1.5"
                  >
                    <Square className="w-3.5 h-3.5" />
                    Clock Out
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={punchLoading}
                  onClick={() => handlePunchAction("clock-in")}
                  className="bg-white text-blue-900 hover:bg-white/90 text-xs gap-1.5 font-bold shadow-xs"
                >
                  <Play className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
                  Clock In
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* HR / Payroll Manager Operations Metrics */}
      {!isEmployeeRole && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Operations & Payroll Overview
            </h3>
            <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
              Live Database Synchronization
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link to="/employees" className="block group">
              <Card className="border-border bg-card shadow-2xs group-hover:border-primary/40 transition">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Total Employees</p>
                    <p className="text-2xl font-bold text-foreground mt-1">
                      {managerMetrics.totalEmployees}
                    </p>
                    <p className="text-[11px] text-blue-600 dark:text-blue-400 mt-0.5">
                      Active staff roster
                    </p>
                  </div>
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 rounded-xl">
                    <Users className="w-6 h-6" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link to="/time-off/requests" className="block group">
              <Card className="border-border bg-card shadow-2xs group-hover:border-primary/40 transition">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Pending Leave Requests</p>
                    <p className="text-2xl font-bold text-foreground mt-1">
                      {managerMetrics.pendingLeaves}
                    </p>
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">
                      Requires manager review
                    </p>
                  </div>
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-600 rounded-xl">
                    <Calendar className="w-6 h-6" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link to="/payroll/payruns" className="block group">
              <Card className="border-border bg-card shadow-2xs group-hover:border-primary/40 transition">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Payrun Batches</p>
                    <p className="text-2xl font-bold text-foreground mt-1">
                      {managerMetrics.activePayruns}
                    </p>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                      Payroll cycles recorded
                    </p>
                  </div>
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-xl">
                    <DollarSign className="w-6 h-6" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      )}

      {/* Personal ESS Metrics Row */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Personal Workspace Summary
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-border bg-card shadow-2xs hover:border-primary/40 transition-colors">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">My Hours This Month</p>
                <p className="text-xl font-bold text-foreground mt-1">
                  {stats?.workedHoursThisMonth || "0h 00m"}
                </p>
                <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                  <TrendingUp className="w-3 h-3" />
                  <span>On schedule</span>
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                <Clock className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-2xs hover:border-primary/40 transition-colors">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">My Leave Balance</p>
                <p className="text-xl font-bold text-foreground mt-1">
                  {stats?.leaveDaysRemaining ?? 15}{" "}
                  <span className="text-xs font-normal text-muted-foreground">days</span>
                </p>
                <Link
                  to="/my-time-off"
                  className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 mt-0.5 font-medium"
                >
                  Apply Leave <ArrowRight className="w-2.5 h-2.5" />
                </Link>
              </div>
              <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                <Calendar className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-2xs hover:border-primary/40 transition-colors">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Attendance Regularity</p>
                <p className="text-xl font-bold text-foreground mt-1">
                  {stats?.attendanceRate || "100%"}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Target: &gt;95%</p>
              </div>
              <div className="p-2.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-2xs hover:border-primary/40 transition-colors">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Next Payday</p>
                <p className="text-xl font-bold text-foreground mt-1">
                  in {stats?.daysToPayday || 15}{" "}
                  <span className="text-xs font-normal text-muted-foreground">days</span>
                </p>
                <Link
                  to="/my-payslips"
                  className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 mt-0.5 font-medium"
                >
                  View My Payslips <ArrowRight className="w-2.5 h-2.5" />
                </Link>
              </div>
              <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                <DollarSign className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions Shortcuts */}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          size="sm"
          onClick={() => navigate("/my-time-off")}
          className="text-xs gap-1.5 shadow-2xs"
        >
          <Calendar className="w-3.5 h-3.5" />
          Request Time Off
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={() => navigate("/my-attendance")}
          className="text-xs gap-1.5"
        >
          <Clock className="w-3.5 h-3.5" />
          My Attendance Log
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={() => navigate("/my-payslips")}
          className="text-xs gap-1.5"
        >
          <FileText className="w-3.5 h-3.5" />
          My Payslips
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={() => navigate("/profile")}
          className="text-xs gap-1.5"
        >
          <User className="w-3.5 h-3.5" />
          My Profile
        </Button>

        {!isEmployeeRole && (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate("/payroll/payruns")}
              className="text-xs gap-1.5 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400"
            >
              <Layers className="w-3.5 h-3.5" />
              Manage Payruns
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate("/time-off/requests")}
              className="text-xs gap-1.5 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400"
            >
              <Check className="w-3.5 h-3.5" />
              Approve Leaves
            </Button>
          </>
        )}
      </div>

      {/* Main Content Grid: Attendance Log & Leaves + Holidays */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Attendance */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border bg-card shadow-xs">
            <CardHeader className="pb-3 border-b border-border/50 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                Recent Personal Attendance
              </CardTitle>
              <Link
                to="/my-attendance"
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                View full history
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                {recentAttendance && recentAttendance.length > 0 ? (
                  recentAttendance.map((att) => (
                    <div
                      key={att.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-muted flex flex-col items-center justify-center text-xs font-semibold shrink-0">
                          <span className="text-[10px] text-muted-foreground uppercase">
                            {new Date(att.date).toLocaleDateString("en-US", {
                              weekday: "short",
                            })}
                          </span>
                          <span className="text-foreground">
                            {new Date(att.date).getDate()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {new Date(att.date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            In: {att.checkIn} • Out: {att.checkOut}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 sm:justify-end">
                        <div className="text-right sm:block hidden">
                          <span className="text-xs font-semibold text-foreground block">
                            {att.workedHours}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            Break: {att.breakHours}
                          </span>
                        </div>
                        <StatusBadge status={att.status} />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-xs text-muted-foreground">
                    No personal punch records logged yet. Click "Clock In" to begin your shift.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Time Off Requests */}
          <Card className="border-border bg-card shadow-xs">
            <CardHeader className="pb-3 border-b border-border/50 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600" />
                My Leave Requests
              </CardTitle>
              <Link
                to="/my-time-off"
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                Manage Leaves
              </Link>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {recentLeaves && recentLeaves.length > 0 ? (
                recentLeaves.map((req) => (
                  <div
                    key={req.id}
                    className="p-3 rounded-lg border border-border/60 bg-muted/20 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">
                          {req.leaveType}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({req.days} {req.days === 1 ? "day" : "days"})
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {req.startDate} to {req.endDate} {req.reason ? `• ${req.reason}` : ""}
                      </p>
                    </div>
                    <StatusBadge status={req.status} />
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-muted-foreground">
                  No personal leave requests submitted.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Upcoming Holidays & Announcements */}
        <div className="space-y-6">
          <Card className="border-border bg-card shadow-xs">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <PartyPopper className="w-4 h-4 text-amber-500" />
                Upcoming Holidays
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3.5">
              {holidays?.map((h, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 flex flex-col items-center justify-center shrink-0 text-xs font-bold">
                    <span className="text-[9px] uppercase">
                      {new Date(h.date).toLocaleDateString("en-US", { month: "short" })}
                    </span>
                    <span>{new Date(h.date).getDate()}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{h.name}</p>
                    <p className="text-[11px] text-muted-foreground">{h.type || "Official Holiday"}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Info Card */}
          <Card className="border-border bg-blue-50/50 dark:bg-blue-950/20 border-blue-200/60 dark:border-blue-800 shadow-2xs">
            <CardContent className="p-4 space-y-2 text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-blue-900 dark:text-blue-300">
                <AlertCircle className="w-4 h-4 text-blue-600" />
                <span>Portal Live Sync Notice</span>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                All punch logs, leave quotas, and payslips are directly connected to the PostgreSQL database with real-time calculations.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Monthly Attendance Champions & Perks Section */}
      <div className="pt-4 border-t border-[#C3ACD0]/30">
        <AttendanceLeaderboard />
      </div>
    </div>
  );
}
