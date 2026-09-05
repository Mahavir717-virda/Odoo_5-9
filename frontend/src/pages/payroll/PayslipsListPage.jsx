import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
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
import DataTable from "../../components/common/DataTable";

const STAGGER_CONTAINER_VARIANTS = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const CARD_ANIMATION_VARIANTS = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: "easeOut" },
  },
};

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
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Paid
        </span>
      );
    }
    if (s === "validated" || s === "verify" || s === "done") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 border border-blue-500/20">
          <Clock className="w-3.5 h-3.5" />
          Validated
        </span>
      );
    }
    if (s === "cancelled") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 border border-rose-500/20">
          <AlertCircle className="w-3.5 h-3.5" />
          Cancelled
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">
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
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Employee Payslips
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#f6f2fd] text-[#6334b8] border border-indigo-100">
              {totalCount} Generated
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Review detailed salary disbursements, tax breakdowns, deductions, and itemized wage slips.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-[#7743db]" : ""}`} />
            Refresh
          </button>
          <Link
            to="/payroll/payruns"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-[#7743db] hover:bg-[#6334b8] text-white shadow-sm shadow-indigo-200 transition"
          >
            <Layers className="w-4 h-4" />
            Manage Payruns
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <motion.div
        variants={STAGGER_CONTAINER_VARIANTS}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <motion.div variants={CARD_ANIMATION_VARIANTS} className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Total Net Payout
            </p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">
              ${totalNet.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Disbursed net wage sum</p>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <DollarSign className="w-6 h-6" />
          </div>
        </motion.div>

        <motion.div variants={CARD_ANIMATION_VARIANTS} className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Total Gross Wages
            </p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">
              ${totalGross.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Pre-tax & deductions</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
            <TrendingUp className="w-6 h-6" />
          </div>
        </motion.div>

        <motion.div variants={CARD_ANIMATION_VARIANTS} className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Paid Slips
            </p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{paidCount}</h3>
            <p className="text-xs text-emerald-600 mt-0.5 font-medium">
              Completed transactions
            </p>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </motion.div>

        <motion.div variants={CARD_ANIMATION_VARIANTS} className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Draft / Pending
            </p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{draftCount}</h3>
            <p className="text-xs text-amber-600 mt-0.5 font-medium">
              Awaiting computation/payment
            </p>
          </div>
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
            <Clock className="w-6 h-6" />
          </div>
        </motion.div>
      </motion.div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-700 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filters and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search employee, ID, or slip reference..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7743db]/20 focus:border-[#7743db] text-slate-900"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={payrunFilter}
              onChange={(e) => setPayrunFilter(e.target.value)}
              className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7743db]/20 focus:border-[#7743db] text-slate-900"
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
            className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7743db]/20 focus:border-[#7743db] text-slate-900"
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="validated">Validated</option>
            <option value="paid">Paid</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Table Section */}
      <DataTable
        columns={[
          {
            key: "number",
            header: "Reference / Slip",
            sortable: true,
            render: (slip) => {
              const refCode = slip.number || slip.reference || `SLIP-#${slip.id}`;
              return (
                <span className="font-mono text-xs font-semibold text-[#7743db]">
                  {refCode}
                </span>
              );
            },
          },
          {
            key: "employee",
            header: "Employee",
            sortable: true,
            render: (slip) => {
              const empName = `${slip.employee_first_name || slip.first_name || "Employee"} ${
                slip.employee_last_name || slip.last_name || ""
              }`.trim();
              const empCode = slip.employee_code || slip.emp_code || `EMP-${slip.employee_id}`;
              const jobTitle = slip.employee_job_title || slip.job_title || "Staff Member";
              return (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#ede5fb] text-[#7743db] font-semibold text-xs flex items-center justify-center flex-shrink-0">
                    {empName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 group-hover:text-[#7743db] transition">
                      {empName}
                    </p>
                    <p className="text-xs text-slate-400">{jobTitle} • {empCode}</p>
                  </div>
                </div>
              );
            },
          },
          {
            key: "payrun",
            header: "Payrun / Period",
            sortable: true,
            render: (slip) => (
              <div className="flex flex-col">
                <span className="font-semibold text-xs text-slate-900">
                  {slip.payrun_name || `Batch #${slip.payrun_id}`}
                </span>
                <span className="text-[11px] text-slate-400">
                  {slip.period_start ? `${slip.period_start} → ${slip.period_end}` : "Monthly Cycle"}
                </span>
              </div>
            ),
          },
          {
            key: "basic_wage",
            header: "Basic Wage",
            sortable: true,
            align: "right",
            render: (slip) => {
              const basicWage = parseFloat(slip.basic_wage || slip.basic_salary || 0);
              return (
                <span className="font-medium text-slate-600">
                  ${basicWage.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              );
            },
          },
          {
            key: "gross_wage",
            header: "Gross Pay",
            sortable: true,
            align: "right",
            render: (slip) => {
              const grossWage = parseFloat(slip.gross_wage || slip.gross_salary || 0);
              return (
                <span className="font-bold text-slate-900">
                  ${grossWage.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              );
            },
          },
          {
            key: "deductions",
            header: "Deductions",
            align: "right",
            render: (slip) => {
              const grossWage = parseFloat(slip.gross_wage || slip.gross_salary || 0);
              const netWage = parseFloat(slip.net_wage || slip.net_salary || slip.net_amount || 0);
              const totalDeductions = grossWage > netWage ? grossWage - netWage : 0;
              return (
                <span className="font-semibold text-rose-500">
                  -${totalDeductions.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              );
            },
          },
          {
            key: "net_wage",
            header: "Net Wage",
            sortable: true,
            align: "right",
            render: (slip) => {
              const netWage = parseFloat(slip.net_wage || slip.net_salary || slip.net_amount || 0);
              return (
                <span className="font-bold text-emerald-600">
                  ${netWage.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              );
            },
          },
          {
            key: "status",
            header: "Status",
            align: "center",
            render: (slip) => getStatusBadge(slip.status || slip.state),
          },
          {
            key: "actions",
            header: "Action",
            align: "right",
            render: (slip) => (
              <Link
                to={`/payroll/payslips/${slip.id}`}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg text-slate-600 hover:text-[#7743db] hover:bg-slate-100 transition"
              >
                <Eye className="w-3.5 h-3.5" />
                Details
              </Link>
            ),
          },
        ]}
        data={filteredPayslips}
        loading={loading}
        error={error}
        onRetry={fetchData}
        onRowClick={(slip) => navigate(`/payroll/payslips/${slip.id}`)}
        emptyState={{
          icon: FileText,
          title: "No payslips found",
          description:
            search || payrunFilter !== "all" || statusFilter !== "all"
              ? "Try adjusting your search criteria or active filters."
              : "Generate payslips by computing a payrun batch.",
          actionLabel: payrunFilter === "all" ? "View Payruns" : undefined,
          onAction: payrunFilter === "all" ? () => navigate("/payroll/payruns") : undefined,
        }}
      />
    </div>
  );
}
