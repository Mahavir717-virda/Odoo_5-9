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
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Skeleton } from "../components/ui/skeleton";
import StatusBadge from "../components/common/StatusBadge";
import * as portalService from "../services/employeePortalService";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEmployeeRole = user?.role === "EMPLOYEE";

  // Employee Portal Data State
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [punchLoading, setPunchLoading] = useState(false);

  useEffect(() => {
    if (isEmployeeRole) {
      portalService
        .getEmployeeDashboardData()
        .then((data) => {
          setDashboardData(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Failed to load dashboard data:", err);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [isEmployeeRole]);

  // Handle Punch In / Out / Break actions
  const handlePunchAction = async (action) => {
    setPunchLoading(true);
    try {
      const updatedPunch = await portalService.recordClockInOut(action);
      setDashboardData((prev) => ({
        ...prev,
        punchState: updatedPunch,
      }));
    } catch (err) {
      console.error("Punch action error:", err);
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

  // -------------------------------------------------------------
  // 1. EMPLOYEE SELF-SERVICE (ESS) DASHBOARD VIEW
  // -------------------------------------------------------------
  if (isEmployeeRole) {
    if (loading) {
      return (
        <div className="space-y-6 pb-12 max-w-6xl mx-auto">
          <Skeleton className="h-28 w-full rounded-xl" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-72 lg:col-span-2 rounded-xl" />
            <Skeleton className="h-72 rounded-xl" />
          </div>
        </div>
      );
    }

    const { punchState, stats, recentAttendance, recentLeaves, holidays } =
      dashboardData || {};

    return (
      <div className="space-y-6 pb-12 max-w-6xl mx-auto">
        {/* Welcome & Clock-In Hero Banner */}
        <Card className="border-border bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white shadow-md overflow-hidden relative">
          <div className="absolute right-0 top-0 w-96 h-full bg-white/5 skew-x-12 pointer-events-none" />
          <CardContent className="p-6 relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-blue-100 text-xs font-medium mb-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{todayFormatted}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Good day, {user?.name || "Employee"}!
              </h1>
              <p className="text-blue-100 text-sm mt-1 max-w-md">
                Welcome to your PeoplePay360 self-service workspace. Track your daily hours, leave allowances, and payslips.
              </p>
            </div>

            {/* Live Clock-In / Clock-Out Widget */}
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
                <p className="text-lg font-mono font-bold mt-0.5">
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
                        <Play className="w-3.5 h-3.5 text-emerald-600" />
                        Resume Work
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
                        Take Break
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
                    Clock In Now
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 4 Key Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-border bg-card shadow-2xs hover:border-primary/40 transition-colors">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Hours This Month
                </p>
                <p className="text-xl font-bold text-foreground mt-1">
                  {stats?.workedHoursThisMonth}
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
                <p className="text-xs font-medium text-muted-foreground">
                  Leave Balance
                </p>
                <p className="text-xl font-bold text-foreground mt-1">
                  {stats?.leaveDaysRemaining}{" "}
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
                <p className="text-xs font-medium text-muted-foreground">
                  Attendance Regularity
                </p>
                <p className="text-xl font-bold text-foreground mt-1">
                  {stats?.attendanceRate}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Target: &gt;95%
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-2xs hover:border-primary/40 transition-colors">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Next Payday
                </p>
                <p className="text-xl font-bold text-foreground mt-1">
                  in {stats?.daysToPayday}{" "}
                  <span className="text-xs font-normal text-muted-foreground">days</span>
                </p>
                <Link
                  to="/my-payslips"
                  className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 mt-0.5 font-medium"
                >
                  View Payslips <ArrowRight className="w-2.5 h-2.5" />
                </Link>
              </div>
              <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                <DollarSign className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
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
            View Attendance Log
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate("/my-payslips")}
            className="text-xs gap-1.5"
          >
            <FileText className="w-3.5 h-3.5" />
            Download Payslip
          </Button>
        </div>

        {/* Main Content Grid: Attendance Log & Leaves + Holidays */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Recent Attendance */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-border bg-card shadow-xs">
              <CardHeader className="pb-3 border-b border-border/50 flex flex-row items-center justify-between">
                <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  Recent Attendance Records
                </CardTitle>
                <Link
                  to="/my-attendance"
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  View all
                </Link>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border/50">
                  {recentAttendance?.map((att) => (
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
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Time Off Requests */}
            <Card className="border-border bg-card shadow-xs">
              <CardHeader className="pb-3 border-b border-border/50 flex flex-row items-center justify-between">
                <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  Recent Leave Requests
                </CardTitle>
                <Link
                  to="/my-time-off"
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  Manage Leaves
                </Link>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {recentLeaves?.map((req) => (
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
                          ({req.daysCount} {req.daysCount === 1 ? "day" : "days"})
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {req.startDate} to {req.endDate} • {req.reason}
                      </p>
                    </div>
                    <StatusBadge status={req.status} />
                  </div>
                ))}
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
                      <p className="text-xs font-semibold text-foreground truncate">
                        {h.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {h.day} • Mandatory Holiday
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Policy Reminder Card */}
            <Card className="border-border bg-blue-50/50 dark:bg-blue-950/20 border-blue-200/60 dark:border-blue-800 shadow-2xs">
              <CardContent className="p-4 space-y-2 text-xs">
                <div className="flex items-center gap-1.5 font-semibold text-blue-900 dark:text-blue-300">
                  <AlertCircle className="w-4 h-4 text-blue-600" />
                  <span>Time Off Policy Reminder</span>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Please submit planned annual leave requests at least 3 business days in advance to ensure smooth team coordination.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 2. HR / ADMIN / MANAGER VIEW (For non-employee roles)
  // -------------------------------------------------------------
  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Welcome Card */}
      <div className="bg-card rounded-xl shadow-xs border border-border p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Welcome back, {user?.name || "Administrator"}!
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            PeoplePay360 HR & Payroll Management Dashboard
          </p>
        </div>
      </div>

      {/* User Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-border p-5 flex items-center gap-4 shadow-2xs">
          <div className="p-3 bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 rounded-lg">
            <User className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Full Name</p>
            <p className="text-base font-semibold text-foreground">{user?.name || "N/A"}</p>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-5 flex items-center gap-4 shadow-2xs">
          <div className="p-3 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 rounded-lg">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Email Address</p>
            <p className="text-base font-semibold text-foreground truncate">{user?.email || "N/A"}</p>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-5 flex items-center gap-4 shadow-2xs">
          <div className="p-3 bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400 rounded-lg">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Assigned Role</p>
            <span className="inline-block mt-0.5 px-2.5 py-0.5 text-xs font-semibold bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 rounded-full">
              {formatRole(user?.role)}
            </span>
          </div>
        </div>
      </div>

      {/* Action Links */}
      <div className="bg-card rounded-xl border border-border p-6 shadow-xs">
        <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wider">
          Management Modules
        </h3>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/employees")}
            className="text-xs gap-1.5"
          >
            Manage Employees
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/contracts")}
            className="text-xs gap-1.5"
          >
            View Contracts
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/profile")}
            className="text-xs gap-1.5"
          >
            My Profile
          </Button>
        </div>
      </div>
    </div>
  );
}
