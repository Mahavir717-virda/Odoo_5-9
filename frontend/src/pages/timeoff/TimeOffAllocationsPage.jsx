import { useState, useEffect, useMemo, useCallback } from "react";
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n) => Number(n || 0).toFixed(1).replace(".0", "");

const ROLE_BADGE = {
  admin: { label: "Admin", cls: "bg-rose-100 text-rose-700" },
  hr_manager: { label: "HR Manager", cls: "bg-blue-100 text-blue-700" },
  hr_payroll_manager: { label: "Payroll Mgr", cls: "bg-purple-100 text-purple-700" },
  employee: { label: "Employee", cls: "bg-slate-100 text-slate-600" },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function TimeOffAllocationsPage() {
  // ── Data State ──────────────────────────────────────────────────────────────
  const [allocations, setAllocations] = useState([]);
  const [types, setTypes] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // ── Filters ─────────────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [empFilter, setEmpFilter] = useState("all");

  // ── Pagination ───────────────────────────────────────────────────────────────
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 12;

  // ── Modal ────────────────────────────────────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAlloc, setEditingAlloc] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // ── Form ─────────────────────────────────────────────────────────────────────
  const [form, setForm] = useState({ empId: "", typeId: "", days: "20" });

  // ── Toast ────────────────────────────────────────────────────────────────────
  const [toast, setToast] = useState({ show: false, msg: "", type: "success" });
  const showToast = (msg, type = "success") => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: "", type: "success" }), 3500);
  };

  // ── Fetch Data ───────────────────────────────────────────────────────────────
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

  // ── Filtered & Paginated Data ─────────────────────────────────────────────
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

  // ── KPI Stats ─────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const totalAlloc = allocations.reduce((s, a) => s + a.allocated, 0);
    const totalTaken = allocations.reduce((s, a) => s + a.taken, 0);
    const totalRemaining = allocations.reduce((s, a) => s + a.remaining, 0);
    const utilPct = totalAlloc > 0 ? Math.round((totalTaken / totalAlloc) * 100) : 0;
    return { count: allocations.length, totalAlloc, totalTaken, totalRemaining, utilPct };
  }, [allocations]);

  // ── Modal Helpers ──────────────────────────────────────────────────────────
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

  // ── Submit ─────────────────────────────────────────────────────────────────
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

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto px-1">

      {/* ── Toast ── */}
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

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                Leave Allocations
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Manage employee leave quotas, annual balances, and entitlement pools
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-indigo-500" : ""}`} />
            Refresh
          </button>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-200 dark:shadow-none transition"
          >
            <Plus className="w-4 h-4" />
            Grant Allocation
          </button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Allocations</p>
            <p className="text-2xl font-bold mt-1 text-indigo-600 dark:text-indigo-400">{stats.count}</p>
          </div>
          <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Days Granted</p>
            <p className="text-2xl font-bold mt-1 text-blue-600 dark:text-blue-400">{fmt(stats.totalAlloc)}</p>
          </div>
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Days Utilized</p>
            <p className="text-2xl font-bold mt-1 text-amber-600 dark:text-amber-400">{fmt(stats.totalTaken)}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{stats.utilPct}% utilization</p>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
            <PieChart className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Remaining Balance</p>
            <p className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">{fmt(stats.totalRemaining)}</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by employee, leave type or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-white"
          />
        </div>
        <div className="flex gap-3 flex-wrap sm:flex-nowrap">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-white"
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
            className="px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-white"
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
              className="px-3 py-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-indigo-500 mx-auto mb-3" />
            <p className="text-sm text-slate-500">Loading leave allocations from database...</p>
          </div>
        ) : error ? (
          <div className="py-16 text-center">
            <AlertCircle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">Failed to load data</p>
            <p className="text-xs text-slate-400 mb-4">{error}</p>
            <button
              onClick={() => loadData()}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition"
            >
              Retry
            </button>
          </div>
        ) : paged.length === 0 ? (
          <div className="py-20 text-center">
            <Calendar className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200 mb-1">
              {filtered.length === 0 && allocations.length === 0 ? "No Allocations Yet" : "No Results Found"}
            </h3>
            <p className="text-sm text-slate-400 max-w-sm mx-auto mb-5">
              {allocations.length === 0
                ? "Grant leave allocations to employees to get started."
                : "Try adjusting your search filters."}
            </p>
            {allocations.length === 0 && (
              <button
                onClick={openCreate}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition"
              >
                <Plus className="w-4 h-4" /> Grant First Allocation
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-3.5 px-4 pl-6">Employee</th>
                  <th className="py-3.5 px-4">Leave Type</th>
                  <th className="py-3.5 px-4 text-center">Allocated</th>
                  <th className="py-3.5 px-4 text-center">Used</th>
                  <th className="py-3.5 px-4 text-center">Remaining</th>
                  <th className="py-3.5 px-4 text-center">Utilization</th>
                  <th className="py-3.5 px-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 text-sm">
                {paged.map((a) => {
                  const usedPct = a.allocated > 0 ? Math.round((a.taken / a.allocated) * 100) : 0;
                  const barColor =
                    usedPct >= 90 ? "bg-rose-500" : usedPct >= 65 ? "bg-amber-500" : "bg-emerald-500";

                  return (
                    <tr key={a.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-700/30 transition group">
                      <td className="py-3.5 px-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center justify-center shrink-0">
                            {a.employeeName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white text-xs">{a.employeeName}</p>
                            <p className="text-[11px] text-slate-400">{a.department}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800">
                            <Calendar className="w-3 h-3" />
                            {a.typeName}
                          </span>
                          {a.affectsPayroll && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                              Payroll
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-100">
                          {fmt(a.allocated)} <span className="font-normal text-slate-400">{a.unit}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="text-xs font-mono text-slate-600 dark:text-slate-300">
                          {fmt(a.taken)} <span className="text-slate-400">{a.unit}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className={`text-xs font-mono font-bold ${a.remaining > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"}`}>
                          {fmt(a.remaining)} <span className="font-normal text-slate-400">{a.unit}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2 justify-center">
                          <div className="w-20 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${barColor}`}
                              style={{ width: `${Math.min(100, usedPct)}%` }}
                            />
                          </div>
                          <span className="text-[11px] text-slate-500 font-mono w-8 text-right">{usedPct}%</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 pr-6 text-right">
                        <button
                          onClick={() => openEdit(a)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition"
                          title="Edit allocation"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Pagination ── */}
      {!loading && !error && filtered.length > PAGE_SIZE && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-slate-500 dark:text-slate-400 text-xs">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of{" "}
            <strong>{filtered.length}</strong> allocations
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs text-slate-600 dark:text-slate-300 px-2">
              Page {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Grant / Edit Modal ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-700 animate-in zoom-in-95">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
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
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <div className="p-5 space-y-4">
                {formError && (
                  <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Employee Select */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Employee <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={form.empId}
                    onChange={(e) => setForm({ ...form, empId: e.target.value })}
                    disabled={Boolean(editingAlloc)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <option value="">— Select employee —</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={String(emp.id)}>
                        {emp.name} {emp.department ? `• ${emp.department}` : ""}
                      </option>
                    ))}
                  </select>
                  {editingAlloc && (
                    <p className="mt-1 text-[11px] text-slate-400">Employee cannot be changed when editing.</p>
                  )}
                </div>

                {/* Leave Type Select */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Leave Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={form.typeId}
                    onChange={(e) => setForm({ ...form, typeId: e.target.value })}
                    disabled={Boolean(editingAlloc)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <option value="">— Select leave type —</option>
                    {types.map((t) => (
                      <option key={t.id} value={String(t.id)}>
                        {t.name} ({t.unit})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Days Input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Allocated {types.find((t) => String(t.id) === form.typeId)?.unit === "hours" ? "Hours" : "Days"}{" "}
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={form.days}
                    onChange={(e) => setForm({ ...form, days: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm font-mono rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                  <p className="mt-1 text-[11px] text-slate-400">
                    Enter the number of leave days/hours to allocate. Half-day increments (0.5) are supported.
                  </p>
                </div>

                {/* Preview if editing */}
                {editingAlloc && (
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
                    <p className="font-semibold text-slate-700 dark:text-slate-300">Current Balance</p>
                    <div className="flex justify-between text-slate-500">
                      <span>Allocated</span>
                      <span className="font-mono font-medium text-slate-700 dark:text-slate-200">{fmt(editingAlloc.allocated)} {editingAlloc.unit}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Used</span>
                      <span className="font-mono font-medium text-amber-600">{fmt(editingAlloc.taken)} {editingAlloc.unit}</span>
                    </div>
                    <div className="flex justify-between text-slate-500 border-t border-slate-200 dark:border-slate-700 pt-1.5">
                      <span>Remaining</span>
                      <span className="font-mono font-bold text-emerald-600">{fmt(editingAlloc.remaining)} {editingAlloc.unit}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 p-5 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20 rounded-b-2xl">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-200 dark:shadow-none transition disabled:opacity-50"
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
