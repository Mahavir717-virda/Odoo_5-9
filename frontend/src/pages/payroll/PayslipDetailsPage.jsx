import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  FileText,
  ArrowLeft,
  Printer,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building2,
  User,
  Calendar,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  CreditCard,
  Layers,
} from "lucide-react";
import { getPayslipById, recalculatePayslip } from "../../services/payrollManagerService";

export default function PayslipDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [payslip, setPayslip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [error, setError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  const fetchPayslip = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getPayslipById(id);
      setPayslip(data);
    } catch (err) {
      console.error("Error fetching payslip:", err);
      setError(err.response?.data?.message || "Failed to load payslip details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchPayslip();
  }, [id]);

  const handleRecalculate = async () => {
    try {
      setRecalculating(true);
      setError("");
      setActionSuccess("");
      const updated = await recalculatePayslip(id);
      setPayslip(updated);
      setActionSuccess("Payslip rules and wage breakdown recalculated successfully.");
      setTimeout(() => setActionSuccess(""), 4000);
    } catch (err) {
      console.error("Error recalculating payslip:", err);
      setError(err.response?.data?.message || "Failed to recalculate payslip.");
    } finally {
      setRecalculating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
        <p className="text-sm text-slate-500">Loading payslip statement...</p>
      </div>
    );
  }

  if (error && !payslip) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-6 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 rounded-2xl text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-rose-900 dark:text-rose-200">Unable to Load Payslip</h3>
        <p className="text-sm text-rose-600 dark:text-rose-400 mt-1">{error}</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            to="/payroll/payslips"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Payslips
          </Link>
          <button
            onClick={fetchPayslip}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const empName = `${payslip?.employee_first_name || payslip?.first_name || "Employee"} ${
    payslip?.employee_last_name || payslip?.last_name || ""
  }`.trim();
  const empCode = payslip?.employee_code || payslip?.emp_code || `EMP-${payslip?.employee_id}`;
  const jobTitle = payslip?.employee_job_title || payslip?.job_title || "Staff Member";
  const deptName = payslip?.department_name || payslip?.department || "General Operations";
  const slipNumber = payslip?.number || payslip?.reference || `SLIP-#${payslip?.id}`;

  const basicWage = parseFloat(payslip?.basic_wage || payslip?.basic_salary || 0);
  const grossWage = parseFloat(payslip?.gross_wage || payslip?.gross_salary || 0);
  const netWage = parseFloat(payslip?.net_wage || payslip?.net_salary || payslip?.net_amount || 0);

  // Group lines into allowances/earnings vs deductions
  const lines = payslip?.lines || [];
  const earningsLines = lines.filter(
    (l) =>
      (l.category || "").toLowerCase() === "basic" ||
      (l.category || "").toLowerCase() === "allowance" ||
      (l.category || "").toLowerCase() === "gross" ||
      parseFloat(l.amount || l.total || 0) >= 0
  );
  const deductionLines = lines.filter(
    (l) =>
      (l.category || "").toLowerCase() === "deduction" ||
      (l.category || "").toLowerCase() === "tax" ||
      parseFloat(l.amount || l.total || 0) < 0
  );

  const getStatusBadge = (status) => {
    const s = (status || "draft").toLowerCase();
    if (s === "paid") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Paid
        </span>
      );
    }
    if (s === "validated" || s === "verify" || s === "done") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
          <Clock className="w-3.5 h-3.5" />
          Validated
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
        <Clock className="w-3.5 h-3.5" />
        Draft
      </span>
    );
  };

  return (
    <div className="space-y-6 pb-16 max-w-5xl mx-auto">
      {/* Top Navigation & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Payslip {slipNumber}
              </h1>
              {getStatusBadge(payslip?.status || payslip?.state)}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Payrun: {payslip?.payrun_name || `Batch #${payslip?.payrun_id}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {(payslip?.status === "draft" || payslip?.state === "draft" || !payslip?.status) && (
            <button
              onClick={handleRecalculate}
              disabled={recalculating}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-sm"
            >
              <RefreshCw className={`w-4 h-4 ${recalculating ? "animate-spin text-indigo-600" : ""}`} />
              Recalculate Rules
            </button>
          )}

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-200 dark:shadow-none transition"
          >
            <Printer className="w-4 h-4" />
            Print / Export PDF
          </button>
        </div>
      </div>

      {/* Action Messages */}
      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-3 text-emerald-700 dark:text-emerald-400 text-sm print:hidden">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 flex items-center gap-3 text-rose-700 dark:text-rose-400 text-sm print:hidden">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Printable Payslip Card */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-2xl shadow-sm p-8 print:p-0 print:border-none print:shadow-none">
        {/* Company Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 dark:border-slate-700 pb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-indigo-200 dark:shadow-none">
              P
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">PeoplePay360 Inc.</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Enterprise HR & Payroll Management</p>
            </div>
          </div>

          <div className="sm:text-right">
            <span className="text-xs font-mono uppercase tracking-widest text-slate-400">Official Payslip</span>
            <h3 className="text-lg font-bold font-mono text-indigo-600 dark:text-indigo-400">{slipNumber}</h3>
            <p className="text-xs text-slate-500">
              Period: {payslip?.period_start || "N/A"} to {payslip?.period_end || "N/A"}
            </p>
          </div>
        </div>

        {/* Employee & Payroll Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6 p-5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <User className="w-3.5 h-3.5 text-indigo-500" />
              Employee Details
            </div>
            <div className="grid grid-cols-3 text-xs gap-y-1.5">
              <span className="text-slate-400">Name:</span>
              <span className="col-span-2 font-semibold text-slate-900 dark:text-white">{empName}</span>
              <span className="text-slate-400">Code / ID:</span>
              <span className="col-span-2 font-mono text-slate-700 dark:text-slate-300">{empCode}</span>
              <span className="text-slate-400">Designation:</span>
              <span className="col-span-2 text-slate-700 dark:text-slate-300">{jobTitle}</span>
              <span className="text-slate-400">Department:</span>
              <span className="col-span-2 text-slate-700 dark:text-slate-300">{deptName}</span>
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <CreditCard className="w-3.5 h-3.5 text-indigo-500" />
              Payment & Account Info
            </div>
            <div className="grid grid-cols-3 text-xs gap-y-1.5">
              <span className="text-slate-400">Payrun Batch:</span>
              <span className="col-span-2 font-semibold text-slate-900 dark:text-white">
                {payslip?.payrun_name || `Batch #${payslip?.payrun_id}`}
              </span>
              <span className="text-slate-400">Structure:</span>
              <span className="col-span-2 text-slate-700 dark:text-slate-300">
                {payslip?.structure_name || `Structure #${payslip?.structure_id || "Standard"}`}
              </span>
              <span className="text-slate-400">Bank Account:</span>
              <span className="col-span-2 font-mono text-slate-700 dark:text-slate-300">
                {payslip?.bank_account_number || "•••• •••• •••• 4821"}
              </span>
              <span className="text-slate-400">Status:</span>
              <span className="col-span-2 capitalize text-slate-700 dark:text-slate-300 font-medium">
                {payslip?.status || payslip?.state || "Draft"}
              </span>
            </div>
          </div>
        </div>

        {/* Breakdown of Salary Rules and Lines */}
        <div className="my-6">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
            Itemized Computation Breakdown
          </h4>
          <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/75 dark:bg-slate-900/50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Rule Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">Rate / %</th>
                  <th className="py-3 px-4 text-right">Amount ($)</th>
                  <th className="py-3 px-4 text-right">Total ($)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 text-xs">
                {lines.length > 0 ? (
                  lines.map((line, idx) => {
                    const amt = parseFloat(line.total ?? line.amount ?? 0);
                    const isDeduction = (line.category || "").toLowerCase() === "deduction" || amt < 0;

                    return (
                      <tr key={line.id || idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20">
                        <td className="py-2.5 px-4 font-mono font-medium text-slate-500">
                          {line.code || line.rule_code || `R${idx + 1}`}
                        </td>
                        <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white">
                          {line.name || line.rule_name || "Salary Rule"}
                        </td>
                        <td className="py-2.5 px-4">
                          <span className="capitalize px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {line.category || "General"}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-right text-slate-500">
                          {line.rate ? `${line.rate}%` : "-"}
                        </td>
                        <td className="py-2.5 px-4 text-right text-slate-700 dark:text-slate-300">
                          ${Math.abs(parseFloat(line.amount || amt)).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </td>
                        <td
                          className={`py-2.5 px-4 text-right font-bold ${
                            isDeduction ? "text-rose-600 dark:text-rose-400" : "text-slate-900 dark:text-white"
                          }`}
                        >
                          {isDeduction ? "-" : ""}$
                          {Math.abs(amt).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <>
                    <tr className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-4 font-mono text-slate-500">BASIC</td>
                      <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white">Basic Monthly Wage</td>
                      <td className="py-2.5 px-4"><span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">Basic</span></td>
                      <td className="py-2.5 px-4 text-right text-slate-500">100%</td>
                      <td className="py-2.5 px-4 text-right text-slate-700 dark:text-slate-300">${basicWage.toFixed(2)}</td>
                      <td className="py-2.5 px-4 text-right font-bold text-slate-900 dark:text-white">${basicWage.toFixed(2)}</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-4 font-mono text-slate-500">GROSS</td>
                      <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white">Gross Disbursable Salary</td>
                      <td className="py-2.5 px-4"><span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-600">Gross</span></td>
                      <td className="py-2.5 px-4 text-right text-slate-500">-</td>
                      <td className="py-2.5 px-4 text-right text-slate-700 dark:text-slate-300">${grossWage.toFixed(2)}</td>
                      <td className="py-2.5 px-4 text-right font-bold text-slate-900 dark:text-white">${grossWage.toFixed(2)}</td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals & Summary Card */}
        <div className="flex flex-col sm:flex-row justify-end mt-8">
          <div className="w-full sm:w-80 bg-slate-50 dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
              <span>Basic Salary:</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                ${basicWage.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
              <span>Gross Earnings:</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                ${grossWage.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between text-xs text-rose-600 dark:text-rose-400">
              <span>Total Deductions:</span>
              <span className="font-semibold">
                -${(grossWage > netWage ? grossWage - netWage : 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="border-t border-slate-200 dark:border-slate-700 pt-3 flex justify-between items-baseline">
              <span className="text-sm font-bold text-slate-900 dark:text-white">Net Take-Home Pay:</span>
              <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                ${netWage.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-10 border-t border-slate-200 dark:border-slate-700 pt-4 text-center text-xs text-slate-400">
          This document is an electronically generated payroll record and is valid without physical signature.
        </div>
      </div>
    </div>
  );
}
