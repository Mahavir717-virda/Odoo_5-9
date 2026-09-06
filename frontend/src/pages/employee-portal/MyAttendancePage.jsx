import { useState, useEffect, useMemo } from "react";
import {
  Clock,
  Play,
  Square,
  Coffee,
  CheckCircle2,
  Calendar,
  TrendingUp,
  AlertTriangle,
  History,
  Trophy,
} from "lucide-react";

import PageHeader from "../../components/common/PageHeader";
import FilterBar from "../../components/common/FilterBar";
import DataTable from "../../components/common/DataTable";
import StatusBadge from "../../components/common/StatusBadge";
import AttendanceLeaderboard from "../../components/attendance/AttendanceLeaderboard";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";

import * as portalService from "../../services/employeePortalService";

const STATUS_OPTIONS = [
  { value: "Present", label: "Present" },
  { value: "Late", label: "Late" },
  { value: "Half Day", label: "Half Day" },
  { value: "Absent", label: "Absent" },
];

const MONTH_OPTIONS = [
  { value: "2026-09", label: "September 2026 (Current)" },
  { value: "2026-08", label: "August 2026" },
  { value: "2026-07", label: "July 2026" },
  { value: "all", label: "All Months (Overall)" },
];

export default function MyAttendancePage() {
  const [activeTab, setActiveTab] = useState("my-logs"); // "my-logs" | "leaderboard"
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [punchLoading, setPunchLoading] = useState(false);

  // Filters - Default to current active month so summary matches monthly leaderboard
  const [statusFilter, setStatusFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("2026-09");

  const fetchAttendance = () => {
    setLoading(true);
    setError(null);
    portalService
      .getMyAttendance({ status: statusFilter, month: monthFilter })
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load attendance logs.");
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAttendance();
  }, [statusFilter, monthFilter]);

  // Handle live punch in/out
  const handlePunch = async (action) => {
    setPunchLoading(true);
    try {
      const updatedPunch = await portalService.recordClockInOut(action);
      setData((prev) => ({
        ...prev,
        punchState: updatedPunch,
      }));
      fetchAttendance();
    } catch (err) {
      console.error("Punch action error:", err);
      alert(err.response?.data?.message || err.message || "Failed to complete punch action.");
    } finally {
      setPunchLoading(false);
    }
  };

  const { punchState, records = [], monthlySummary } = data || {};

  // Table Columns
  const columns = useMemo(
    () => [
      {
        key: "date",
        header: "Date",
        sortable: true,
        render: (row) => {
          if (!row.date) return "—";
          const dateStr = String(row.date).includes("T") ? row.date : `${row.date}T00:00:00`;
          const d = new Date(dateStr);
          return (
            <div className="flex items-center gap-2 font-medium text-foreground">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
              <span>
                {isNaN(d.getTime())
                  ? row.date
                  : d.toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
              </span>
            </div>
          );
        },
      },
      {
        key: "checkIn",
        header: "Check In",
        sortable: true,
        render: (row) => (
          <span className="font-mono text-xs text-foreground">
            {row.checkIn}
          </span>
        ),
      },
      {
        key: "checkOut",
        header: "Check Out",
        sortable: true,
        render: (row) => (
          <span className="font-mono text-xs text-foreground">
            {row.checkOut}
          </span>
        ),
      },
      {
        key: "workedHours",
        header: "Worked Hours",
        sortable: true,
        render: (row) => (
          <span className="font-semibold text-xs text-foreground">
            {row.workedHours}
          </span>
        ),
      },
      {
        key: "breakHours",
        header: "Break Duration",
        sortable: true,
        render: (row) => (
          <span className="text-xs text-muted-foreground">
            {row.breakHours}
          </span>
        ),
      },
      {
        key: "overtime",
        header: "Overtime",
        sortable: true,
        render: (row) => (
          <span className="text-xs text-muted-foreground">
            {row.overtime}
          </span>
        ),
      },
      {
        key: "status",
        header: "Status",
        sortable: true,
        render: (row) => <StatusBadge status={row.status} />,
      },
    ],
    []
  );

  return (
    <div className="space-y-6 pb-16 max-w-6xl mx-auto">
      <PageHeader
        title="My Attendance"
        subtitle="Track your daily punch logs, working hours, and see where you rank on the company perks ladder."
      />

      {/* Tab Switcher */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 w-fit">
        <button
          onClick={() => setActiveTab("my-logs")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "my-logs"
              ? "bg-white text-teal-800 shadow-xs border border-slate-200"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Clock className="w-4 h-4 text-teal-700" />
          My Punch Logs & Shifts
        </button>

        <button
          onClick={() => setActiveTab("leaderboard")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "leaderboard"
              ? "bg-white text-teal-800 shadow-xs border border-slate-200"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Trophy className="w-4 h-4 text-amber-500" />
          Company Leaderboard & Perks
        </button>
      </div>

      {activeTab === "leaderboard" ? (
        <AttendanceLeaderboard />
      ) : (
        <>
          {/* Clock In / Out Interactive Hub */}
          <Card className="border-slate-800 bg-slate-900 text-white shadow-sm overflow-hidden">
        <CardContent className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-teal-400 shrink-0">
              <Clock className="w-6 h-6" />
            </div>
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
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  {punchState?.isClockedIn
                    ? punchState?.isOnBreak
                      ? "On Break"
                      : "Currently Clocked In"
                    : "Currently Clocked Out"}
                </span>
              </div>
              <h2 className="text-xl font-bold mt-1">
                {punchState?.isClockedIn
                  ? `Shift Started: ${punchState?.clockInTime}`
                  : "Ready to Start Today's Shift"}
              </h2>
              {punchState?.lastShiftText && (
                <p className="text-xs text-slate-300 mt-1 flex items-center gap-1.5 font-mono">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-teal-400" />
                  {punchState.lastShiftText}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {punchState?.isClockedIn ? (
              <>
                {punchState?.isOnBreak ? (
                  <Button
                    size="sm"
                    disabled={punchLoading}
                    onClick={() => handlePunch("end-break")}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    End Break & Resume
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={punchLoading}
                    onClick={() => handlePunch("start-break")}
                    className="bg-white/10 hover:bg-white/20 text-white text-xs gap-1.5 border border-white/20"
                  >
                    <Coffee className="w-3.5 h-3.5 text-amber-300" />
                    Take Break
                  </Button>
                )}

                <Button
                  size="sm"
                  disabled={punchLoading}
                  onClick={() => handlePunch("clock-out")}
                  className="bg-rose-600 hover:bg-rose-700 text-white text-xs gap-1.5"
                >
                  <Square className="w-3.5 h-3.5" />
                  Clock Out
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                disabled={punchLoading}
                onClick={() => handlePunch("clock-in")}
                className="bg-teal-700 hover:bg-teal-800 text-white text-xs gap-1.5 font-semibold shadow-sm px-5 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                Clock In Now
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Monthly Summary Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border bg-card shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Total Hours</p>
              <p className="text-xl font-bold text-foreground mt-1">
                {monthlySummary?.totalHours || "0h 00m"}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Avg: {monthlySummary?.averageDailyHours || "0h"}/day
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-teal-50 text-teal-700">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Days Present</p>
              <p className="text-xl font-bold text-foreground mt-1">
                {monthlySummary?.presentDays ?? 0}{" "}
                <span className="text-xs font-normal text-muted-foreground">/ {monthlySummary?.totalDays ?? 0} total</span>
              </p>
              <div className="flex items-center gap-1 text-[11px] text-emerald-600 mt-0.5">
                <CheckCircle2 className="w-3 h-3" />
                <span>{monthlySummary?.totalDays > 0 ? Math.round(((monthlySummary.presentDays + (monthlySummary.lateDays || 0)) / monthlySummary.totalDays) * 100) : 0}% Attendance</span>
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
              <Calendar className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Late Arrivals</p>
              <p className="text-xl font-bold text-foreground mt-1">
                {monthlySummary?.lateDays ?? 0}
              </p>
              <p className="text-[11px] text-amber-600 mt-0.5">
                Within acceptable threshold
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Overtime Hours</p>
              <p className="text-xl font-bold text-foreground mt-1">
                {monthlySummary?.overtimeHours || "0h 00m"}
              </p>
              <p className="text-[11px] text-teal-700 mt-0.5 font-medium">
                Compensable
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-teal-50 text-teal-700">
              <TrendingUp className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Row */}
      <FilterBar
        filters={[
          {
            key: "month",
            label: "Month",
            options: MONTH_OPTIONS,
            value: monthFilter,
            onChange: setMonthFilter,
          },
          {
            key: "status",
            label: "Status",
            options: STATUS_OPTIONS,
            value: statusFilter,
            onChange: setStatusFilter,
          },
        ]}
        onClearAll={() => {
          setMonthFilter("all");
          setStatusFilter("all");
        }}
      />

      {/* Attendance History Table */}
      <DataTable
        columns={columns}
        data={records}
        loading={loading}
        error={error}
        onRetry={fetchAttendance}
        emptyState={{
          icon: History,
          title: "No Attendance Records",
          description: "No punch logs found for the selected filter criteria.",
        }}
        pageSize={10}
      />
        </>
      )}
    </div>
  );
}

