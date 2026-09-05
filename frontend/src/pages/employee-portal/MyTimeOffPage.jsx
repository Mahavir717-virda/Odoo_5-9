import { useState, useEffect, useMemo } from "react";
import {
  Calendar,
  PlusCircle,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Send,
  X,
  Trash2,
  CalendarDays,
} from "lucide-react";

import PageHeader from "../../components/common/PageHeader";
import DataTable from "../../components/common/DataTable";
import StatusBadge from "../../components/common/StatusBadge";
import FormField from "../../components/common/FormField";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
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

import * as portalService from "../../services/employeePortalService";

// LEAVE_TYPE_OPTIONS removed — now loaded dynamically from backend

export default function MyTimeOffPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Leave Request Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);
  const [formError, setFormError] = useState(null);

  // Form State — leaveType stores the type id as string
  const [leaveType, setLeaveType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  const fetchLeaves = () => {
    setLoading(true);
    portalService
      .getMyTimeOffData()
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load leave records.");
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  // Set default leaveType once types are loaded
  useEffect(() => {
    if (data?.types?.length > 0 && !leaveType) {
      setLeaveType(String(data.types[0].id));
    }
  }, [data?.types]);

  // Calculate day count
  const calculatedDays = useMemo(() => {
    if (!startDate || !endDate) return 1;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return 1;
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  }, [startDate, endDate]);

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!startDate || !endDate) {
      setFormError("Please choose valid start and end dates.");
      return;
    }

    if (!reason.trim()) {
      setFormError("Please provide a reason for the leave request.");
      return;
    }

    setSubmitting(true);
    try {
      const typeObj = (data?.types || []).find(
        (t) => String(t.id) === String(leaveType)
      );
      const typeId = typeObj?.id || parseInt(leaveType, 10) || 1;

      await portalService.submitTimeOffRequest({
        typeId,
        leaveType,
        startDate,
        endDate,
        days: calculatedDays,
        reason: reason.trim(),
      });

      setIsModalOpen(false);
      setRequestSuccess(true);
      setStartDate("");
      setEndDate("");
      setReason("");
      fetchLeaves();
      setTimeout(() => setRequestSuccess(false), 4000);
    } catch (err) {
      setFormError(err.message || "Failed to submit leave request.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelRequest = async (requestId) => {
    if (!window.confirm("Cancel this leave request?")) return;

    try {
      await portalService.cancelTimeOffRequest(requestId);
      fetchLeaves();
    } catch (err) {
      alert(err.message || "Failed to cancel request.");
    }
  };

  const { balances = [], requests = [] } = data || {};

  const columns = useMemo(
    () => [
      {
        key: "leaveType",
        header: "Leave Type",
        sortable: true,
        render: (row) => (
          <span className="font-semibold text-foreground text-xs">
            {row.leaveType}
          </span>
        ),
      },
      {
        key: "duration",
        header: "Date Range",
        sortable: true,
        render: (row) => (
          <div className="flex items-center gap-1.5 text-xs text-foreground">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
            <span>
              {new Date(row.startDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}{" "}
              –{" "}
              {new Date(row.endDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
        ),
      },
      {
        key: "daysCount",
        header: "Days",
        sortable: true,
        render: (row) => (
          <span className="font-medium text-xs text-foreground">
            {row.daysCount} {row.daysCount === 1 ? "day" : "days"}
          </span>
        ),
      },
      {
        key: "reason",
        header: "Reason",
        render: (row) => (
          <span className="text-xs text-muted-foreground truncate max-w-xs block">
            {row.reason}
          </span>
        ),
      },
      {
        key: "appliedDate",
        header: "Applied On",
        sortable: true,
        render: (row) => (
          <span className="text-xs text-muted-foreground">
            {new Date(row.appliedDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
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
        width: "90px",
        render: (row) =>
          row.status === "Pending" ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCancelRequest(row.id)}
              className="h-7 px-2 text-xs text-muted-foreground hover:text-rose-600 gap-1"
              title="Cancel request"
            >
              <Trash2 className="w-3 h-3" />
              Cancel
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          ),
      },
    ],
    []
  );

  return (
    <div className="space-y-6 pb-16 max-w-6xl mx-auto">
      <PageHeader
        title="My Time Off"
        subtitle="Submit leave requests, check your remaining annual/sick leave balances, and track approval status."
        actions={
          <Button
            onClick={() => setIsModalOpen(true)}
            size="sm"
            className="text-xs gap-1.5 shadow-xs"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Request Time Off
          </Button>
        }
      />

      {requestSuccess && (
        <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 flex items-center gap-2.5 text-xs font-medium animate-in fade-in-50">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Leave request submitted successfully. Your manager will be notified for review.</span>
        </div>
      )}

      {/* Leave Balances Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {balances.map((b) => {
          return (
            <Card
              key={b.id}
              className="border-border bg-card shadow-2xs hover:border-primary/40 transition-colors"
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground truncate">
                    {b.type}
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                    {b.unit || "days"}
                  </span>
                </div>

                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-2xl font-bold text-foreground">
                      {b.remaining ?? 0}
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">
                      / {b.allocated ?? b.total ?? 0} {b.unit || "days"} left
                    </span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    {b.used ?? 0} used
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-primary h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${b.allocated > 0 ? Math.min(100, Math.round(((b.allocated - (b.used ?? 0)) / b.allocated) * 100)) : 0}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Leave Requests Table */}
      <Card className="border-border bg-card shadow-xs">
        <CardHeader className="pb-3 border-b border-border/40">
          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-blue-600" />
            My Leave Requests & History
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={requests}
            loading={loading}
            error={error}
            onRetry={fetchLeaves}
            emptyState={{
              icon: Calendar,
              title: "No Leave Requests",
              description: "You have not submitted any leave requests yet.",
              actionLabel: "Request Time Off",
              onAction: () => setIsModalOpen(true),
            }}
            pageSize={10}
          />
        </CardContent>
      </Card>

      {/* Request Leave Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="w-full max-w-lg border-border bg-card shadow-xl animate-in zoom-in-95">
            <CardHeader className="pb-3 border-b border-border flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                Submit Time Off Request
              </CardTitle>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </CardHeader>

            <form onSubmit={handleSubmitRequest}>
              <CardContent className="p-6 space-y-4">
                {formError && (
                  <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <FormField label="Leave Type" required>
                  <Select value={leaveType} onValueChange={setLeaveType}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {(data?.types || []).length > 0
                        ? (data.types.map((t) => (
                          <SelectItem key={t.id} value={String(t.id)} className="text-xs">
                            {t.name} ({t.unit})
                          </SelectItem>
                        )))
                        : (
                          <SelectItem value="1" className="text-xs">Paid Annual Leave (days)</SelectItem>
                        )
                      }
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

                {startDate && endDate && (
                  <div className="p-2.5 rounded bg-muted text-xs text-foreground flex items-center justify-between">
                    <span className="text-muted-foreground">Total Duration:</span>
                    <span className="font-bold text-primary">
                      {calculatedDays} {calculatedDays === 1 ? "day" : "days"}
                    </span>
                  </div>
                )}

                <FormField label="Reason for Leave" required>
                  <Textarea
                    rows={3}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Briefly describe the reason for your time off request..."
                    className="text-xs"
                  />
                </FormField>
              </CardContent>

              <div className="flex items-center justify-end gap-2.5 p-4 border-t border-border bg-muted/30">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={submitting}
                  className="text-xs gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
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
