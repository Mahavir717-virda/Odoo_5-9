import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  DollarSign,
  ArrowLeft,
  Play,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  AlertCircle,
  Eye,
  RefreshCw,
  Printer,
  FileText,
  CreditCard,
  Pencil,
  RotateCcw,
  X,
} from "lucide-react";

import PageHeader from "../../components/common/PageHeader";
import DataTable from "../../components/common/DataTable";
import StatusBadge from "../../components/common/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Separator } from "../../components/ui/separator";

import * as payrollManagerService from "../../services/payrollManagerService";

function formatCurrency(amount) {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function PayrunDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [payrun, setPayrun] = useState(null);
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState("");

  // Edit Payrun Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState(null);

  const loadPayrun = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const [prData, slipsData] = await Promise.all([
        payrollManagerService.getPayrunById(id),
        payrollManagerService.listPayslips({ payrun_id: id, limit: 100 }),
      ]);

      if (prData) setPayrun(prData);
      const rows = slipsData?.data || (Array.isArray(slipsData) ? slipsData : []);
      setPayslips(rows);
      return { prData, slipsData: rows };
    } catch (err) {
      console.error("Failed to load payrun details:", err);
      setError(err.message || "Failed to load payrun details");
      return null;
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    loadPayrun(true);
  }, [id]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4000);
  };

  const handleCompute = async () => {
    setActionLoading(true);
    try {
      const res = await payrollManagerService.computePayrun(id);
      showToast(res.message || "Payroll calculated successfully!");
      await loadPayrun(false);
    } catch (err) {
      alert(err.message || "Payroll calculation failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleValidate = async () => {
    if (!window.confirm("Validate this payroll batch? This will lock calculations.")) return;
    setActionLoading(true);
    try {
      await payrollManagerService.validatePayrun(id);
      showToast("Payrun validated successfully.");
      await loadPayrun(false);
    } catch (err) {
      alert(err.message || "Validation failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetToDraft = async () => {
    if (!window.confirm("Reset this payroll batch to Draft? This will unlock it for editing and re-computation.")) return;
    setActionLoading(true);
    try {
      await payrollManagerService.resetPayrunToDraft(id);
      showToast("Payrun state successfully changed to Draft.");
      await loadPayrun(false);
    } catch (err) {
      alert(err.message || "Failed to reset payrun to draft.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkPaid = async () => {
    if (!window.confirm("Confirm payment disbursement for this payrun?")) return;
    setActionLoading(true);
    try {
      await payrollManagerService.markPayrunPaid(id);
      showToast("Payrun marked as Paid & Disbursed!");
      await loadPayrun(false);
    } catch (err) {
      alert(err.message || "Payment disbursement confirmation failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editName.trim()) {
      setEditError("Payrun name is required.");
      return;
    }
    if (!editStart || !editEnd) {
      setEditError("Period start and end dates are required.");
      return;
    }
    setEditSubmitting(true);
    setEditError(null);
    try {
      await payrollManagerService.updatePayrun(id, {
        name: editName.trim(),
        period_start: editStart,
        period_end: editEnd,
      });
      showToast("Payrun details updated successfully.");
      setIsEditModalOpen(false);
      await loadPayrun(false);
    } catch (err) {
      setEditError(err.response?.data?.message || err.message || "Failed to update payrun.");
    } finally {
      setEditSubmitting(false);
    }
  };

  // KPI Totals
  const totals = useMemo(() => {
    let gross = 0;
    let deductions = 0;
    let net = 0;

    payslips.forEach((s) => {
      gross += parseFloat(s.gross_salary || 0);
      deductions += parseFloat(s.total_deductions || 0);
      net += parseFloat(s.net_salary || 0);
    });

    return {
      gross,
      deductions,
      net,
      count: payslips.length,
    };
  }, [payslips]);

  const columns = useMemo(
    () => [
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
        key: "worked_days",
        header: "Worked Days",
        sortable: true,
        render: (row) => (
          <span className="text-xs font-mono text-foreground font-medium">
            {parseFloat(row.worked_days || 0)} Days
          </span>
        ),
      },
      {
        key: "basic_salary",
        header: "Basic Salary",
        sortable: true,
        render: (row) => (
          <span className="text-xs font-mono text-foreground">
            {formatCurrency(row.basic_salary)}
          </span>
        ),
      },
      {
        key: "gross_salary",
        header: "Gross Earnings",
        sortable: true,
        render: (row) => (
          <span className="text-xs font-mono font-medium text-foreground">
            {formatCurrency(row.gross_salary)}
          </span>
        ),
      },
      {
        key: "total_deductions",
        header: "Total Deductions",
        sortable: true,
        render: (row) => (
          <span className="text-xs font-mono text-rose-600 dark:text-rose-400">
            -{formatCurrency(row.total_deductions)}
          </span>
        ),
      },
      {
        key: "net_salary",
        header: "Net Disbursed",
        sortable: true,
        render: (row) => (
          <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(row.net_salary)}
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
        render: (row) => (
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate(`/payroll/payslips/${row.id}`)}
            className="h-7 px-2 text-xs gap-1"
          >
            <Eye className="w-3.5 h-3.5" />
            View
          </Button>
        ),
      },
    ],
    [navigate]
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading payrun details...</p>
      </div>
    );
  }

  if (error || !payrun) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto text-center py-12">
        <AlertCircle className="w-10 h-10 text-destructive mx-auto" />
        <h2 className="text-lg font-bold">{error || "Payrun not found"}</h2>
        <Button onClick={() => navigate("/payroll/payruns")} variant="outline" size="sm">
          Back to Payruns
        </Button>
      </div>
    );
  }

  const status = (payrun.status || "").toLowerCase();

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/payroll/payruns")}
          className="text-xs text-muted-foreground gap-1.5 pl-0"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Payruns
        </Button>

        {/* Workflow Action Buttons */}
        <div className="flex items-center gap-2">
          {status !== "paid" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditName(payrun.name || "");
                setEditStart(payrun.period_start ? payrun.period_start.split("T")[0] : "");
                setEditEnd(payrun.period_end ? payrun.period_end.split("T")[0] : "");
                setIsEditModalOpen(true);
              }}
              className="text-xs gap-1.5"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit Batch
            </Button>
          )}

          {status !== "paid" && (
            <Button
              size="sm"
              variant={payslips.length > 0 ? "outline" : "default"}
              disabled={actionLoading}
              onClick={handleCompute}
              className="text-xs gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${actionLoading ? "animate-spin" : ""}`} />
              {payslips.length > 0 ? "Re-Compute" : "Compute Payroll"}
            </Button>
          )}

          {status !== "paid" && status !== "validated" && payslips.length > 0 && (
            <Button
              size="sm"
              disabled={actionLoading}
              onClick={handleValidate}
              className="text-xs gap-1.5 bg-[#7743DB] hover:bg-[#6635c2] text-white shadow-xs"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Validate Payrun
            </Button>
          )}

          {status === "validated" && (
            <Button
              size="sm"
              disabled={actionLoading}
              onClick={handleMarkPaid}
              className="text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
            >
              <DollarSign className="w-3.5 h-3.5" />
              Mark as Paid & Disbursed
            </Button>
          )}

          {status === "paid" && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Payment Disbursed</span>
            </div>
          )}

          {status !== "draft" && (
            <Button
              variant="outline"
              size="sm"
              disabled={actionLoading}
              onClick={handleResetToDraft}
              className="text-xs gap-1.5 border-amber-500/30 text-amber-600 hover:bg-amber-500/10 dark:text-amber-400"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Set to Draft
            </Button>
          )}
        </div>
      </div>

      {toastMessage && (
        <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 flex items-center gap-2.5 text-xs font-medium animate-in fade-in-50">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Payrun Info Header Card */}
      <Card className="border-border bg-card shadow-xs">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10 text-primary shrink-0">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                    {payrun.name}
                  </h1>
                  <StatusBadge status={payrun.status} />
                </div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-3">
                  <span className="font-mono">PR-{String(payrun.id).padStart(4, "0")}</span>
                  <span>•</span>
                  <span>Structure: <strong className="text-foreground">{payrun.structure_name || "Standard Structure"}</strong></span>
                  <span>•</span>
                  <span>
                    Period:{" "}
                    <strong className="text-foreground">
                      {payrun.period_start ? payrun.period_start.split("T")[0] : "—"} to{" "}
                      {payrun.period_end ? payrun.period_end.split("T")[0] : "—"}
                    </strong>
                  </span>
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-border bg-card shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Generated Slips</p>
              <p className="text-2xl font-bold text-foreground mt-0.5">{totals.count}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600">
              <FileText className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Gross Salary</p>
              <p className="text-xl font-bold font-mono text-foreground mt-0.5">
                {formatCurrency(totals.gross)}
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600">
              <DollarSign className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Total Deductions</p>
              <p className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-0.5">
                -{formatCurrency(totals.deductions)}
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600">
              <CreditCard className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Net Disbursement</p>
              <p className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                {formatCurrency(totals.net)}
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payslips Table */}
      <Card className="border-border bg-card shadow-xs">
        <CardHeader className="border-b border-border/40 pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            Employee Payslips Generated for this Batch
          </CardTitle>
          <span className="text-xs text-muted-foreground font-mono">
            {payslips.length} Employees Processed
          </span>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={payslips}
            loading={loading}
            emptyState={{
              icon: DollarSign,
              title: "No Payslips Generated Yet",
              description: "Click 'Compute Payroll' above to calculate employee wages and generate payslips.",
              actionLabel: "Compute Payroll",
              onAction: handleCompute,
            }}
            pageSize={20}
          />
        </CardContent>
      </Card>

      {/* Edit Payrun Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-base font-bold text-foreground">Edit Payrun Batch</h3>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Batch Name</label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="e.g. October 2026 Regular"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold block mb-1">Period Start</label>
                  <Input
                    type="date"
                    value={editStart}
                    onChange={(e) => setEditStart(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Period End</label>
                  <Input
                    type="date"
                    value={editEnd}
                    onChange={(e) => setEditEnd(e.target.value)}
                    required
                  />
                </div>
              </div>
              {editError && <p className="text-destructive font-medium text-xs">{editError}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={editSubmitting}>
                  {editSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
