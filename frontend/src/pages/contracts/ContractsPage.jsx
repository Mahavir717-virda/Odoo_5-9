import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FileText, Plus, Eye, Pencil, MoreVertical } from "lucide-react";

import PageHeader from "../../components/common/PageHeader";
import FilterBar from "../../components/common/FilterBar";
import DataTable from "../../components/common/DataTable";
import StatusBadge from "../../components/common/StatusBadge";
import PermissionGuard from "../../components/common/PermissionGuard";
import { Button } from "../../components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";

import { PERMISSIONS } from "../../utils/permissions";
import * as contractService from "../../services/contractService";

const DEPARTMENT_OPTIONS = [
  { value: "Engineering", label: "Engineering" },
  { value: "HR", label: "HR" },
  { value: "Finance", label: "Finance" },
  { value: "Sales", label: "Sales" },
  { value: "Marketing", label: "Marketing" },
];

const STATUS_OPTIONS = [
  { value: "Active", label: "Active" },
  { value: "Draft", label: "Draft" },
  { value: "Expired", label: "Expired" },
  { value: "Cancelled", label: "Cancelled" },
];

/**
 * Format currency to Indian Rupee (INR)
 */
function formatCurrency(amount) {
  if (amount == null) return "â€”";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format ISO date string into readable format (e.g. "Jan 15, 2024")
 */
function formatDate(dateString) {
  if (!dateString) return "â€”";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
}

export default function ContractsPage() {
  const navigate = useNavigate();

  // Data & State
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Filters State
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Dynamic Employee Filter Options
  const [employeeOptions, setEmployeeOptions] = useState([]);

  // Debounce search input by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Initial load to derive unique employees who have contracts
  useEffect(() => {
    let isMounted = true;
    contractService
      .getContracts()
      .then((allContracts) => {
        if (isMounted) {
          const empMap = new Map();
          allContracts.forEach((con) => {
            if (con.employeeId && con.employeeName && !empMap.has(con.employeeId)) {
              empMap.set(con.employeeId, {
                value: con.employeeId,
                label: con.employeeName,
              });
            }
          });
          setEmployeeOptions(Array.from(empMap.values()));
        }
      })
      .catch((err) => {
        console.error("Failed to load employee contract options:", err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch filtered contracts
  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setError(null);

    contractService
      .getContracts({
        search: debouncedSearch,
        employeeId: employeeFilter,
        department: departmentFilter,
        status: statusFilter,
      })
      .then((data) => {
        if (!isCancelled) {
          setContracts(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          setError(err.message || "Failed to load contracts.");
          setLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [debouncedSearch, employeeFilter, departmentFilter, statusFilter, refreshTrigger]);

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleClearAllFilters = () => {
    setSearchInput("");
    setDebouncedSearch("");
    setEmployeeFilter("all");
    setDepartmentFilter("all");
    setStatusFilter("all");
  };

  // DataTable columns
  const columns = useMemo(
    () => [
      {
        key: "contractId",
        header: "Contract ID",
        sortable: true,
        render: (row) => (
          <span className="font-mono text-xs font-medium text-foreground">
            {row.contractId}
          </span>
        ),
      },
      {
        key: "employeeName",
        header: "Employee",
        sortable: true,
        render: (row) => (
          <span className="font-medium text-foreground">
            {row.employeeName}
          </span>
        ),
      },
      {
        key: "department",
        header: "Department",
        sortable: true,
      },
      {
        key: "jobPosition",
        header: "Position",
        sortable: true,
        render: (row) => (
          <span className="text-muted-foreground">{row.jobPosition}</span>
        ),
      },
      {
        key: "startDate",
        header: "Start Date",
        sortable: true,
        render: (row) => formatDate(row.startDate),
      },
      {
        key: "endDate",
        header: "End Date",
        sortable: true,
        render: (row) =>
          row.endDate ? (
            formatDate(row.endDate)
          ) : (
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
              Running
            </span>
          ),
      },
      {
        key: "wage",
        header: "Wage / Month",
        sortable: true,
        render: (row) => (
          <span className="font-semibold text-foreground">
            {formatCurrency(row.wage)}
          </span>
        ),
      },
      {
        key: "salaryStructure",
        header: "Salary Structure",
        sortable: true,
        render: (row) => (
          <span className="text-xs text-muted-foreground">
            {row.salaryStructure}
          </span>
        ),
      },
      {
        key: "status",
        header: "Status",
        sortable: true,
        render: (row) => {
          const isActive = String(row.status).toLowerCase() === "active";
          return (
            <div className="flex items-center gap-2">
              <StatusBadge status={row.status} />
              {isActive && (
                <motion.span
                  className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  title="Active running contract"
                />
              )}
            </div>
          );
        },
      },
      {
        key: "actions",
        header: "Actions",
        width: "80px",
        render: (row) => (
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
              <DropdownMenuContent align="end" className="w-36">
                <DropdownMenuItem
                  onClick={() => navigate(`/contracts/${row.id}`)}
                  className="text-xs cursor-pointer gap-2"
                >
                  <Eye className="h-3.5 w-3.5" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => navigate(`/contracts/${row.id}/edit`)}
                  className="text-xs cursor-pointer gap-2"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [navigate]
  );

  const emptyStateConfig = {
    icon: FileText,
    title: "No contracts found",
    description: "Try adjusting your filters.",
    actionLabel: "Add Contract",
    onAction: () => navigate("/contracts/new"),
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <PageHeader
        title="Contracts"
        subtitle="Track employment contracts and their applicable payroll periods"
        actions={
          <PermissionGuard permission={PERMISSIONS.CONTRACT.MANAGE}>
            <Button
              size="sm"
              onClick={() => navigate("/contracts/new")}
              className="text-xs gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Contract
            </Button>
          </PermissionGuard>
        }
      />

      {/* Filter Bar */}
      <FilterBar
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="Search by contract ID, employee, or position..."
        filters={[
          {
            key: "employee",
            label: "Employee",
            options: employeeOptions,
            value: employeeFilter,
            onChange: (val) => {
              setLoading(true);
              setEmployeeFilter(val);
            },
          },
          {
            key: "department",
            label: "Department",
            options: DEPARTMENT_OPTIONS,
            value: departmentFilter,
            onChange: (val) => {
              setLoading(true);
              setDepartmentFilter(val);
            },
          },
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

      {/* Contracts Table */}
      <DataTable
        columns={columns}
        data={contracts}
        loading={loading}
        error={error}
        onRetry={handleRetry}
        emptyState={emptyStateConfig}
        onRowClick={(row) => navigate(`/contracts/${row.id}`)}
        pageSize={10}
      />
    </div>
  );
}

