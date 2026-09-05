import React, { useState, useEffect } from "react";
import {
  FileText,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Hash,
  Percent,
  Calculator,
  DollarSign,
  Layers,
  X,
} from "lucide-react";
import {
  listSalaryRules,
  createSalaryRule,
  updateSalaryRule,
  deleteSalaryRule,
} from "../../services/payrollManagerService";

export default function SalaryRulesPage() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // 'create' | 'edit'
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    category: "allowance",
    sequence: 10,
    type: "fixed",
    value: "0",
    description: "",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await listSalaryRules({
        category: categoryFilter !== "all" ? categoryFilter : undefined,
        type: typeFilter !== "all" ? typeFilter : undefined,
        search: search || undefined,
      });
      setRules(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch salary rules:", err);
      setError(err.response?.data?.message || "Failed to load salary rules.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [categoryFilter, typeFilter]);

  const openCreateModal = () => {
    setModalMode("create");
    setEditingId(null);
    setFormData({
      name: "",
      code: "",
      category: "allowance",
      sequence: (rules.length + 1) * 10,
      type: "fixed",
      value: "0",
      description: "",
    });
    setModalError("");
    setIsModalOpen(true);
  };

  const openEditModal = (rule) => {
    setModalMode("edit");
    setEditingId(rule.id);
    setFormData({
      name: rule.name || "",
      code: rule.code || "",
      category: rule.category || "allowance",
      sequence: rule.sequence || 10,
      type: rule.type || "fixed",
      value: String(rule.value ?? rule.amount ?? "0"),
      description: rule.description || "",
    });
    setModalError("");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setModalError("Rule name is required.");
      return;
    }
    if (!formData.code.trim()) {
      setModalError("Rule code is required.");
      return;
    }

    try {
      setSubmitting(true);
      setModalError("");

      const payload = {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        category: formData.category,
        sequence: parseInt(formData.sequence, 10) || 10,
        type: formData.type,
        value: formData.value,
        description: formData.description.trim(),
      };

      if (modalMode === "create") {
        await createSalaryRule(payload);
      } else {
        await updateSalaryRule(editingId, payload);
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error("Failed to save salary rule:", err);
      setModalError(err.response?.data?.message || "Failed to save salary rule.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete salary rule "${name}"?`)) return;
    try {
      await deleteSalaryRule(id);
      fetchData();
    } catch (err) {
      console.error("Failed to delete salary rule:", err);
      alert(err.response?.data?.message || "Failed to delete salary rule.");
    }
  };

  const filteredRules = rules.filter((r) => {
    const term = search.toLowerCase();
    return (
      (r.name || "").toLowerCase().includes(term) ||
      (r.code || "").toLowerCase().includes(term) ||
      (r.category || "").toLowerCase().includes(term)
    );
  });

  // KPI calculations
  const totalCount = rules.length;
  const allowanceCount = rules.filter((r) => r.category === "allowance").length;
  const deductionCount = rules.filter((r) => r.category === "deduction").length;
  const basicGrossCount = rules.filter((r) => r.category === "basic" || r.category === "gross" || r.category === "net").length;

  const getCategoryBadge = (category) => {
    const cat = (category || "").toLowerCase();
    if (cat === "basic") {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
          Basic Wage
        </span>
      );
    }
    if (cat === "allowance") {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          Allowance (+)
        </span>
      );
    }
    if (cat === "deduction") {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
          Deduction (-)
        </span>
      );
    }
    if (cat === "gross") {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
          Gross
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
        Net
      </span>
    );
  };

  const getTypeBadge = (type) => {
    const t = (type || "").toLowerCase();
    if (t === "percent") {
      return (
        <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-medium">
          <Percent className="w-3.5 h-3.5" /> Percentage
        </span>
      );
    }
    if (t === "formula") {
      return (
        <span className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 font-medium">
          <Calculator className="w-3.5 h-3.5" /> Formula
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300 font-medium">
        <DollarSign className="w-3.5 h-3.5" /> Fixed Amount
      </span>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Salary Rules
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800">
              {totalCount} Active Rules
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure computation formulas, allowances, tax brackets, and insurance deductions.
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
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-200 dark:shadow-none transition"
          >
            <Plus className="w-4 h-4" />
            New Salary Rule
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Rules</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{totalCount}</h3>
            <p className="text-xs text-slate-400 mt-0.5">Computational modules</p>
          </div>
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl text-indigo-600 dark:text-indigo-400">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Allowances (+)</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{allowanceCount}</h3>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">Bonus & Stipends</p>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-emerald-600 dark:text-emerald-400">
            <Plus className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Deductions (-)</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{deductionCount}</h3>
            <p className="text-xs text-rose-600 dark:text-rose-400 mt-0.5">Taxes & Retentions</p>
          </div>
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl text-rose-600 dark:text-rose-400">
            <Percent className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Base & Totals</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{basicGrossCount}</h3>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">Basic / Gross / Net</p>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-blue-600 dark:text-blue-400">
            <Calculator className="w-6 h-6" />
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

      {/* Filters & Search */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search rules by name, code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-white"
          >
            <option value="all">All Categories</option>
            <option value="basic">Basic</option>
            <option value="allowance">Allowance (+)</option>
            <option value="deduction">Deduction (-)</option>
            <option value="gross">Gross</option>
            <option value="net">Net</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-white"
          >
            <option value="all">All Types</option>
            <option value="fixed">Fixed Amount</option>
            <option value="percent">Percentage</option>
            <option value="formula">Formula Expression</option>
          </select>
        </div>
      </div>

      {/* Rules Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-3" />
            <p className="text-sm text-slate-500">Loading salary rules...</p>
          </div>
        ) : filteredRules.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">No salary rules found</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              {search || categoryFilter !== "all" || typeFilter !== "all"
                ? "Try adjusting your search criteria or active filters."
                : "Create rules to calculate allowances, deductions, and gross/net pay."}
            </p>
            {!search && (
              <button
                onClick={openCreateModal}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white transition shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Add Salary Rule
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/75 dark:bg-slate-900/50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-3.5 px-4 pl-6 w-16">Seq</th>
                  <th className="py-3.5 px-4">Code & Name</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Computation Type</th>
                  <th className="py-3.5 px-4">Value / Formula</th>
                  <th className="py-3.5 px-4">Description</th>
                  <th className="py-3.5 px-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 text-sm">
                {filteredRules.map((rule) => (
                  <tr
                    key={rule.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition group"
                  >
                    <td className="py-3.5 px-4 pl-6 font-mono text-xs text-slate-400">
                      {rule.sequence || 10}
                    </td>

                    <td className="py-3.5 px-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {rule.name}
                          </span>
                          <span className="font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded border border-indigo-100 dark:border-indigo-800">
                            {rule.code}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {getCategoryBadge(rule.category)}
                    </td>

                    <td className="py-3.5 px-4">
                      {getTypeBadge(rule.type)}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-xs font-medium text-slate-700 dark:text-slate-300">
                      {rule.type === "percent"
                        ? `${rule.value ?? rule.amount}%`
                        : rule.type === "formula"
                        ? `${rule.value || "BASIC * 0.1"}`
                        : `$${parseFloat(rule.value ?? rule.amount ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
                    </td>

                    <td className="py-3.5 px-4 text-xs text-slate-500 max-w-xs truncate">
                      {rule.description || "-"}
                    </td>

                    <td className="py-3.5 px-4 pr-6 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(rule)}
                          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition"
                          title="Edit Rule"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(rule.id, rule.name)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                          title="Delete Rule"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Rule Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {modalMode === "create" ? "Create Salary Rule" : "Edit Salary Rule"}
                </h3>
                <p className="text-xs text-slate-500">
                  Configure calculation logic and categorization for payroll computation
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Rule Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Housing Allowance"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Rule Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. HRA"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full font-mono uppercase px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="basic">Basic</option>
                    <option value="allowance">Allowance (+)</option>
                    <option value="deduction">Deduction (-)</option>
                    <option value="gross">Gross</option>
                    <option value="net">Net</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Execution Sequence
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.sequence}
                    onChange={(e) => setFormData({ ...formData, sequence: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Computation Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="fixed">Fixed Amount ($)</option>
                    <option value="percent">Percentage (%)</option>
                    <option value="formula">Formula (e.g. BASIC * 0.1)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {formData.type === "percent"
                      ? "Percentage (%)"
                      : formData.type === "formula"
                      ? "Formula Expression"
                      : "Amount ($)"}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={
                      formData.type === "percent"
                        ? "e.g. 15"
                        : formData.type === "formula"
                        ? "e.g. BASIC * 0.12"
                        : "e.g. 250.00"
                    }
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Optional notes or statutory rule explanation..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
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
                  ) : modalMode === "create" ? (
                    "Create Rule"
                  ) : (
                    "Save Changes"
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
