import { useState, useEffect, useMemo } from "react";
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  AlertCircle,
  X,
  Send,
  UserCheck,
} from "lucide-react";

import PageHeader from "../../components/common/PageHeader";
import FilterBar from "../../components/common/FilterBar";
import DataTable from "../../components/common/DataTable";
import StatusBadge from "../../components/common/StatusBadge";
import FormField from "../../components/common/FormField";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";

import * as managerTimeOffService from "../../services/managerTimeOffService";
import * as employeeService from "../../services/employeeService";

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending Review" },
  { value: "approved", label: "Approved" },
  { value: "refused", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
];

export default function TimeOffRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [types, setTypes] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Rejection Dialog State
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  // Create Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [toastMessage, setToastMessage] = useState("");

  // Create Form Fields
  const [selectedEmpId, setSelectedEmpId] = useState("");
  const [selectedTypeId, setSelectedTypeId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [reqRes, typesRes, empRes] = await Promise.all([
        managerTimeOffService.listRequests({ status: statusFilter, limit: 100 }),
        managerTimeOffService.listTimeOffTypes().catch(() => []),
        employeeService.getEmployees({ limit: 100, status: "Active" }).catch(() => []),
      ]);

      setRequests(reqRes.data || []);
      setTypes(typesRes || []);
      setEmployees(empRes || []);
    } catch (err) {
      setError(err.message || "Failed to load leave requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  const handleApprove = async (id) => {
    try {
      await managerTimeOffService.approveRequest(id);
      showToast("Leave request approved successfully.");
      loadData();
    } catch (err) {
      alert(err.message || "Failed to approve request.");
    }
  };

  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!rejectingId) return;

    try {
      await managerTimeOffService.rejectRequest(rejectingId, rejectReason);
      setRejectingId(null);
      setRejectReason("");
      showToast("Leave request rejected.");
      loadData();
    } catch (err) {
      alert(err.message || "Failed to reject request.");
    }
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedEmpId || !selectedTypeId || !startDate || !endDate) {
      setFormError("Please fill out all required fields.");
      return;
    }

    setSubmitting(true);
    try {
      await managerTimeOffService.createRequest({
        employee_id: selectedEmpId,
        time_off_type_id: selectedTypeId,
        start_date: startDate,
        end_date: endDate,
        reason: reason.trim(),
      });

      showToast("Leave request created successfully.");
      setIsModalOpen(false);
      setStartDate("");
      setEndDate("");
      setReason("");
      loadData();
    } catch (err) {
      setFormError(err.message || "Failed to create leave request.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredRequests = useMemo(() => {
    if (!search.trim()) return requests;
    const q = search.trim().toLowerCase();
    return requests.filter(
      (r) =>
        (r.employee_name || "").toLowerCase().includes(q) ||
        (r.time_off_type_name || "").toLowerCase().includes(q) ||
        (r.department || "").toLowerCase().includes(q)
    );
  }, [requests, search]);

  // KPI Metrics
  const stats = useMemo(() => {
    let pending = 0;
    let approved = 0;
    let rejected = 0;
    requests.forEach((r) => {
      const s = (r.status || "").toLowerCase();
      if (s === "pending") pending++;
      else if (s === "approved") approved++;
      else if (s === "refused" || s === "rejected") rejected++;
    });
    return { total: requests.length, pending, approved, rejected };
  }, [requests]);

  const columns = useMemo(
    () => [
      {
        key: "employee",
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
        key: "time_off_type_name",
        header: "Leave Type",
        sortable: true,
        render: (row) => (
          <span className="font-medium text-xs text-foreground">
            {row.time_off_type_name || "Leave"}
          </span>
        ),
      },
      {
        key: "dates",
        header: "Leave Period",
        sortable: true,
        render: (row) => (
          <div className="text-xs text-foreground font-mono">
            <span>{row.start_date ? row.start_date.split("T")[0] : "â€”"}</span>
            <span className="text-muted-foreground mx-1">â†’</span>
            <span>{row.end_date ? row.end_date.split("T")[0] : "â€”"}</span>
          </div>
        ),
      },
      {
        key: "duration",
        header: "Duration",
        sortable: true,
        render: (row) => {
          const count = parseFloat(row.duration ?? row.requested_days ?? row.days ?? 1);
          return (
            <span className="text-xs font-bold text-primary font-mono">
              {count} {count === 1 ? "day" : "days"}
            </span>
          );
        },
      },
      {
        key: "reason",
        header: "Reason",
        render: (row) => (
          <span className="text-xs text-muted-foreground line-clamp-1 max-w-xs" title={row.reason}>
            {row.reason || "â€”"}
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
        header: "Review Actions",
        width: "180px",
        render: (row) => {
          const isPending = (row.status || "").toLowerCase() === "pending";
          if (!isPending) {
            return <span className="text-[11px] text-muted-foreground font-mono">Resolved</span>;
          }

          return (
            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                onClick={() => handleApprove(row.id)}
                className="h-7 px-2.5 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Approve
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRejectingId(row.id)}
                className="h-7 px-2.5 text-xs gap-1 text-rose-600 hover:bg-rose-50 border-rose-200"
              >
                <XCircle className="w-3.5 h-3.5" />
                Reject
              </Button>
            </div>
          );
        },
      },
    ],
    []
  );

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto">
      <PageHeader
        title="Time Off Requests"
        subtitle="Review, approve, and manage employee leave applications across departments."
        actions={
          <Button onClick={() => setIsModalOpen(true)} size="sm" className="gap-1.5 shadow-sm">
            <Plus className="w-4 h-4" />
            New Request
          </Button>
        }
      />

      {toastMessage && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center gap-2.5 text-xs font-medium animate-in fade-in-50">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-border bg-card shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Pending Requests</p>
              <p className="text-2xl font-bold text-amber-600 mt-0.5">{stats.pending}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Approved</p>
              <p className="text-2xl font-bold text-emerald-600 mt-0.5">{stats.approved}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Rejected</p>
              <p className="text-2xl font-bold text-rose-600 mt-0.5">{stats.rejected}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-rose-50 text-rose-600">
              <XCircle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Total History</p>
              <p className="text-2xl font-bold text-foreground mt-0.5">{stats.total}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600">
              <Calendar className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by employee name or leave type..."
        filters={[
          {
            key: "status",
            label: "Status",
            value: statusFilter,
            options: STATUS_OPTIONS,
            onChange: setStatusFilter,
          },
        ]}
        onClearAll={() => {
          setSearch("");
          setStatusFilter("all");
        }}
      />

      {/* Requests Table */}
      <DataTable
        columns={columns}
        data={filteredRequests}
        loading={loading}
        error={error}
        onRetry={loadData}
        emptyState={{
          icon: Calendar,
          title: "No Leave Requests Found",
          description: "There are no employee leave requests matching your current filters.",
          actionLabel: "New Request",
          onAction: () => setIsModalOpen(true),
        }}
        pageSize={15}
      />

      {/* Reject Reason Modal Dialog */}
      {rejectingId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="w-full max-w-md border-border bg-card shadow-xl animate-in zoom-in-95">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="text-base font-semibold text-rose-600 flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                Reject Leave Request
              </h3>
              <button
                onClick={() => setRejectingId(null)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmReject}>
              <CardContent className="p-6 space-y-4">
                <FormField label="Reason for Rejection">
                  <Textarea
                    rows={3}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Provide justification for rejecting this request..."
                    className="text-xs"
                  />
                </FormField>
              </CardContent>

              <div className="p-4 border-t border-border flex items-center justify-end gap-2 bg-muted/20">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setRejectingId(null)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  variant="destructive"
                  className="text-xs"
                >
                  Confirm Rejection
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Create Leave Request Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="w-full max-w-lg border-border bg-card shadow-xl animate-in zoom-in-95">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                Submit Employee Leave Request
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRequest}>
              <CardContent className="p-6 space-y-4">
                {formError && (
                  <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <FormField label="Employee" required>
                  <Select value={selectedEmpId} onValueChange={setSelectedEmpId}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((emp) => (
                        <SelectItem key={emp.id} value={String(emp.id)} className="text-xs">
                          {emp.name || `${emp.firstName} ${emp.lastName}`} â€¢ {emp.department}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField label="Leave Type" required>
                  <Select value={selectedTypeId} onValueChange={setSelectedTypeId}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Select leave type" />
                    </SelectTrigger>
                    <SelectContent>
                      {types.map((t) => (
                        <SelectItem key={t.id} value={String(t.id)} className="text-xs">
                          {t.name} ({t.unit})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>

                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Start Date" required>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </FormField>

                  <FormField label="End Date" required>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </FormField>
                </div>

                <FormField label="Reason">
                  <Textarea
                    rows={2}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Optional reason or comments..."
                    className="text-xs"
                  />
                </FormField>
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
                  {submitting ? "Submitting..." : "Submit Request"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}

