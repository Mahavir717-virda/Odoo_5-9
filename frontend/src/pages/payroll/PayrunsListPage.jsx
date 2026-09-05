import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  DollarSign,
  Plus,
  Play,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  Eye,
  Trash2,
  Clock,
} from "lucide-react";

import PageHeader from "../../components/common/PageHeader";
import FilterBar from "../../components/common/FilterBar";
import DataTable from "../../components/common/DataTable";
import StatusBadge from "../../components/common/StatusBadge";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";

import * as payrollManagerService from "../../services/payrollManagerService";

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "computed", label: "Computed" },
  { value: "validated", label: "Validated" },
  { value: "paid", label: "Paid" },
];

export default function PayrunsListPage() {
  const navigate = useNavigate();
  const [payruns, setPayruns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [toastMessage, setToastMessage] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await payrollManagerService.listPayruns({
        status: statusFilter,
        limit: 100,
      });
      setPayruns(res.data || []);
    } catch (err) {
      setError(err.message || "Failed to load payruns");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this draft payrun?")) return;
    try {
      await payrollManagerService.deletePayrun(id);
      showToast("Payrun deleted.");
      loadData();
    } catch (err) {
      alert(err.message || "Failed to delete payrun.");
    }
  };

  const filteredPayruns = useMemo(() => {
    if (!search.trim()) return payruns;
    const q = search.trim().toLowerCase();
    return payruns.filter(
      (p) =>
        (p.name || "").toLowerCase().includes(q) ||
        (p.structure_name || "").toLowerCase().includes(q)
    );
  }, [payruns, search]);

  // KPI Metrics
  const stats = useMemo(() => {
    let draft = 0;
    let computed = 0;
    let validated = 0;
    let paid = 0;

    payruns.forEach((p) => {
      const s = (p.status || "").toLowerCase();
      if (s === "draft") draft++;
      else if (s === "computed") computed++;
      else if (s === "validated") validated++;
      else if (s === "paid") paid++;
    });

    return { total: payruns.length, draft, computed, validated, paid };
  }, [payruns]);

  const columns = useMemo(
    () => [
      {
        key: "name",
        header: "Payrun Batch Name",
        sortable: true,
        render: (row) => (
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <span className="font-semibold text-xs text-foreground block">
                {row.name}
              </span>
              <span className="text-[11px] text-muted-foreground font-mono">
                PR-{String(row.id).padStart(4, "0")}
              </span>
            </div>
          </div>
        ),
      },
      {
        key: "period",
        header: "Pay Period",
        sortable: true,
        render: (row) => (
          <div className="text-xs text-foreground font-mono">
            <span>{row.period_start ? row.period_start.split("T")[0] : "—"}</span>
            <span className="text-muted-foreground mx-1">→</span>
            <span>{row.period_end ? row.period_end.split("T")[0] : "—"}</span>
          </div>
        ),
      },
      {
        key: "structure_name",
        header: "Salary Structure",
        sortable: true,
        render: (row) => (
          <span className="text-xs text-muted-foreground">
            {row.structure_name || "Standard Structure"}
          </span>
        ),
      },
      {
        key: "payslips_count",
        header: "Generated Slips",
        sortable: true,
        render: (row) => (
          <span className="text-xs font-mono font-bold text-foreground">
            {row.payslips_count !== undefined ? row.payslips_count : (row.status === "draft" ? "0" : "—")}
          </span>
        ),
      },
      {
        key: "status",
        header: "Status",
        sortable: true,
        render: (row) => <StatusBadge status={row.status} />,
      },
      {
        key: "actions",
        header: "Actions",
        width: "120px",
        render: (row) => (
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(`/payroll/payruns/${row.id}`)}
              className="h-7 px-2 text-xs gap-1"
            >
              <Eye className="w-3.5 h-3.5" />
              Manage
            </Button>
            {row.status === "draft" && (
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => handleDelete(row.id, e)}
                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto">
      <PageHeader
        title="Payroll Payruns"
        subtitle="Batch compute salaries, review deductions, validate payruns, and confirm disbursements."
        actions={
          <Button
            onClick={() => navigate("/payroll/payruns/new")}
            size="sm"
            className="gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Create Payrun Batch
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
              <p className="text-xs font-medium text-muted-foreground">Draft Batches</p>
              <p className="text-2xl font-bold text-foreground mt-0.5">{stats.draft}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Computed / Ready</p>
              <p className="text-2xl font-bold text-blue-600 mt-0.5">{stats.computed}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600">
              <Play className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Validated</p>
              <p className="text-2xl font-bold text-indigo-600 mt-0.5">{stats.validated}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Disbursed / Paid</p>
              <p className="text-2xl font-bold text-emerald-600 mt-0.5">{stats.paid}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
              <DollarSign className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search payruns by batch name or structure..."
        filters={[
          {
            key: "status",
            label: "Status",
            value: statusFilter,
            options: STATUS_OPTIONS,
            onChange: setStatusFilter,
          },
        ]}
        onClearAll={() => {
          setSearch("");
          setStatusFilter("all");
        }}
      />

      {/* Payruns Table */}
      <DataTable
        columns={columns}
        data={filteredPayruns}
        loading={loading}
        error={error}
        onRetry={loadData}
        onRowClick={(row) => navigate(`/payroll/payruns/${row.id}`)}
        emptyState={{
          icon: DollarSign,
          title: "No Payruns Found",
          description: "No payroll batches match your current search criteria.",
          actionLabel: "Create Payrun Batch",
          onAction: () => navigate("/payroll/payruns/new"),
        }}
        pageSize={15}
      />
    </div>
  );
}
