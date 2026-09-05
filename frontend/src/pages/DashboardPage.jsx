import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
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

/**
 * Framer Motion Stagger Animation Variants for Dashboard Cards
 */
const STAGGER_CONTAINER_VARIANTS = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.07,
    },
  },
};

const CARD_ANIMATION_VARIANTS = {
  hidden: {
    opacity: 0,
    y: 16,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.25,
      ease: "easeOut",
    },
  },
};

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

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
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
      <Card className="border-0 bg-gradient-to-r from-blue-600 via-sky-600 to-teal-600 text-white shadow-lg shadow-blue-500/15 overflow-hidden relative rounded-2xl">
        <div className="absolute right-0 top-0 w-96 h-full bg-white/10 skew-x-12 pointer-events-none" />
        <CardContent className="p-6 relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-sky-100 text-xs font-medium mb-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{todayFormatted}</span>
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-semibold uppercase tracking-wider">
                {formatRole(user?.role)}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Good day, {user?.name || "Team Member"}!
            </h1>
            <p className="text-sky-100/90 text-sm mt-1 max-w-md">
              {isEmployeeRole
                ? "Welcome to your PeoplePay360 self-service workspace. Track your daily hours, leave allowances, and payslips."
                : "Manage company payroll cycles, time off approvals, employee attendance, and your personal portal."}
            </p>
          </div>

          {/* Live Clock-In / Clock-Out Widget */}
          <div className="bg-white/15 backdrop-blur-md rounded-2xl p-4 border border-white/25 flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full md:w-auto shrink-0 shadow-sm">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    punchState?.isClockedIn
                      ? punchState?.isOnBreak
                        ? "bg-amber-300 animate-pulse"
                        : "bg-emerald-300 animate-pulse"
                      : "bg-rose-300"
                  }`}
                />
                <span className="text-xs font-semibold uppercase tracking-wider text-sky-100">
                  {punchState?.isClockedIn
                    ? punchState?.isOnBreak
                      ? "On Break"
                      : "Checked In"
                    : "Checked Out"}
                </span>
              </div>
              <p className="text-base font-mono font-bold mt-0.5 text-white">
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
                      className="bg-white text-blue-700 hover:bg-white/90 text-xs gap-1.5 font-semibold rounded-full shadow-sm"
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
                      className="bg-white/20 hover:bg-white/30 text-white text-xs gap-1.5 border border-white/30 rounded-full"
                    >
                      <Coffee className="w-3.5 h-3.5 text-amber-200" />
                      Break
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={punchLoading}
                    onClick={() => handlePunchAction("clock-out")}
                    className="bg-rose-500/90 hover:bg-rose-600 text-white text-xs gap-1.5 rounded-full"
                  >
                    <Square className="w-3.5 h-3.5" />
                    Clock Out
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  disabled={punchLoading}
                  onClick={() => handlePunchAction("clock-in")}
                  className="bg-white text-blue-700 hover:bg-white/90 text-xs gap-1.5 font-bold shadow-md rounded-full px-4"
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
            <span className="text-xs text-blue-600 font-semibold">
              Live Database Synchronization
            </span>
          </div>

          <motion.div
            variants={STAGGER_CONTAINER_VARIANTS}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            <motion.div variants={CARD_ANIMATION_VARIANTS}>
              <Link to="/employees" className="block group">
                <Card className="border border-slate-200/80 bg-white shadow-sm hover:shadow-md hover:border-slate-300 transition-all rounded-2xl">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-slate-500">Total Employees</p>
                      <p className="text-2xl font-bold text-slate-800 mt-1">
                        {managerMetrics.totalEmployees}
                      </p>
                      <p className="text-[11px] text-sky-600 mt-0.5">
                        Active staff roster
                      </p>
                    </div>
                    <div className="p-3 bg-sky-100/80 text-sky-600 rounded-2xl">
                      <Users className="w-6 h-6" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>

            <motion.div variants={CARD_ANIMATION_VARIANTS}>
              <Link to="/time-off/requests" className="block group">
                <Card className="border border-slate-200/80 bg-white shadow-sm hover:shadow-md hover:border-slate-300 transition-all rounded-2xl">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-slate-500">Pending Leave Requests</p>
                      <p className="text-2xl font-bold text-slate-800 mt-1">
                        {managerMetrics.pendingLeaves}
                      </p>
                      <p className="text-[11px] text-amber-600 mt-0.5">
                        Requires manager review
                      </p>
                    </div>
                    <div className="p-3 bg-amber-100/80 text-amber-600 rounded-2xl">
                      <Calendar className="w-6 h-6" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>

            <motion.div variants={CARD_ANIMATION_VARIANTS}>
              <Link to="/payroll/payruns" className="block group">
                <Card className="border border-slate-200/80 bg-white shadow-sm hover:shadow-md hover:border-slate-300 transition-all rounded-2xl">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-slate-500">Payrun Batches</p>
                      <p className="text-2xl font-bold text-slate-800 mt-1">
                        {managerMetrics.activePayruns}
                      </p>
                      <p className="text-[11px] text-emerald-600 mt-0.5">
                        Payroll cycles recorded
                      </p>
                    </div>
                    <div className="p-3 bg-emerald-100/80 text-emerald-600 rounded-2xl">
                      <DollarSign className="w-6 h-6" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      )}

      {/* Personal ESS Metrics Row */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Personal Workspace Summary
        </h3>

        <motion.div
          variants={STAGGER_CONTAINER_VARIANTS}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <motion.div variants={CARD_ANIMATION_VARIANTS}>
            <Card className="border border-slate-200/80 bg-white shadow-sm hover:shadow-md hover:border-slate-300 transition-all rounded-2xl">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500">My Hours This Month</p>
                  <p className="text-xl font-bold text-slate-800 mt-1">
                    {stats?.workedHoursThisMonth || "0h 00m"}
                  </p>
                  <div className="flex items-center gap-1 text-[11px] text-emerald-600 mt-0.5">
                    <TrendingUp className="w-3 h-3" />
                    <span>On schedule</span>
                  </div>
                </div>
                <div className="p-2.5 rounded-2xl bg-sky-100/80 text-sky-600">
                  <Clock className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={CARD_ANIMATION_VARIANTS}>
            <Card className="border border-slate-200/80 bg-white shadow-sm hover:shadow-md hover:border-slate-300 transition-all rounded-2xl">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500">My Leave Balance</p>
                  <p className="text-xl font-bold text-slate-800 mt-1">
                    {stats?.leaveDaysRemaining ?? 15}{" "}
                    <span className="text-xs font-normal text-slate-400">days</span>
                  </p>
                  <Link
                    to="/my-time-off"
                    className="text-[11px] text-blue-600 hover:underline flex items-center gap-0.5 mt-0.5 font-semibold"
                  >
                    Apply Leave <ArrowRight className="w-2.5 h-2.5" />
                  </Link>
                </div>
                <div className="p-2.5 rounded-2xl bg-emerald-100/80 text-emerald-600">
                  <Calendar className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={CARD_ANIMATION_VARIANTS}>
            <Card className="border border-slate-200/80 bg-white shadow-sm hover:shadow-md hover:border-slate-300 transition-all rounded-2xl">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500">Attendance Regularity</p>
                  <p className="text-xl font-bold text-slate-800 mt-1">
                    {stats?.attendanceRate || "100%"}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Target: &gt;95%</p>
                </div>
                <div className="p-2.5 rounded-2xl bg-purple-100/80 text-purple-600">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={CARD_ANIMATION_VARIANTS}>
            <Card className="border border-slate-200/80 bg-white shadow-sm hover:shadow-md hover:border-slate-300 transition-all rounded-2xl">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500">Next Payday</p>
                  <p className="text-xl font-bold text-slate-800 mt-1">
                    in {stats?.daysToPayday || 15}{" "}
                    <span className="text-xs font-normal text-slate-400">days</span>
                  </p>
                  <Link
                    to="/my-payslips"
                    className="text-[11px] text-blue-600 hover:underline flex items-center gap-0.5 mt-0.5 font-semibold"
                  >
                    View My Payslips <ArrowRight className="w-2.5 h-2.5" />
                  </Link>
                </div>
                <div className="p-2.5 rounded-2xl bg-amber-100/80 text-amber-600">
                  <DollarSign className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>

      {/* Quick Actions Shortcuts */}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          size="sm"
          onClick={() => navigate("/my-time-off")}
          className="text-xs gap-1.5 bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white rounded-full font-semibold shadow-md shadow-teal-500/20 border-0 px-4 py-2"
        >
          <Calendar className="w-3.5 h-3.5" />
          Request Time Off
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={() => navigate("/my-attendance")}
          className="text-xs gap-1.5 bg-white border-slate-200 text-slate-700 hover:bg-slate-50 rounded-full"
        >
          <Clock className="w-3.5 h-3.5" />
          My Attendance Log
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={() => navigate("/my-payslips")}
          className="text-xs gap-1.5 bg-white border-slate-200 text-slate-700 hover:bg-slate-50 rounded-full"
        >
          <FileText className="w-3.5 h-3.5" />
          My Payslips
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={() => navigate("/profile")}
          className="text-xs gap-1.5 bg-white border-slate-200 text-slate-700 hover:bg-slate-50 rounded-full"
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
              className="text-xs gap-1.5 border-blue-200 text-blue-700 hover:bg-blue-50 bg-white rounded-full"
            >
              <Layers className="w-3.5 h-3.5" />
              Manage Payruns
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate("/time-off/requests")}
              className="text-xs gap-1.5 border-amber-200 text-amber-700 hover:bg-amber-50 bg-white rounded-full"
            >
              <Check className="w-3.5 h-3.5" />
              Approve Leaves
            </Button>
          </>
        )}
      </div>

      {/* Main Content Grid: Attendance Log & Leaves + Holidays */}
      <motion.div
        variants={STAGGER_CONTAINER_VARIANTS}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* Left 2 Cols: Recent Attendance */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div variants={CARD_ANIMATION_VARIANTS}>
            <Card className="border border-slate-200/80 bg-white shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between bg-slate-50/50">
                <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  Recent Personal Attendance
                </CardTitle>
                <Link
                  to="/my-attendance"
                  className="text-xs text-blue-600 hover:underline font-semibold"
                >
                  View full history
                </Link>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100">
                  {recentAttendance && recentAttendance.length > 0 ? (
                    recentAttendance.map((att) => (
                      <div
                        key={att.id}
                        className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 flex flex-col items-center justify-center text-xs font-semibold shrink-0">
                            <span className="text-[10px] text-slate-400 uppercase">
                              {new Date(att.date).toLocaleDateString("en-US", {
                                weekday: "short",
                              })}
                            </span>
                            <span className="text-slate-700">
                              {new Date(att.date).getDate()}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-800">
                              {new Date(att.date).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </p>
                            <p className="text-xs text-slate-400">
                              In: {att.checkIn} • Out: {att.checkOut}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 sm:justify-end">
                          <div className="text-right sm:block hidden">
                            <span className="text-xs font-semibold text-slate-700 block">
                              {att.workedHours}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              Break: {att.breakHours}
                            </span>
                          </div>
                          <StatusBadge status={att.status} />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-xs text-slate-400">
                      No personal punch records logged yet. Click "Clock In" to begin your shift.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Time Off Requests */}
          <motion.div variants={CARD_ANIMATION_VARIANTS}>
            <Card className="border border-slate-200/80 bg-white shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between bg-slate-50/50">
                <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  My Leave Requests
                </CardTitle>
                <Link
                  to="/my-time-off"
                  className="text-xs text-blue-600 hover:underline font-semibold"
                >
                  Manage Leaves
                </Link>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {recentLeaves && recentLeaves.length > 0 ? (
                  recentLeaves.map((req) => (
                    <div
                      key={req.id}
                      className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-800">
                            {req.leaveType}
                          </span>
                          <span className="text-xs text-slate-400">
                            ({req.days} {req.days === 1 ? "day" : "days"})
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {req.startDate} to {req.endDate} {req.reason ? `• ${req.reason}` : ""}
                        </p>
                      </div>
                      <StatusBadge status={req.status} />
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-xs text-slate-400">
                    No personal leave requests submitted.
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Right Column: Upcoming Holidays & Announcements */}
        <div className="space-y-6">
          <motion.div variants={CARD_ANIMATION_VARIANTS}>
            <Card className="border border-slate-200/80 bg-white shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
                <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                  <PartyPopper className="w-4 h-4 text-amber-500" />
                  Upcoming Holidays
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3.5">
                {holidays?.map((h, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-100/80 text-amber-700 flex flex-col items-center justify-center shrink-0 text-xs font-bold">
                      <span className="text-[9px] uppercase">
                        {new Date(h.date).toLocaleDateString("en-US", { month: "short" })}
                      </span>
                      <span>{new Date(h.date).getDate()}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">{h.name}</p>
                      <p className="text-[11px] text-slate-400">{h.type || "Official Holiday"}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Info Card */}
          <motion.div variants={CARD_ANIMATION_VARIANTS}>
            <Card className="border border-blue-200/80 bg-blue-50/50 shadow-sm rounded-2xl">
              <CardContent className="p-4 space-y-2 text-xs">
                <div className="flex items-center gap-1.5 font-semibold text-blue-900">
                  <AlertCircle className="w-4 h-4 text-blue-600" />
                  <span>Portal Live Sync Notice</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  All punch logs, leave quotas, and payslips are directly connected to the PostgreSQL database with real-time calculations.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
