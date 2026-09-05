import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FileText,
  Search,
  Filter,
  RefreshCw,
  Eye,
  CheckCircle2,
  Clock,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Building2,
  Calendar,
  Layers,
  ArrowUpRight,
} from "lucide-react";
import { listPayslips, listPayruns } from "../../services/payrollManagerService";

export default function PayslipsListPage() {
  const navigate = useNavigate();
  const [payslips, setPayslips] = useState([]);
  const [payruns, setPayruns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [payrunFilter, setPayrunFilter] = useState("all");

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      const [payslipsRes, payrunsRes] = await Promise.all([
        listPayslips({
          payrun_id: payrunFilter !== "all" ? payrunFilter : undefined,
          status: statusFilter !== "all" ? statusFilter : undefined,
          limit: 100,
        }),
        listPayruns({ limit: 100 }).catch(() => ({ data: [] })),
      ]);

      setPayslips(payslipsRes.data || []);
      setPayruns(payrunsRes.data || []);
    } catch (err) {
      console.error("Failed to fetch payslips:", err);
      setError(err.response?.data?.message || "Failed to load employee payslips.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter, payrunFilter]);

  // Client-side search filtering by employee name/code or payslip reference
  const filteredPayslips = payslips.filter((item) => {
    const term = search.toLowerCase();
    const empName = `${item.employee_first_name || item.first_name || ""} ${item.employee_last_name || item.last_name || ""}`.toLowerCase();
    const empCode = (item.employee_code || item.emp_code || "").toLowerCase();
    const slipNum = (item.number || item.reference || `SLIP-${item.id}`).toLowerCase();
    const payrunName = (item.payrun_name || "").toLowerCase();

    return (
      empName.includes(term) ||
      empCode.includes(term) ||
      slipNum.includes(term) ||
      payrunName.includes(term)
    );
  });

  // KPI Calculations
  const totalCount = payslips.length;
  const totalNet = payslips.reduce((acc, p) => acc + (parseFloat(p.net_wage || p.net_salary || p.net_amount || 0) || 0), 0);
  const totalGross = payslips.reduce((acc, p) => acc + (parseFloat(p.gross_wage || p.gross_salary || 0) || 0), 0);
  const paidCount = payslips.filter((p) => p.status === "paid" || p.state === "paid").length;
  const draftCount = payslips.filter((p) => p.status === "draft" || p.state === "draft").length;

  const getStatusBadge = (status) => {
    const s = (status || "draft").toLowerCase();
    if (s === "paid") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Paid
        </span>
      );
    }
    if (s === "validated" || s === "verify" || s === "done") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
          <Clock className="w-3.5 h-3.5" />
          Validated
        </span>
      );
    }
    if (s === "cancelled") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
          <AlertCircle className="w-3.5 h-3.5" />
          Cancelled
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
        <Clock className="w-3.5 h-3.5" />
        Draft
      </span>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Employee Payslips
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800">
              {totalCount} Generated
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Review detailed salary disbursements, tax breakdowns, deductions, and itemized wage slips.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-indigo-600" : ""}`} />
            Refresh
          </button>
          <Link
            to="/payroll/payruns"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-200 dark:shadow-none transition"
          >
            <Layers className="w-4 h-4" />
            Manage Payruns
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Net Payout
            </p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              ${totalNet.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Disbursed net wage sum</p>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-emerald-600 dark:text-emerald-400">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Gross Wages
            </p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              ${totalGross.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Pre-tax & deductions</p>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-blue-600 dark:text-blue-400">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Paid Slips
            </p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{paidCount}</h3>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">
              Completed transactions
            </p>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Draft / Pending
            </p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{draftCount}</h3>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5 font-medium">
              Awaiting computation/payment
            </p>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl text-amber-600 dark:text-amber-400">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 flex items-center gap-3 text-rose-700 dark:text-rose-400 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filters and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search employee, ID, or slip reference..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={payrunFilter}
              onChange={(e) => setPayrunFilter(e.target.value)}
              className="px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-white"
            >
              <option value="all">All Payruns</option>
              {payruns.map((pr) => (
                <option key={pr.id} value={pr.id}>
                  {pr.name}
                </option>
              ))}
            </select>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-white"
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="validated">Validated</option>
            <option value="paid">Paid</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-3" />
            <p className="text-sm text-slate-500">Loading employee payslips...</p>
          </div>
        ) : filteredPayslips.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">No payslips found</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              {search || payrunFilter !== "all" || statusFilter !== "all"
                ? "Try adjusting your search criteria or active filters."
                : "Generate payslips by computing a payrun batch."}
            </p>
            {payrunFilter === "all" && (
              <div className="mt-4">
                <Link
                  to="/payroll/payruns"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white transition shadow-sm"
                >
                  <Layers className="w-4 h-4" />
                  View Payruns
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/75 dark:bg-slate-900/50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-3.5 px-4 pl-6">Reference / Slip</th>
                  <th className="py-3.5 px-4">Employee</th>
                  <th className="py-3.5 px-4">Payrun / Period</th>
                  <th className="py-3.5 px-4 text-right">Basic Wage</th>
                  <th className="py-3.5 px-4 text-right">Gross Pay</th>
                  <th className="py-3.5 px-4 text-right">Deductions</th>
                  <th className="py-3.5 px-4 text-right">Net Wage</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 pr-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 text-sm">
                {filteredPayslips.map((slip) => {
                  const empName = `${slip.employee_first_name || slip.first_name || "Employee"} ${
                    slip.employee_last_name || slip.last_name || ""
                  }`.trim();
                  const empCode = slip.employee_code || slip.emp_code || `EMP-${slip.employee_id}`;
                  const jobTitle = slip.employee_job_title || slip.job_title || "Staff Member";
                  const refCode = slip.number || slip.reference || `SLIP-#${slip.id}`;
                  const basicWage = parseFloat(slip.basic_wage || slip.basic_salary || 0);
                  const grossWage = parseFloat(slip.gross_wage || slip.gross_salary || 0);
                  const netWage = parseFloat(slip.net_wage || slip.net_salary || slip.net_amount || 0);
                  const totalDeductions = grossWage > netWage ? grossWage - netWage : 0;

                  return (
                    <tr
                      key={slip.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition group cursor-pointer"
                      onClick={() => navigate(`/payroll/payslips/${slip.id}`)}
                    >
                      <td className="py-3.5 px-4 pl-6 font-mono text-xs font-medium text-indigo-600 dark:text-indigo-400">
                        {refCode}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 font-semibold text-xs flex items-center justify-center flex-shrink-0">
                            {empName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                              {empName}
                            </p>
                            <p className="text-xs text-slate-400">{jobTitle} • {empCode}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                        <div className="flex flex-col">
                          <span className="font-medium text-xs text-slate-900 dark:text-white">
                            {slip.payrun_name || `Batch #${slip.payrun_id}`}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {slip.period_start ? `${slip.period_start} → ${slip.period_end}` : "Monthly Cycle"}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right font-medium text-slate-600 dark:text-slate-300">
                        ${basicWage.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>

                      <td className="py-3.5 px-4 text-right font-medium text-slate-900 dark:text-white">
                        ${grossWage.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>

                      <td className="py-3.5 px-4 text-right font-medium text-rose-600 dark:text-rose-400">
                        -${totalDeductions.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>

                      <td className="py-3.5 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        ${netWage.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {getStatusBadge(slip.status || slip.state)}
                      </td>

                      <td className="py-3.5 px-4 pr-6 text-right" onClick={(e) => e.stopPropagation()}>
                        <Link
                          to={`/payroll/payslips/${slip.id}`}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Details
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
