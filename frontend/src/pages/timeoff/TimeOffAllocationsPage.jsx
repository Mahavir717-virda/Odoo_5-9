import { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  Plus,
  Pencil,
  CheckCircle2,
  AlertCircle,
  X,
  PieChart,
  UserCheck,
  RefreshCw,
  Layers,
  Search,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from "lucide-react";

import api from "../../services/api";
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

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const fmt = (n) => Number(n || 0).toFixed(1).replace(".0", "");

const ROLE_BADGE = {
  admin: { label: "Admin", cls: "bg-rose-100 text-rose-700" },
  hr_manager: { label: "HR Manager", cls: "bg-blue-100 text-blue-700" },
  hr_payroll_manager: { label: "Payroll Mgr", cls: "bg-purple-100 text-purple-700" },
  employee: { label: "Employee", cls: "bg-slate-100 text-slate-600" },
};

// â”€â”€â”€ Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function TimeOffAllocationsPage() {
  // â”€â”€ Data State â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [allocations, setAllocations] = useState([]);
  const [types, setTypes] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // â”€â”€ Filters â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [empFilter, setEmpFilter] = useState("all");

  // â”€â”€ Pagination â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 12;

  // â”€â”€ Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAlloc, setEditingAlloc] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // â”€â”€ Form â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [form, setForm] = useState({ empId: "", typeId: "", days: "20" });

  // â”€â”€ Toast â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [toast, setToast] = useState({ show: false, msg: "", type: "success" });
  const showToast = (msg, type = "success") => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: "", type: "success" }), 3500);
  };

  // â”€â”€ Fetch Data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const [allocRes, typesRes, empsRes] = await Promise.all([
        api.get("/time-off/allocations?limit=200"),
        api.get("/time-off/types"),
        api.get("/employees?limit=200"),
      ]);

      const rawAllocs = allocRes.data?.data || [];
      const rawTypes = typesRes.data?.data || [];
      const rawEmps = empsRes.data?.data?.employees || empsRes.data?.data || [];

      setAllocations(
        rawAllocs.map((a) => ({
          id: a.id,
          employeeId: a.employee_id,
          employeeName: a.employee_name || `Employee #${a.employee_id}`,
          employeeEmail: a.employee_email || "",
          department: a.department || "General",
          typeId: a.type_id,
          typeName: a.time_off_type_name || a.type_name || "Leave",
          unit: a.unit || "days",
          allocated: Number(a.allocated || 0),
          taken: Number(a.taken || 0),
          remaining: Number(a.remaining || 0),
          affectsPayroll: a.affects_payroll,
          createdAt: a.created_at,
        }))
      );

      setTypes(rawTypes);
      setEmployees(rawEmps.map((e) => ({ id: e.id, name: e.name || e.email, department: e.department })));
    } catch (err) {
      setError(err.message || "Failed to load leave allocations.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // â”€â”€ Filtered & Paginated Data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return allocations.filter((a) => {
      const matchSearch =
        !q ||
        a.employeeName.toLowerCase().includes(q) ||
        a.typeName.toLowerCase().includes(q) ||
        a.department.toLowerCase().includes(q);
      const matchType = typeFilter === "all" || String(a.typeId) === typeFilter;
      const matchEmp = empFilter === "all" || String(a.employeeId) === empFilter;
      return matchSearch && matchType && matchEmp;
    });
  }, [allocations, search, typeFilter, empFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset page when filters change
  useEffect(() => setPage(1), [search, typeFilter, empFilter]);

  // â”€â”€ KPI Stats â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const stats = useMemo(() => {
    const totalAlloc = allocations.reduce((s, a) => s + a.allocated, 0);
    const totalTaken = allocations.reduce((s, a) => s + a.taken, 0);
    const totalRemaining = allocations.reduce((s, a) => s + a.remaining, 0);
    const utilPct = totalAlloc > 0 ? Math.round((totalTaken / totalAlloc) * 100) : 0;
    return { count: allocations.length, totalAlloc, totalTaken, totalRemaining, utilPct };
  }, [allocations]);

  // â”€â”€ Modal Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const openCreate = () => {
    setEditingAlloc(null);
    setForm({
      empId: employees.length > 0 ? String(employees[0].id) : "",
      typeId: types.length > 0 ? String(types[0].id) : "",
      days: "20",
    });
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (alloc) => {
    setEditingAlloc(alloc);
    setForm({ empId: String(alloc.employeeId), typeId: String(alloc.typeId), days: String(alloc.allocated) });
    setFormError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingAlloc(null);
    setFormError(null);
  };

  // â”€â”€ Submit â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!form.empId || !form.typeId || !form.days || isNaN(parseFloat(form.days)) || parseFloat(form.days) <= 0) {
      setFormError("Please fill all fields with valid values.");
      return;
    }

    setSubmitting(true);
    try {
      if (editingAlloc) {
        await api.put(`/time-off/allocations/${editingAlloc.id}`, {
          allocated: parseFloat(form.days),
        });
        showToast("Allocation updated successfully.");
      } else {
        await api.post("/time-off/allocations", {
          employee_id: parseInt(form.empId, 10),
          type_id: parseInt(form.typeId, 10),
          allocated: parseFloat(form.days),
        });
        showToast("Leave allocation granted successfully.");
      }
      closeModal();
      loadData(true);
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || "Failed to save allocation.");
    } finally {
      setSubmitting(false);
    }
  };

  // â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto px-1">

      {/* â”€â”€ Toast â”€â”€ */}
      {toast.show && (
        <div
          className={`fixed top-5 right-5 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-sm font-medium transition-all animate-in slide-in-from-top-2 ${
            toast.type === "success"
              ? "bg-emerald-600 text-white"
              : "bg-rose-600 text-white"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          {toast.msg}
        </div>
      )}

      {/* â”€â”€ Page Header â”€â”€ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#f6f2fd] text-[#7743db]">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Leave Allocations
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage employee leave quotas, annual balances, and entitlement pools
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-[#7743db]" : ""}`} />
            Refresh
          </button>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-[#7743db] hover:bg-[#6334b8] text-white shadow-sm shadow-indigo-200 transition"
          >
            <Plus className="w-4 h-4" />
            Grant Allocation
          </button>
        </div>
      </div>

      {/* â”€â”€ KPI Cards â”€â”€ */}
      <motion.div
        variants={STAGGER_CONTAINER_VARIANTS}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <motion.div variants={CARD_ANIMATION_VARIANTS} className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Active Allocations</p>
            <p className="text-2xl font-bold mt-1 text-[#7743db]">{stats.count}</p>
          </div>
          <div className="p-3 rounded-xl bg-[#f6f2fd] text-[#7743db]">
            <Layers className="w-5 h-5" />
          </div>
        </motion.div>

        <motion.div variants={CARD_ANIMATION_VARIANTS} className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Days Granted</p>
            <p className="text-2xl font-bold mt-1 text-blue-600">{fmt(stats.totalAlloc)}</p>
          </div>
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
            <Calendar className="w-5 h-5" />
          </div>
        </motion.div>

        <motion.div variants={CARD_ANIMATION_VARIANTS} className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Days Utilized</p>
            <p className="text-2xl font-bold mt-1 text-amber-600">{fmt(stats.totalTaken)}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{stats.utilPct}% utilization</p>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
            <PieChart className="w-5 h-5" />
          </div>
        </motion.div>

        <motion.div variants={CARD_ANIMATION_VARIANTS} className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Remaining Balance</p>
            <p className="text-2xl font-bold mt-1 text-emerald-600">{fmt(stats.totalRemaining)}</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </motion.div>
      </motion.div>

      {/* ––– Filters ––– */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by employee, leave type or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7743db]/20 focus:border-[#7743db] text-slate-900"
          />
        </div>
        <div className="flex gap-3 flex-wrap sm:flex-nowrap">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7743db]/20 focus:border-[#7743db] text-slate-900"
          >
            <option value="all">All Leave Types</option>
            {types.map((t) => (
              <option key={t.id} value={String(t.id)}>
                {t.name}
              </option>
            ))}
          </select>
          <select
            value={empFilter}
            onChange={(e) => setEmpFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7743db]/20 focus:border-[#7743db] text-slate-900"
          >
            <option value="all">All Employees</option>
            {employees.map((e) => (
              <option key={e.id} value={String(e.id)}>
                {e.name}
              </option>
            ))}
          </select>
          {(search || typeFilter !== "all" || empFilter !== "all") && (
            <button
              onClick={() => { setSearch(""); setTypeFilter("all"); setEmpFilter("all"); }}
              className="px-3 py-2 text-sm text-slate-500 hover:text-slate-700 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 transition"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Table Section */}
      <DataTable
        columns={[
          {
            key: "employeeName",
            header: "Employee",
            sortable: true,
            render: (a) => (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#ede5fb] text-[#7743db] font-bold text-xs flex items-center justify-center shrink-0">
                  {a.employeeName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-slate-900 text-xs">{a.employeeName}</p>
                  <p className="text-[11px] text-slate-400">{a.department}</p>
                </div>
              </div>
            ),
          },
          {
            key: "typeName",
            header: "Leave Type",
            sortable: true,
            render: (a) => (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#f6f2fd] text-[#6334b8] border border-indigo-100">
                  <Calendar className="w-3.5 h-3.5" />
                  {a.typeName}
                </span>
                {a.affectsPayroll && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                    Payroll
                  </span>
                )}
              </div>
            ),
          },
          {
            key: "allocated",
            header: "Allocated",
            sortable: true,
            align: "center",
            render: (a) => (
              <span className="text-xs font-mono font-bold text-slate-800">
                {fmt(a.allocated)} <span className="font-normal text-slate-400">{a.unit}</span>
              </span>
            ),
          },
          {
            key: "taken",
            header: "Used",
            sortable: true,
            align: "center",
            render: (a) => (
              <span className="text-xs font-mono text-slate-600">
                {fmt(a.taken)} <span className="text-slate-400">{a.unit}</span>
              </span>
            ),
          },
          {
            key: "remaining",
            header: "Remaining",
            sortable: true,
            align: "center",
            render: (a) => (
              <span className={`text-xs font-mono font-bold ${a.remaining > 0 ? "text-emerald-600" : "text-rose-500"}`}>
                {fmt(a.remaining)} <span className="font-normal text-slate-400">{a.unit}</span>
              </span>
            ),
          },
          {
            key: "utilization",
            header: "Utilization",
            align: "center",
            render: (a) => {
              const usedPct = a.allocated > 0 ? Math.round((a.taken / a.allocated) * 100) : 0;
              const barColor =
                usedPct >= 90 ? "bg-rose-500" : usedPct >= 65 ? "bg-amber-500" : "bg-emerald-500";
              return (
                <div className="flex items-center gap-2 justify-center">
                  <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${barColor}`}
                      style={{ width: `${Math.min(100, usedPct)}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono w-8 text-right">{usedPct}%</span>
                </div>
              );
            },
          },
          {
            key: "actions",
            header: "Actions",
            align: "right",
            render: (a) => (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openEdit(a);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-[#7743db] hover:bg-slate-100 transition"
                title="Edit allocation"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            ),
          },
        ]}
        data={filtered}
        loading={loading}
        error={error}
        onRetry={loadData}
        emptyState={{
          icon: Calendar,
          title: filtered.length === 0 && allocations.length === 0 ? "No Allocations Yet" : "No Results Found",
          description: allocations.length === 0 ? "Grant leave allocations to employees to get started." : "Try adjusting your search filters.",
          actionLabel: allocations.length === 0 ? "Grant First Allocation" : undefined,
          onAction: allocations.length === 0 ? openCreate : undefined,
        }}
      />
      {/* Modal */}

      {/* â”€â”€ Grant / Edit Modal â”€â”€ */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 animate-in zoom-in-95">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[#f6f2fd] text-[#7743db]">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingAlloc ? "Edit Leave Allocation" : "Grant Leave Allocation"}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {editingAlloc
                      ? `Adjusting quota for ${editingAlloc.employeeName}`
                      : "Assign leave days to an employee"}
                  </p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <div className="p-5 space-y-4">
                {formError && (
                  <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Employee Select */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Employee <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={form.empId}
                    onChange={(e) => setForm({ ...form, empId: e.target.value })}
                    disabled={Boolean(editingAlloc)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#7743db]/20 focus:border-[#7743db] disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <option value="">â€” Select employee â€”</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={String(emp.id)}>
                        {emp.name} {emp.department ? `â€¢ ${emp.department}` : ""}
                      </option>
                    ))}
                  </select>
                  {editingAlloc && (
                    <p className="mt-1 text-[11px] text-slate-400">Employee cannot be changed when editing.</p>
                  )}
                </div>

                {/* Leave Type Select */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Leave Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={form.typeId}
                    onChange={(e) => setForm({ ...form, typeId: e.target.value })}
                    disabled={Boolean(editingAlloc)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#7743db]/20 focus:border-[#7743db] disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <option value="">â€” Select leave type â€”</option>
                    {types.map((t) => (
                      <option key={t.id} value={String(t.id)}>
                        {t.name} ({t.unit})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Days Input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Allocated {types.find((t) => String(t.id) === form.typeId)?.unit === "hours" ? "Hours" : "Days"}{" "}
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={form.days}
                    onChange={(e) => setForm({ ...form, days: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm font-mono rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#7743db]/20 focus:border-[#7743db]"
                  />
                  <p className="mt-1 text-[11px] text-slate-400">
                    Enter the number of leave days/hours to allocate. Half-day increments (0.5) are supported.
                  </p>
                </div>

                {/* Preview if editing */}
                {editingAlloc && (
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                    <p className="font-semibold text-slate-700">Current Balance</p>
                    <div className="flex justify-between text-slate-500">
                      <span>Allocated</span>
                      <span className="font-mono font-medium text-slate-700">{fmt(editingAlloc.allocated)} {editingAlloc.unit}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Used</span>
                      <span className="font-mono font-medium text-amber-600">{fmt(editingAlloc.taken)} {editingAlloc.unit}</span>
                    </div>
                    <div className="flex justify-between text-slate-500 border-t border-slate-200 pt-1.5">
                      <span>Remaining</span>
                      <span className="font-mono font-bold text-emerald-600">{fmt(editingAlloc.remaining)} {editingAlloc.unit}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 p-5 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold bg-[#7743db] hover:bg-[#6334b8] text-white shadow-sm shadow-indigo-200 transition disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : editingAlloc ? (
                    "Update Allocation"
                  ) : (
                    "Grant Allocation"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

