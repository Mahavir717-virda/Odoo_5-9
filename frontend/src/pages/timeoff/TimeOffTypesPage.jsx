import { useState, useEffect, useMemo } from "react";
import {
  Calendar,
  Plus,
  Pencil,
  CheckCircle2,
  AlertCircle,
  X,
  Layers,
  Sparkles,
} from "lucide-react";

import PageHeader from "../../components/common/PageHeader";
import DataTable from "../../components/common/DataTable";
import FormField from "../../components/common/FormField";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";

import * as managerTimeOffService from "../../services/managerTimeOffService";

export default function TimeOffTypesPage() {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [toastMessage, setToastMessage] = useState("");

  // Form Fields
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("days");
  const [requiresAllocation, setRequiresAllocation] = useState("true");
  const [affectsPayroll, setAffectsPayroll] = useState("false");

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await managerTimeOffService.listTimeOffTypes();
      setTypes(data || []);
    } catch (err) {
      setError(err.message || "Failed to load leave types");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  const handleOpenCreateModal = () => {
    setEditingType(null);
    setName("");
    setUnit("days");
    setRequiresAllocation("true");
    setAffectsPayroll("false");
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (t) => {
    setEditingType(t);
    setName(t.name);
    setUnit(t.unit || "days");
    setRequiresAllocation(t.requires_allocation ? "true" : "false");
    setAffectsPayroll(t.affects_payroll ? "true" : "false");
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError("Type name is required.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        unit,
        requires_allocation: requiresAllocation === "true",
        affects_payroll: affectsPayroll === "true",
      };

      if (editingType) {
        await managerTimeOffService.updateTimeOffType(editingType.id, payload);
        showToast("Leave type updated successfully.");
      } else {
        await managerTimeOffService.createTimeOffType(payload);
        showToast("Leave type created successfully.");
      }

      setIsModalOpen(false);
      loadData();
    } catch (err) {
      setFormError(err.message || "Failed to save leave type.");
    } finally {
      setSubmitting(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        key: "name",
        header: "Leave Type Name",
        sortable: true,
        render: (row) => (
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-primary/10 text-primary">
              <Calendar className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold text-xs text-foreground">{row.name}</span>
          </div>
        ),
      },
      {
        key: "unit",
        header: "Accounting Unit",
        sortable: true,
        render: (row) => (
          <span className="text-xs uppercase font-mono px-2 py-0.5 rounded bg-muted">
            {row.unit || "days"}
          </span>
        ),
      },
      {
        key: "requires_allocation",
        header: "Allocation Required",
        sortable: true,
        render: (row) => (
          <span
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
              row.requires_allocation
                ? "bg-blue-50 text-blue-700 border border-blue-200"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {row.requires_allocation ? "Yes (Quota Managed)" : "No (Unlimited)"}
          </span>
        ),
      },
      {
        key: "affects_payroll",
        header: "Payroll Impact",
        sortable: true,
        render: (row) => (
          <span
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
              row.affects_payroll
                ? "bg-rose-50 text-rose-700 border border-rose-200"
                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
            }`}
          >
            {row.affects_payroll ? "Unpaid / Deducts Pay" : "Paid Leave"}
          </span>
        ),
      },
      {
        key: "actions",
        header: "Actions",
        width: "90px",
        render: (row) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenEditModal(row)}
            className="h-7 w-7 p-0"
            title="Edit Type"
          >
            <Pencil className="w-3.5 h-3.5" />
          </Button>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto">
      <PageHeader
        title="Time Off Types"
        subtitle="Define and configure organizational leave categories, accounting units, and payroll rules."
        actions={
          <Button onClick={handleOpenCreateModal} size="sm" className="gap-1.5 shadow-sm">
            <Plus className="w-4 h-4" />
            Create Leave Type
          </Button>
        }
      />

      {toastMessage && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center gap-2.5 text-xs font-medium animate-in fade-in-50">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Types Table */}
      <DataTable
        columns={columns}
        data={types}
        loading={loading}
        error={error}
        onRetry={loadData}
        emptyState={{
          icon: Calendar,
          title: "No Leave Types Defined",
          description: "Create your company's leave categories (e.g. PTO, Sick Leave, Parental Leave).",
          actionLabel: "Create Leave Type",
          onAction: handleOpenCreateModal,
        }}
        pageSize={15}
      />

      {/* Create / Edit Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="w-full max-w-lg border-border bg-card shadow-xl animate-in zoom-in-95">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                {editingType ? "Edit Leave Type" : "Create Leave Type"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <CardContent className="p-6 space-y-4">
                {formError && (
                  <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <FormField label="Leave Type Name" required>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Paid Time Off (PTO), Sick Leave"
                    className="h-9 text-xs"
                  />
                </FormField>

                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Accounting Unit" required>
                    <Select value={unit} onValueChange={setUnit}>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="days" className="text-xs">Days</SelectItem>
                        <SelectItem value="hours" className="text-xs">Hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>

                  <FormField label="Requires Allocation">
                    <Select value={requiresAllocation} onValueChange={setRequiresAllocation}>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true" className="text-xs">Yes (Allocated Pool)</SelectItem>
                        <SelectItem value="false" className="text-xs">No (Unlimited)</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>
                </div>

                <FormField label="Payroll Impact">
                  <Select value={affectsPayroll} onValueChange={setAffectsPayroll}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="false" className="text-xs">Paid Leave (No deduction)</SelectItem>
                      <SelectItem value="true" className="text-xs">Unpaid Leave (Affects Payroll)</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
              </CardContent>

              <div className="p-4 border-t border-border flex items-center justify-end gap-2 bg-muted/20">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={submitting} className="text-xs">
                  {submitting ? "Saving..." : editingType ? "Update Type" : "Create Type"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}

