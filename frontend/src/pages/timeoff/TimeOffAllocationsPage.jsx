import { useState, useEffect, useMemo } from "react";
import {
  Calendar,
  Plus,
  Pencil,
  CheckCircle2,
  AlertCircle,
  X,
  PieChart,
  UserCheck,
} from "lucide-react";

import PageHeader from "../../components/common/PageHeader";
import FilterBar from "../../components/common/FilterBar";
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
import * as employeeService from "../../services/employeeService";

export default function TimeOffAllocationsPage() {
  const [allocations, setAllocations] = useState([]);
  const [types, setTypes] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAllocation, setEditingAllocation] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [toastMessage, setToastMessage] = useState("");

  // Form Fields
  const [selectedEmpId, setSelectedEmpId] = useState("");
  const [selectedTypeId, setSelectedTypeId] = useState("");
  const [allocatedDays, setAllocatedDays] = useState("20");

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [allocRes, typesRes, empRes] = await Promise.all([
        managerTimeOffService.listAllocations({ limit: 100 }),
        managerTimeOffService.listTimeOffTypes().catch(() => []),
        employeeService.getEmployees().catch(() => []),
      ]);

      setAllocations(allocRes.data || []);
      setTypes(typesRes || []);
      setEmployees(empRes || []);
    } catch (err) {
      setError(err.message || "Failed to load leave allocations");
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
    setEditingAllocation(null);
    setSelectedEmpId(employees.length > 0 ? String(employees[0].id) : "");
    setSelectedTypeId(types.length > 0 ? String(types[0].id) : "");
    setAllocatedDays("20");
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (alloc) => {
    setEditingAllocation(alloc);
    setSelectedEmpId(String(alloc.employee_id));
    setSelectedTypeId(String(alloc.type_id));
    setAllocatedDays(String(alloc.allocated));
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedEmpId || !selectedTypeId || !allocatedDays) {
      setFormError("Please fill out all fields.");
      return;
    }

    setSubmitting(true);
    try {
      if (editingAllocation) {
        await managerTimeOffService.updateAllocation(editingAllocation.id, {
          allocated: parseFloat(allocatedDays),
        });
        showToast("Allocation updated successfully.");
      } else {
        await managerTimeOffService.createAllocation({
          employee_id: selectedEmpId,
          type_id: selectedTypeId,
          allocated: parseFloat(allocatedDays),
        });
        showToast("Leave allocation granted successfully.");
      }

      setIsModalOpen(false);
      loadData();
    } catch (err) {
      setFormError(err.message || "Failed to save allocation.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredAllocations = useMemo(() => {
    return allocations.filter((a) => {
      const matchSearch =
        !search.trim() ||
        (a.employee_name || "").toLowerCase().includes(search.toLowerCase()) ||
        (a.type_name || "").toLowerCase().includes(search.toLowerCase());

      const matchType =
        selectedTypeFilter === "all" || String(a.type_id) === String(selectedTypeFilter);

      return matchSearch && matchType;
    });
  }, [allocations, search, selectedTypeFilter]);

  // KPI Metrics
  const stats = useMemo(() => {
    let totalAlloc = 0;
    let totalTaken = 0;
    let totalRemaining = 0;

    allocations.forEach((a) => {
      totalAlloc += parseFloat(a.allocated || 0);
      totalTaken += parseFloat(a.taken || 0);
      totalRemaining += parseFloat(a.remaining || 0);
    });

    return {
      count: allocations.length,
      totalAlloc,
      totalTaken,
      totalRemaining,
    };
  }, [allocations]);

  const typeFilterOptions = useMemo(() => {
    return types.map((t) => ({
      value: String(t.id),
      label: t.name,
    }));
  }, [types]);

  const columns = useMemo(
    () => [
      {
        key: "employee",
        header: "Employee",
        sortable: true,
        render: (row) => (
          <div>
            <span className="font-semibold text-xs text-foreground block">
              {row.employee_name || `Employee #${row.employee_id}`}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {row.department || "General"}
            </span>
          </div>
        ),
      },
      {
        key: "type_name",
        header: "Leave Type",
        sortable: true,
        render: (row) => (
          <span className="font-medium text-xs text-foreground">
            {row.type_name || row.time_off_type_name || "Leave"}
          </span>
        ),
      },
      {
        key: "allocated",
        header: "Allocated",
        sortable: true,
        render: (row) => (
          <span className="text-xs font-mono font-medium">
            {parseFloat(row.allocated || 0)} {row.unit || "days"}
          </span>
        ),
      },
      {
        key: "taken",
        header: "Taken / Used",
        sortable: true,
        render: (row) => (
          <span className="text-xs font-mono text-muted-foreground">
            {parseFloat(row.taken || 0)} {row.unit || "days"}
          </span>
        ),
      },
      {
        key: "remaining",
        header: "Remaining Balance",
        sortable: true,
        render: (row) => (
          <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
            {parseFloat(row.remaining || 0)} {row.unit || "days"}
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
            title="Edit Allocation"
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
        title="Time Off Allocations"
        subtitle="Manage employee leave quotas, annual leave balances, and entitlement pools."
        actions={
          <Button onClick={handleOpenCreateModal} size="sm" className="gap-1.5 shadow-xs">
            <Plus className="w-4 h-4" />
            Grant Allocation
          </Button>
        }
      />

      {toastMessage && (
        <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 flex items-center gap-2.5 text-xs font-medium animate-in fade-in-50">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-border bg-card shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Active Allocations</p>
              <p className="text-2xl font-bold text-foreground mt-0.5">{stats.count}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600">
              <Calendar className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Total Days Allocated</p>
              <p className="text-2xl font-bold text-foreground mt-0.5">{stats.totalAlloc}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600">
              <Plus className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Days Utilized</p>
              <p className="text-2xl font-bold text-amber-600 mt-0.5">{stats.totalTaken}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600">
              <PieChart className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Remaining Days Pool</p>
              <p className="text-2xl font-bold text-emerald-600 mt-0.5">{stats.totalRemaining}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by employee name or leave type..."
        filters={[
          {
            key: "type",
            label: "Leave Type",
            value: selectedTypeFilter,
            options: typeFilterOptions,
            onChange: setSelectedTypeFilter,
          },
        ]}
        onClearAll={() => {
          setSearch("");
          setSelectedTypeFilter("all");
        }}
      />

      {/* Allocations Table */}
      <DataTable
        columns={columns}
        data={filteredAllocations}
        loading={loading}
        error={error}
        onRetry={loadData}
        emptyState={{
          icon: Calendar,
          title: "No Allocations Found",
          description: "No employee leave balances match your active filters.",
          actionLabel: "Grant Allocation",
          onAction: handleOpenCreateModal,
        }}
        pageSize={15}
      />

      {/* Grant / Edit Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="w-full max-w-lg border-border bg-card shadow-xl animate-in zoom-in-95">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                {editingAllocation ? "Edit Leave Allocation" : "Grant Employee Leave Allocation"}
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

                <FormField label="Employee" required>
                  <Select
                    value={selectedEmpId}
                    onValueChange={setSelectedEmpId}
                    disabled={Boolean(editingAllocation)}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((emp) => (
                        <SelectItem key={emp.id} value={String(emp.id)} className="text-xs">
                          {emp.name || `${emp.firstName} ${emp.lastName}`} • {emp.department}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField label="Leave Type" required>
                  <Select
                    value={selectedTypeId}
                    onValueChange={setSelectedTypeId}
                    disabled={Boolean(editingAllocation)}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Select leave type" />
                    </SelectTrigger>
                    <SelectContent>
                      {types.map((t) => (
                        <SelectItem key={t.id} value={String(t.id)} className="text-xs">
                          {t.name} ({t.unit})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField label="Allocated Days" required>
                  <Input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={allocatedDays}
                    onChange={(e) => setAllocatedDays(e.target.value)}
                    className="h-9 text-xs font-mono"
                  />
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
                  {submitting ? "Saving..." : editingAllocation ? "Update Allocation" : "Grant Allocation"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
