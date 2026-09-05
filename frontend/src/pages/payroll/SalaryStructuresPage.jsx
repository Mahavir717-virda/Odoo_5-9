import React, { useState, useEffect } from "react";
import {
  Building2,
  Plus,
  Search,
  RefreshCw,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Layers,
  Code,
  Check,
  X,
} from "lucide-react";
import {
  listSalaryStructures,
  createSalaryStructure,
  updateSalaryStructure,
  deleteSalaryStructure,
  listSalaryRules,
} from "../../services/payrollManagerService";

export default function SalaryStructuresPage() {
  const [structures, setStructures] = useState([]);
  const [allRules, setAllRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

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
    description: "",
    rule_ids: [],
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      const [structsRes, rulesRes] = await Promise.all([
        listSalaryStructures(),
        listSalaryRules().catch(() => []),
      ]);

      setStructures(Array.isArray(structsRes) ? structsRes : []);
      setAllRules(Array.isArray(rulesRes) ? rulesRes : []);
    } catch (err) {
      console.error("Failed to fetch salary structures:", err);
      setError(err.response?.data?.message || "Failed to load salary structures.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setModalMode("create");
    setEditingId(null);
    setFormData({
      name: "",
      code: "",
      description: "",
      rule_ids: allRules.map((r) => r.id), // default select all rules
    });
    setModalError("");
    setIsModalOpen(true);
  };

  const openEditModal = (struct) => {
    setModalMode("edit");
    setEditingId(struct.id);
    const existingRuleIds = Array.isArray(struct.rule_ids)
      ? struct.rule_ids
      : (struct.rules || []).map((r) => r.id);

    setFormData({
      name: struct.name || "",
      code: struct.code || "",
      description: struct.description || "",
      rule_ids: existingRuleIds,
    });
    setModalError("");
    setIsModalOpen(true);
  };

  const toggleRuleSelection = (ruleId) => {
    setFormData((prev) => {
      const exists = prev.rule_ids.includes(ruleId);
      return {
        ...prev,
        rule_ids: exists
          ? prev.rule_ids.filter((id) => id !== ruleId)
          : [...prev.rule_ids, ruleId],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setModalError("Structure name is required.");
      return;
    }
    if (!formData.code.trim()) {
      setModalError("Structure code is required.");
      return;
    }

    try {
      setSubmitting(true);
      setModalError("");

      const payload = {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        description: formData.description.trim(),
        rule_ids: formData.rule_ids,
      };

      if (modalMode === "create") {
        await createSalaryStructure(payload);
      } else {
        await updateSalaryStructure(editingId, payload);
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error("Failed to save salary structure:", err);
      setModalError(err.response?.data?.message || "Failed to save salary structure.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete structure "${name}"?`)) return;
    try {
      await deleteSalaryStructure(id);
      fetchData();
    } catch (err) {
      console.error("Failed to delete structure:", err);
      alert(err.response?.data?.message || "Failed to delete structure.");
    }
  };

  const filteredStructures = structures.filter((s) => {
    const term = search.toLowerCase();
    return (
      (s.name || "").toLowerCase().includes(term) ||
      (s.code || "").toLowerCase().includes(term) ||
      (s.description || "").toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Salary Structures
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#f6f2fd] text-[#6334b8] border border-indigo-100">
              {structures.length} Configured
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Define organizational compensation tiers and group computation salary rules.
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
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-[#7743db] hover:bg-[#6334b8] text-white shadow-sm shadow-indigo-200 transition"
          >
            <Plus className="w-4 h-4" />
            New Structure
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-700 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search structure by name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7743db]/20 focus:border-[#7743db] text-slate-900"
          />
        </div>
      </div>

      {/* Structures Grid */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <RefreshCw className="w-8 h-8 animate-spin text-[#7743db] mx-auto mb-3" />
          <p className="text-sm text-slate-500">Loading salary structures...</p>
        </div>
      ) : filteredStructures.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-900">No salary structures found</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            {search ? "No structures match your search term." : "Create your first compensation structure to begin running payroll batches."}
          </p>
          {!search && (
            <button
              onClick={openCreateModal}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-[#7743db] hover:bg-[#6334b8] text-white transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Create Structure
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStructures.map((struct) => {
            const ruleCount = Array.isArray(struct.rule_ids)
              ? struct.rule_ids.length
              : Array.isArray(struct.rules)
              ? struct.rules.length
              : 0;

            return (
              <div
                key={struct.id}
                className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2.5 rounded-xl bg-[#f6f2fd] text-[#7743db]">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-base">
                          {struct.name}
                        </h3>
                        <span className="font-mono text-xs font-semibold text-[#7743db] bg-[#f6f2fd] px-2 py-0.5 rounded border border-indigo-100">
                          {struct.code}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 line-clamp-2 mb-4">
                    {struct.description || "Standard company compensation structure configuration."}
                  </p>

                  <div className="border-t border-slate-100 pt-3 mt-3">
                    <div className="flex items-center justify-between text-xs text-slate-600 mb-2">
                      <span className="font-medium">Assigned Rules:</span>
                      <span className="font-bold text-slate-900">{ruleCount} Rules</span>
                    </div>

                    {struct.rules && struct.rules.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {struct.rules.slice(0, 4).map((r) => (
                          <span
                            key={r.id}
                            className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700"
                          >
                            {r.name || r.code}
                          </span>
                        ))}
                        {struct.rules.length > 4 && (
                          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-500">
                            +{struct.rules.length - 4} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4 mt-6">
                  <button
                    onClick={() => openEditModal(struct)}
                    className="p-2 rounded-lg text-slate-600 hover:text-[#7743db] hover:bg-slate-100 transition"
                    title="Edit Structure"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(struct.id, struct.name)}
                    className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                    title="Delete Structure"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {modalMode === "create" ? "Create Salary Structure" : "Edit Salary Structure"}
                </h3>
                <p className="text-xs text-slate-500">
                  Configure structure metadata and select computation rules
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Structure Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Standard Full-Time Staff"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#7743db]/20 focus:border-[#7743db]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Structure Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. STRUCT_FT"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full font-mono uppercase px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#7743db]/20 focus:border-[#7743db]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Optional brief description of this compensation framework..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#7743db]/20 focus:border-[#7743db]"
                />
              </div>

              {/* Salary Rules Multi-select */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-700">
                    Include Salary Rules ({formData.rule_ids.length} selected)
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        rule_ids:
                          prev.rule_ids.length === allRules.length ? [] : allRules.map((r) => r.id),
                      }))
                    }
                    className="text-xs text-[#7743db] hover:underline"
                  >
                    {formData.rule_ids.length === allRules.length ? "Deselect All" : "Select All"}
                  </button>
                </div>

                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 p-1 bg-slate-50/50">
                  {allRules.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">
                      No salary rules found in system. Create rules first under Salary Rules page.
                    </div>
                  ) : (
                    allRules.map((rule) => {
                      const isSelected = formData.rule_ids.includes(rule.id);
                      return (
                        <div
                          key={rule.id}
                          onClick={() => toggleRuleSelection(rule.id)}
                          className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition ${
                            isSelected
                              ? "bg-[#f6f2fd]/80"
                              : "hover:bg-slate-100/60"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-4 h-4 rounded border flex items-center justify-center ${
                                isSelected
                                  ? "bg-[#7743db] border-indigo-600 text-white"
                                  : "border-slate-300"
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <div>
                              <span className="font-semibold text-xs text-slate-900">
                                {rule.name}
                              </span>
                              <span className="ml-2 font-mono text-[10px] text-slate-400">
                                {rule.code}
                              </span>
                            </div>
                          </div>
                          <span className="text-[11px] capitalize text-slate-500">
                            {rule.category || rule.type}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
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
                  ) : modalMode === "create" ? (
                    "Create Structure"
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

