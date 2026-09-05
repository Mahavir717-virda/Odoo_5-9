import React, { useState, useEffect } from "react";
import {
  BarChart3,
  DollarSign,
  TrendingUp,
  Users,
  Building2,
  Calendar,
  RefreshCw,
  Printer,
  Download,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  PieChart,
  Layers,
} from "lucide-react";
import {
  getPayrollSummaryReport,
  getDepartmentCostReport,
} from "../../services/payrollManagerService";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("summary"); // 'summary' | 'department'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");

  // Data states
  const [summaryData, setSummaryData] = useState(null);
  const [deptCostData, setDeptCostData] = useState([]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError("");

      const [summaryRes, deptRes] = await Promise.all([
        getPayrollSummaryReport({
          period_start: periodStart || undefined,
          period_end: periodEnd || undefined,
        }).catch((err) => {
          console.warn("Summary report err:", err);
          return null;
        }),
        getDepartmentCostReport({
          period_start: periodStart || undefined,
          period_end: periodEnd || undefined,
        }).catch((err) => {
          console.warn("Dept report err:", err);
          return [];
        }),
      ]);

      setSummaryData(summaryRes);
      setDeptCostData(Array.isArray(deptRes) ? deptRes : []);
    } catch (err) {
      console.error("Failed to load reports:", err);
      setError(err.response?.data?.message || "Failed to load payroll analytics & reports.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleApplyFilter = (e) => {
    e.preventDefault();
    fetchReports();
  };

  const handleResetFilter = () => {
    setPeriodStart("");
    setPeriodEnd("");
    setTimeout(() => {
      fetchReports();
    }, 0);
  };

  const handlePrint = () => {
    window.print();
  };

  // Safe KPI calculations from summaryData or calculated fallbacks
  const totalGross = parseFloat(
    summaryData?.total_gross || summaryData?.gross_wages || summaryData?.total_gross_wage || 0
  );
  const totalNet = parseFloat(
    summaryData?.total_net || summaryData?.net_wages || summaryData?.total_net_wage || 0
  );
  const totalDeductions = parseFloat(
    summaryData?.total_deductions || (totalGross > totalNet ? totalGross - totalNet : 0)
  );
  const totalPayslips = parseInt(
    summaryData?.total_payslips || summaryData?.payslips_count || 0,
    10
  );
  const avgSalary = totalPayslips > 0 ? totalNet / totalPayslips : 0;

  return (
    <div className="space-y-6 pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Payroll Reports & Analytics
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800">
              Live BI Metrics
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time financial disbursements, department cost allocations, and compliance summaries.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchReports}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-indigo-600" : ""}`} />
            Refresh
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-200 dark:shadow-none transition"
          >
            <Printer className="w-4 h-4" />
            Print / Export Report
          </button>
        </div>
      </div>

      {/* Date Filter Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-sm print:hidden">
        <form onSubmit={handleApplyFilter} className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Period From:</span>
            <input
              type="date"
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">To:</span>
            <input
              type="date"
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />
          </div>

          <button
            type="submit"
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition shadow-sm"
          >
            Filter Analytics
          </button>

          {(periodStart || periodEnd) && (
            <button
              type="button"
              onClick={handleResetFilter}
              className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline"
            >
              Reset Dates
            </button>
          )}
        </form>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 flex items-center gap-3 text-rose-700 dark:text-rose-400 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Disbursed Net
            </p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              ${totalNet.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">Net Take-Home Sum</p>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-emerald-600 dark:text-emerald-400">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Gross Payroll
            </p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              ${totalGross.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Pre-deduction wage cost</p>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-blue-600 dark:text-blue-400">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Deductions & Tax
            </p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              ${totalDeductions.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <p className="text-xs text-rose-600 dark:text-rose-400 mt-0.5 font-medium">Withheld amounts</p>
          </div>
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl text-rose-600 dark:text-rose-400">
            <PieChart className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Average Net / Slip
            </p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              ${avgSalary.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-0.5 font-medium">
              Across {totalPayslips} generated payslips
            </p>
          </div>
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl text-indigo-600 dark:text-indigo-400">
            <Users className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 print:hidden">
        <button
          onClick={() => setActiveTab("summary")}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
            activeTab === "summary"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Payroll Summary
        </button>

        <button
          onClick={() => setActiveTab("department")}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
            activeTab === "department"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          <Building2 className="w-4 h-4" />
          Department Cost Allocation
        </button>
      </div>

      {/* Tab Content 1: Summary Analytics */}
      {activeTab === "summary" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Wage Cost Breakdown Card */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Wage Disbursement Distribution
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Visual proportion of take-home earnings versus statutory withholding
            </p>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-emerald-700 dark:text-emerald-400">Net Take-Home Payout</span>
                  <span className="text-slate-900 dark:text-white">
                    ${totalNet.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{
                      width: totalGross > 0 ? `${Math.min(100, (totalNet / totalGross) * 100)}%` : "0%",
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-rose-700 dark:text-rose-400">Taxes, Insurance & Deductions</span>
                  <span className="text-slate-900 dark:text-white">
                    ${totalDeductions.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                  <div
                    className="h-full bg-rose-500 rounded-full transition-all duration-500"
                    style={{
                      width: totalGross > 0 ? `${Math.min(100, (totalDeductions / totalGross) * 100)}%` : "0%",
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-xs space-y-2">
              <div className="flex justify-between text-slate-500">
                <span>Total Batches Executed:</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {summaryData?.payrun_count || summaryData?.total_payruns || "1"} Payrun(s)
                </span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Period Range:</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {periodStart || "All Recorded"} → {periodEnd || "Present"}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics & Compliance Snapshot */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Compliance & Operational Metrics
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Status tracking across all generated employee wage statements
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-500">Total Slips Generated</span>
                <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{totalPayslips}</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-500">Paid Transactions</span>
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  {summaryData?.paid_count || summaryData?.paid_payslips || totalPayslips}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-500">Draft / Reviewing</span>
                <p className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                  {summaryData?.draft_count || 0}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-500">Avg Cost / Worker</span>
                <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                  ${(totalGross > 0 && totalPayslips > 0 ? totalGross / totalPayslips : 0).toLocaleString("en-US", {
                    maximumFractionDigits: 0,
                  })}
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-2 text-xs text-slate-400">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span>All calculations computed dynamically against active salary rules.</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 2: Department Cost Report */}
      {activeTab === "department" && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-700">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Department Payroll Cost Allocation
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Breakdown of headcount and gross expenditure by organizational business unit
            </p>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-3" />
              <p className="text-sm text-slate-500">Loading department cost breakdown...</p>
            </div>
          ) : deptCostData.length === 0 ? (
            <div className="p-12 text-center">
              <Building2 className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <h4 className="text-base font-semibold text-slate-900 dark:text-white">
                No department cost records
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Ensure employees are assigned to departments and payslips are calculated.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/75 dark:bg-slate-900/50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <th className="py-3.5 px-4 pl-6">Department Name</th>
                    <th className="py-3.5 px-4 text-center">Headcount</th>
                    <th className="py-3.5 px-4 text-right">Total Gross Cost ($)</th>
                    <th className="py-3.5 px-4 text-right">Total Net Paid ($)</th>
                    <th className="py-3.5 px-4 text-right">Avg Cost / Member ($)</th>
                    <th className="py-3.5 px-4 pr-6 text-right">% of Total Payroll</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 text-sm">
                  {deptCostData.map((dept, idx) => {
                    const deptGross = parseFloat(dept.total_gross_cost || dept.gross_wages || dept.total_gross || 0);
                    const deptNet = parseFloat(dept.total_net_cost || dept.net_wages || dept.total_net || 0);
                    const headcount = parseInt(dept.headcount || dept.employee_count || 1, 10);
                    const avgCost = headcount > 0 ? deptGross / headcount : 0;
                    const percent = totalGross > 0 ? ((deptGross / totalGross) * 100).toFixed(1) : "0.0";

                    return (
                      <tr key={dept.department_id || idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30">
                        <td className="py-3.5 px-4 pl-6 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                          {dept.department_name || dept.name || "General"}
                        </td>

                        <td className="py-3.5 px-4 text-center font-medium text-slate-700 dark:text-slate-300">
                          {headcount}
                        </td>

                        <td className="py-3.5 px-4 text-right font-medium text-slate-900 dark:text-white">
                          ${deptGross.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </td>

                        <td className="py-3.5 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                          ${deptNet.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </td>

                        <td className="py-3.5 px-4 text-right font-medium text-slate-600 dark:text-slate-300">
                          ${avgCost.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </td>

                        <td className="py-3.5 px-4 pr-6 text-right font-bold text-indigo-600 dark:text-indigo-400">
                          {percent}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
