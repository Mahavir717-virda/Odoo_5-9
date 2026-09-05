import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Clock,
  Plus,
  Pencil,
  MoreVertical,
  CheckCircle2,
  XCircle,
} from "lucide-react";

import PageHeader from "../../components/common/PageHeader";
import FilterBar from "../../components/common/FilterBar";
import DataTable from "../../components/common/DataTable";
import StatusBadge from "../../components/common/StatusBadge";
import { Button } from "../../components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";

import * as scheduleService from "../../services/scheduleService";
import { formatHours } from "../../utils/scheduleCalculations";

const STATUS_OPTIONS = [
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
];

export default function SchedulesPage() {
  const navigate = useNavigate();

  // Data & State
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Filters State
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Debounce search input by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch schedules
  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setError(null);

    scheduleService
      .getSchedules({
        search: debouncedSearch,
        status: statusFilter,
      })
      .then((data) => {
        if (!isCancelled) {
          setSchedules(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          setError(err.message || "Failed to load working schedules.");
          setLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [debouncedSearch, statusFilter, refreshTrigger]);

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleClearAllFilters = () => {
    setSearchInput("");
    setDebouncedSearch("");
    setStatusFilter("all");
  };

  const handleToggleStatus = async (id, e) => {
    e.stopPropagation();
    try {
      await scheduleService.toggleScheduleStatus(id);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      console.error("Failed to toggle schedule status:", err);
    }
  };

  // DataTable columns
  const columns = useMemo(
    () => [
      {
        key: "name",
        header: "Schedule Name",
        sortable: true,
        render: (row) => (
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-primary/10 text-primary shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <span className="font-semibold text-foreground block">
                {row.name}
              </span>
              <span className="text-xs text-muted-foreground block">
                {row.timezone || "Asia/Kolkata"}
              </span>
            </div>
          </div>
        ),
      },
      {
        key: "daysPerWeek",
        header: "Days/Week",
        sortable: true,
        render: (row) => (
          <span className="font-medium text-foreground">
            {row.daysPerWeek} {row.daysPerWeek === 1 ? "day" : "days"} / wk
          </span>
        ),
      },
      {
        key: "weeklyHours",
        header: "Hours/Week",
        sortable: true,
        render: (row) => (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            {formatHours(row.weeklyHours)}
          </span>
        ),
      },
      {
        key: "company",
        header: "Company",
        sortable: true,
        render: (row) => (
          <span className="text-muted-foreground text-sm">
            {row.company}
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
        width: "80px",
        render: (row) => {
          const isActive = row.status === "Active";
          return (
            <div
              onClick={(e) => e.stopPropagation()}
              className="flex items-center justify-end"
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                  >
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">Actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem
                    onClick={() => navigate(`/schedules/${row.id}/edit`)}
                    className="text-xs cursor-pointer gap-2"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit Schedule
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => handleToggleStatus(row.id, e)}
                    className="text-xs cursor-pointer gap-2"
                  >
                    {isActive ? (
                      <>
                        <XCircle className="h-3.5 w-3.5 text-amber-500" />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        Activate
                      </>
                    )}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [navigate]
  );

  const emptyStateConfig = {
    icon: Clock,
    title: "No schedules configured",
    description: "Get started by creating your first working schedule pattern.",
    actionLabel: "New Schedule",
    onAction: () => navigate("/schedules/new"),
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <PageHeader
        title="Working Schedules"
        subtitle="Define weekly working patterns for employees and contracts"
        actions={
          <Button
            size="sm"
            onClick={() => navigate("/schedules/new")}
            className="text-xs gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Schedule
          </Button>
        }
      />

      {/* Filter Bar */}
      <FilterBar
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="Search schedule by name..."
        filters={[
          {
            key: "status",
            label: "Status",
            options: STATUS_OPTIONS,
            value: statusFilter,
            onChange: (val) => {
              setLoading(true);
              setStatusFilter(val);
            },
          },
        ]}
        onClearAll={handleClearAllFilters}
      />

      {/* Schedules Table */}
      <DataTable
        columns={columns}
        data={schedules}
        loading={loading}
        error={error}
        onRetry={handleRetry}
        emptyState={emptyStateConfig}
        onRowClick={(row) => navigate(`/schedules/${row.id}/edit`)}
        pageSize={10}
      />
    </div>
  );
}

