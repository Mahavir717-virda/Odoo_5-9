import { useState, useEffect, useMemo } from "react";
import {
  Clock,
  Plus,
  Calendar,
  User,
  Building2,
  CheckCircle2,
  AlertCircle,
  X,
  Pencil,
  Trash2,
  TrendingUp,
} from "lucide-react";

import PageHeader from "../../components/common/PageHeader";
import FilterBar from "../../components/common/FilterBar";
import DataTable from "../../components/common/DataTable";
import StatusBadge from "../../components/common/StatusBadge";
import FormField from "../../components/common/FormField";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";

import * as managerAttendanceService from "../../services/managerAttendanceService";
import * as employeeService from "../../services/employeeService";

const STATUS_OPTIONS = [
  { value: "present", label: "Present" },
  { value: "late", label: "Late" },
  { value: "half_day", label: "Half Day" },
  { value: "absent", label: "Absent" },
  { value: "leave", label: "On Leave" },
];

const DEPARTMENT_OPTIONS = [
  { value: "Engineering", label: "Engineering" },
  { value: "HR", label: "Human Resources" },
  { value: "Finance", label: "Finance" },
  { value: "Sales", label: "Sales" },
  { value: "Marketing", label: "Marketing" },
];

export default function AttendancePage() {
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [toastMessage, setToastMessage] = useState("");

  // Form Fields
  const [selectedEmpId, setSelectedEmpId] = useState("");
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split("T")[0]);
  const [checkInTime, setCheckInTime] = useState("09:00");
  const [checkOutTime, setCheckOutTime] = useState("17:30");
  const [recordStatus, setRecordStatus] = useState("present");

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [attRes, empRes] = await Promise.all([
        managerAttendanceService.listAttendance({
          status: statusFilter,
          department: departmentFilter,
          date: dateFilter || undefined,
          limit: 100,
        }),
        employeeService.getEmployees().catch(() => []),
      ]);

      setRecords(attRes.data || []);
      setEmployees(empRes || []);
    } catch (err) {
      setError(err.message || "Failed to load attendance records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, departmentFilter, dateFilter]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  const handleOpenCreateModal = () => {
    setEditingRecord(null);
    setSelectedEmpId(employees.length > 0 ? String(employees[0].id) : "");
    setAttendanceDate(new Date().toISOString().split("T")[0]);
    setCheckInTime("09:00");
    setCheckOutTime("17:30");
    setRecordStatus("present");
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (record) => {
    setEditingRecord(record);
    setSelectedEmpId(String(record.employee_id));
    setAttendanceDate(record.attendance_date ? record.attendance_date.split("T")[0] : record.date);
    setCheckInTime(record.check_in ? new Date(record.check_in).toTimeString().slice(0, 5) : "09:00");
    setCheckOutTime(record.check_out ? new Date(record.check_out).toTimeString().slice(0, 5) : "17:30");
    setRecordStatus((record.status || "present").toLowerCase());
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedEmpId) {
      setFormError("Please select an employee.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        employee_id: selectedEmpId,
        attendance_date: attendanceDate,
        check_in: checkInTime ? `${attendanceDate}T${checkInTime}:00` : null,
        check_out: checkOutTime ? `${attendanceDate}T${checkOutTime}:00` : null,
        status: recordStatus,
      };

      if (editingRecord) {
        await managerAttendanceService.updateAttendance(editingRecord.id, payload);
        showToast("Attendance record updated successfully.");
      } else {
        await managerAttendanceService.createAttendance(payload);
        showToast("Attendance record created successfully.");
      }

      setIsModalOpen(false);
      loadData();
    } catch (err) {
      setFormError(err.message || "Failed to save attendance record.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this attendance log?")) return;
    try {
      await managerAttendanceService.deleteAttendance(id);
      showToast("Attendance log deleted.");
      loadData();
    } catch (err) {
      alert(err.message || "Failed to delete log");
    }
  };

  // Filtered rows for client search
  const filteredRecords = useMemo(() => {
    if (!search.trim()) return records;
    const q = search.trim().toLowerCase();
    return records.filter(
      (r) =>
        (r.employee_name || "").toLowerCase().includes(q) ||
        (r.department || "").toLowerCase().includes(q)
    );
  }, [records, search]);

  // KPI Metrics
  const stats = useMemo(() => {
    let present = 0;
    let late = 0;
    let halfDay = 0;
    let absent = 0;
    records.forEach((r) => {
      const s = (r.status || "").toLowerCase();
      if (s === "present") present++;
      else if (s === "late") late++;
      else if (s === "half_day") halfDay++;
      else if (s === "absent") absent++;
    });
    return {
      total: records.length,
      present,
      late,
      halfDay,
      absent,
    };
  }, [records]);

  const columns = useMemo(
    () => [
      {
        key: "date",
        header: "Date",
        sortable: true,
        render: (row) => (
          <div className="flex items-center gap-2 font-medium text-foreground">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
            <span>
              {new Date(row.attendance_date || row.date).toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
        ),
      },
      {
        key: "employee_name",
        header: "Employee",
        sortable: true,
        render: (row) => (
          <div>
            <span className="font-semibold text-xs text-foreground block">
              {row.employee_name || `Employee #${row.employee_id}`}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {row.department || "General"}
            </span>
          </div>
        ),
      },
      {
        key: "check_in",
        header: "Check In",
        sortable: true,
        render: (row) => (
          <span className="text-xs font-mono">
            {row.check_in
              ? new Date(row.check_in).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
              : "—"}
          </span>
        ),
      },
      {
        key: "check_out",
        header: "Check Out",
        sortable: true,
        render: (row) => (
          <span className="text-xs font-mono text-muted-foreground">
            {row.check_out
              ? new Date(row.check_out).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
              : "—"}
          </span>
        ),
      },
      {
        key: "worked_hours",
        header: "Worked Hours",
        sortable: true,
        render: (row) => (
          <span className="text-xs font-mono font-medium">
            {row.worked_hours !== null && row.worked_hours !== undefined
              ? `${Number(row.worked_hours).toFixed(1)}h`
              : "—"}
          </span>
        ),
      },
      {
        key: "status",
        header: "Status",
        sortable: true,
        render: (row) => <StatusBadge status={row.status} />,
      },
      {
        key: "actions",
        header: "Actions",
        width: "120px",
        render: (row) => (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleOpenEditModal(row)}
              className="h-7 w-7 p-0"
              title="Edit Log"
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(row.id)}
              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
              title="Delete Log"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto">
      <PageHeader
        title="Attendance Management"
        subtitle="Review real-time employee check-ins, worked hours, and manage attendance logs."
        actions={
          <Button onClick={handleOpenCreateModal} size="sm" className="gap-1.5 shadow-xs">
            <Plus className="w-4 h-4" />
            Record Attendance
          </Button>
        }
      />

      {toastMessage && (
        <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 flex items-center gap-2.5 text-xs font-medium animate-in fade-in-50">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-border bg-card shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Total Logs</p>
              <p className="text-2xl font-bold text-foreground mt-0.5">{stats.total}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Present Today</p>
              <p className="text-2xl font-bold text-emerald-600 mt-0.5">{stats.present}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Late Arrivals</p>
              <p className="text-2xl font-bold text-amber-600 mt-0.5">{stats.late}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Absences</p>
              <p className="text-2xl font-bold text-rose-600 mt-0.5">{stats.absent}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600">
              <AlertCircle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by employee name or department..."
        filters={[
          {
            key: "status",
            label: "Status",
            value: statusFilter,
            options: STATUS_OPTIONS,
            onChange: setStatusFilter,
          },
          {
            key: "department",
            label: "Department",
            value: departmentFilter,
            options: DEPARTMENT_OPTIONS,
            onChange: setDepartmentFilter,
          },
        ]}
        onClearAll={() => {
          setSearch("");
          setStatusFilter("all");
          setDepartmentFilter("all");
          setDateFilter("");
        }}
      />

      {/* Attendance Table */}
      <DataTable
        columns={columns}
        data={filteredRecords}
        loading={loading}
        error={error}
        onRetry={loadData}
        emptyState={{
          icon: Clock,
          title: "No Attendance Logs Found",
          description: "No employee attendance records match your active search filters.",
          actionLabel: "Record Attendance",
          onAction: handleOpenCreateModal,
        }}
        pageSize={15}
      />

      {/* Create / Edit Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="w-full max-w-lg border-border bg-card shadow-xl animate-in zoom-in-95">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                {editingRecord ? "Edit Attendance Record" : "Record Employee Attendance"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <CardContent className="p-6 space-y-4">
                {formError && (
                  <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <FormField label="Employee" required>
                  <Select
                    value={selectedEmpId}
                    onValueChange={setSelectedEmpId}
                    disabled={Boolean(editingRecord)}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((emp) => (
                        <SelectItem key={emp.id} value={String(emp.id)} className="text-xs">
                          {emp.name || `${emp.firstName} ${emp.lastName}`} • {emp.department}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>

                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Attendance Date" required>
                    <Input
                      type="date"
                      value={attendanceDate}
                      onChange={(e) => setAttendanceDate(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </FormField>

                  <FormField label="Status" required>
                    <Select value={recordStatus} onValueChange={setRecordStatus}>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value} className="text-xs">
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Check-In Time">
                    <Input
                      type="time"
                      value={checkInTime}
                      onChange={(e) => setCheckInTime(e.target.value)}
                      className="h-9 text-xs font-mono"
                    />
                  </FormField>

                  <FormField label="Check-Out Time">
                    <Input
                      type="time"
                      value={checkOutTime}
                      onChange={(e) => setCheckOutTime(e.target.value)}
                      className="h-9 text-xs font-mono"
                    />
                  </FormField>
                </div>
              </CardContent>

              <div className="p-4 border-t border-border flex items-center justify-end gap-2 bg-muted/20">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={submitting} className="text-xs">
                  {submitting ? "Saving..." : editingRecord ? "Update Log" : "Create Log"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
