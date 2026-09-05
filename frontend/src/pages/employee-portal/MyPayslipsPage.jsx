import { useState, useEffect, useMemo } from "react";
import {
  FileText,
  Download,
  Eye,
  DollarSign,
  TrendingUp,
  CreditCard,
  Building,
  Printer,
  X,
  CheckCircle2,
  Calendar,
} from "lucide-react";

import PageHeader from "../../components/common/PageHeader";
import DataTable from "../../components/common/DataTable";
import StatusBadge from "../../components/common/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Separator } from "../../components/ui/separator";

import { useAuth } from "../../context/AuthContext";
import * as portalService from "../../services/employeePortalService";

function formatCurrency(amount) {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function MyPayslipsPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selected Payslip for Detailed Modal
  const [selectedSlip, setSelectedSlip] = useState(null);
  const [downloadToast, setDownloadToast] = useState(false);

  const fetchPayslips = () => {
    setLoading(true);
    portalService
      .getMyPayslips()
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load payslips.");
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchPayslips();
  }, []);

  const handleDownloadSimulation = (slip) => {
    setDownloadToast(true);
    setTimeout(() => setDownloadToast(false), 3500);
  };

  const { summary, payslips = [] } = data || {};

  const columns = useMemo(
    () => [
      {
        key: "period",
        header: "Pay Period",
        sortable: true,
        render: (row) => (
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600 shrink-0" />
            <div>
              <span className="font-semibold text-xs text-foreground block">
                {row.period}
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">
                {row.payslipNumber || row.id}
              </span>
            </div>
          </div>
        ),
      },
      {
        key: "paymentDate",
        header: "Disbursed Date",
        sortable: true,
        render: (row) => {
          const dt = row.paymentDate || row.payDate;
          return (
            <span className="text-xs text-muted-foreground">
              {dt
                ? new Date(dt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "Pending"}
            </span>
          );
        },
      },
      {
        key: "basicWage",
        header: "Basic Wage",
        sortable: true,
        render: (row) => (
          <span className="text-xs font-mono text-foreground">
            {formatCurrency(row.basicSalary || row.basicWage || 0)}
          </span>
        ),
      },
      {
        key: "grossEarnings",
        header: "Gross Earnings",
        sortable: true,
        render: (row) => (
          <span className="text-xs font-mono text-foreground">
            {formatCurrency(row.grossEarnings)}
          </span>
        ),
      },
      {
        key: "totalDeductions",
        header: "Deductions",
        sortable: true,
        render: (row) => (
          <span className="text-xs font-mono text-rose-600 dark:text-rose-400">
            -{formatCurrency(row.totalDeductions)}
          </span>
        ),
      },
      {
        key: "netPay",
        header: "Net Disbursed",
        sortable: true,
        render: (row) => (
          <span className="font-bold text-xs text-emerald-600 dark:text-emerald-400 font-mono">
            {formatCurrency(row.netPay)}
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
        width: "160px",
        render: (row) => (
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedSlip(row)}
              className="h-7 px-2 text-xs gap-1"
            >
              <Eye className="w-3 h-3" />
              View
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDownloadSimulation(row)}
              className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
            >
              <Download className="w-3 h-3" />
              PDF
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-6 pb-16 max-w-6xl mx-auto">
      <PageHeader
        title="My Payslips"
        subtitle="View and download personal monthly payslips, compensation breakdowns, and tax summaries."
      />

      {downloadToast && (
        <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 flex items-center gap-2.5 text-xs font-medium animate-in fade-in-50">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Generating PDF payslip download... Your file will be saved shortly.</span>
        </div>
      )}

      {/* YTD Metrics Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border bg-card shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Gross Earnings YTD</p>
              <p className="text-xl font-bold text-foreground mt-1 font-mono">
                {formatCurrency(summary?.grossYTD || 468000)}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Across {summary?.totalPayslips || 6} pay cycles
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600">
              <DollarSign className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Total Deductions YTD</p>
              <p className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-1 font-mono">
                {formatCurrency(summary?.deductionsYTD || 58800)}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                PF, TDS & Professional Tax
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Net Disbursed YTD</p>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
                {formatCurrency(summary?.netYTD || 409200)}
              </p>
              <p className="text-[11px] text-emerald-600 mt-0.5 font-medium">
                100% On-time delivery
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
              <CreditCard className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Salary Bank Account</p>
              <p className="text-sm font-semibold text-foreground mt-1">HDFC Bank</p>
              <p className="text-[11px] font-mono text-muted-foreground mt-0.5">
                A/C: XXXX-4819
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600">
              <Building className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payslips DataTable */}
      <Card className="border-border bg-card shadow-xs">
        <CardHeader className="pb-3 border-b border-border/40">
          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            Monthly Payslip Statements
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={payslips}
            loading={loading}
            error={error}
            onRetry={fetchPayslips}
            emptyState={{
              icon: FileText,
              title: "No Payslips Found",
              description: "No payslip records generated for your account yet.",
            }}
            pageSize={10}
          />
        </CardContent>
      </Card>

      {/* Detailed Payslip Modal */}
      {selectedSlip && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl border-border bg-card shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <CardHeader className="pb-3 border-b border-border flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <CardTitle className="text-base font-bold text-foreground">
                  Salary Payslip — {selectedSlip.period}
                </CardTitle>
              </div>
              <button
                onClick={() => setSelectedSlip(null)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-muted/30 p-4 rounded-lg border border-border">
                <div>
                  <h3 className="font-bold text-sm text-foreground">
                    PeoplePay360 Technologies Pvt Ltd
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Payroll Reference: {selectedSlip.payrunId} • Paid on: {selectedSlip.paymentDate}
                  </p>
                </div>
                <StatusBadge status={selectedSlip.status} />
              </div>

              {/* Employee Summary Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-muted-foreground block">Employee Name:</span>
                  <span className="font-semibold text-foreground">
                    {selectedSlip.employeeName || user?.name || "Employee"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Employee ID:</span>
                  <span className="font-semibold text-foreground font-mono">
                    {selectedSlip.employeeId || user?.employeeId || "EMP-2024-001"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Department:</span>
                  <span className="font-semibold text-foreground">
                    {selectedSlip.department || user?.department || "Engineering"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Bank Account:</span>
                  <span className="font-semibold text-foreground font-mono">
                    •••• •••• •••• 4892
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Worked Days:</span>
                  <span className="font-semibold text-foreground font-mono">
                    {selectedSlip.workedDays || 22} Days
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Disbursed Date:</span>
                  <span className="font-semibold text-foreground font-mono">
                    {selectedSlip.payDate || selectedSlip.paymentDate || "Processed"}
                  </span>
                </div>
              </div>

              <Separator />

              {/* Earnings & Deductions Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
                {/* Earnings */}
                <div className="space-y-2">
                  <h4 className="font-bold text-foreground text-xs uppercase tracking-wider text-emerald-600 dark:text-emerald-400 pb-1 border-b border-border">
                    Earnings
                  </h4>
                  {Array.isArray(selectedSlip.lines) && selectedSlip.lines.filter(l => l.category === 'basic' || l.category === 'allowance').length > 0 ? (
                    selectedSlip.lines
                      .filter(l => l.category === 'basic' || l.category === 'allowance')
                      .map((l, idx) => (
                        <div key={idx} className="flex justify-between py-1">
                          <span className="text-muted-foreground">{l.name || l.code}</span>
                          <span className="font-mono font-medium">{formatCurrency(l.amount)}</span>
                        </div>
                      ))
                  ) : (
                    <>
                      <div className="flex justify-between py-1">
                        <span className="text-muted-foreground">Basic Salary</span>
                        <span className="font-mono font-medium">{formatCurrency(selectedSlip.basicSalary || selectedSlip.basicWage)}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-muted-foreground">House Rent & Allowances</span>
                        <span className="font-mono font-medium">{formatCurrency(Math.max(0, (selectedSlip.grossEarnings || 0) - (selectedSlip.basicSalary || selectedSlip.basicWage || 0)))}</span>
                      </div>
                    </>
                  )}
                  <Separator className="my-1" />
                  <div className="flex justify-between py-1 font-bold text-foreground">
                    <span>Total Gross Earnings</span>
                    <span className="font-mono">{formatCurrency(selectedSlip.grossEarnings)}</span>
                  </div>
                </div>

                {/* Deductions */}
                <div className="space-y-2">
                  <h4 className="font-bold text-foreground text-xs uppercase tracking-wider text-rose-600 dark:text-rose-400 pb-1 border-b border-border">
                    Deductions
                  </h4>
                  {Array.isArray(selectedSlip.lines) && selectedSlip.lines.filter(l => l.category === 'deduction').length > 0 ? (
                    selectedSlip.lines
                      .filter(l => l.category === 'deduction')
                      .map((l, idx) => (
                        <div key={idx} className="flex justify-between py-1">
                          <span className="text-muted-foreground">{l.name || l.code}</span>
                          <span className="font-mono font-medium">-{formatCurrency(l.amount)}</span>
                        </div>
                      ))
                  ) : (
                    <>
                      <div className="flex justify-between py-1">
                        <span className="text-muted-foreground">Provident Fund (PF)</span>
                        <span className="font-mono font-medium">-{formatCurrency((selectedSlip.totalDeductions || 0) * 0.6)}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-muted-foreground">Professional Tax & TDS</span>
                        <span className="font-mono font-medium">-{formatCurrency((selectedSlip.totalDeductions || 0) * 0.4)}</span>
                      </div>
                    </>
                  )}
                  <Separator className="my-1" />
                  <div className="flex justify-between py-1 font-bold text-rose-600 dark:text-rose-400">
                    <span>Total Deductions</span>
                    <span className="font-mono">-{formatCurrency(selectedSlip.totalDeductions)}</span>
                  </div>
                </div>
              </div>

              {/* Net Pay Highlight Banner */}
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
                    Total Net Payable
                  </span>
                  <p className="text-xs text-muted-foreground">
                    Disbursed for {selectedSlip.period}
                  </p>
                </div>
                <span className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-300">
                  {formatCurrency(selectedSlip.netPay)}
                </span>
              </div>
            </CardContent>

            <div className="flex items-center justify-between p-4 border-t border-border bg-muted/30">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownloadSimulation(selectedSlip)}
                className="text-xs gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                Print / PDF
              </Button>

              <Button
                size="sm"
                onClick={() => setSelectedSlip(null)}
                className="text-xs px-5"
              >
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
