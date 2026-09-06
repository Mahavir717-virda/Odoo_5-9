import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  UserPlus,
  Upload,
  Download,
  List,
  LayoutGrid,
  MoreVertical,
  Eye,
  Pencil,
  UserX,
  Trash2,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

import { usePermissions } from "../../hooks/usePermissions";
import PermissionGuard from "../../components/common/PermissionGuard";
import PageHeader from "../../components/common/PageHeader";
import FilterBar from "../../components/common/FilterBar";
import DataTable from "../../components/common/DataTable";
import StatusBadge from "../../components/common/StatusBadge";
import EmptyState from "../../components/common/EmptyState";
import EmployeeCard from "../../components/employees/EmployeeCard";

import { Button } from "../../components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
import { Skeleton } from "../../components/ui/skeleton";
import { Card } from "../../components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";

import * as employeeService from "../../services/employeeService";

// Predefined static options per specification
const DEPARTMENT_OPTIONS = [
  { value: "Engineering", label: "Engineering" },
  { value: "HR", label: "HR" },
  { value: "Finance", label: "Finance" },
  { value: "Sales", label: "Sales" },
  { value: "Marketing", label: "Marketing" },
];

const STATUS_OPTIONS = [
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
  { value: "On Leave", label: "On Leave" },
];

const EMPLOYEE_TYPE_OPTIONS = [
  { value: "Full-time", label: "Full-time" },
  { value: "Part-time", label: "Part-time" },
  { value: "Contract", label: "Contract" },
];

/**
 * Helper to derive unique managers from employee dataset
 */
function deriveManagerOptions(employeeList) {
  const managersMap = new Map();

  employeeList.forEach((emp) => {
    if (emp.managerId && emp.managerName) {
      if (!managersMap.has(emp.managerId)) {
        managersMap.set(emp.managerId, {
          value: emp.managerId,
          label: emp.managerName,
        });
      }
    }
  });

  return Array.from(managersMap.values());
}

/**
 * Helper to extract initials
 */
function getInitials(firstName, lastName) {
  const f = firstName ? firstName[0] : "";
  const l = lastName ? lastName[0] : "";
  return `${f}${l}`.toUpperCase() || "U";
}

export default function EmployeesListPage() {
  const navigate = useNavigate();
  const { can } = usePermissions();

  // Kanban pagination config — prevents 5000 DOM nodes from mounting at once
  const KANBAN_PAGE_SIZE = 24;
  const [kanbanPage, setKanbanPage] = useState(1);

  // Data & View state
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState("list"); // "list" | "kanban"
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Filter state
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [department, setDepartment] = useState("all");
  const [status, setStatus] = useState("all");
  const [employeeType, setEmployeeType] = useState("all");
  const [managerId, setManagerId] = useState("all");

  // Manager dropdown options derived dynamically from data
  const [managerOptions, setManagerOptions] = useState([]);

  // Debounce search input by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Initial load to discover manager list
  useEffect(() => {
    let isMounted = true;
    employeeService
      .getEmployees()
      .then((allData) => {
        if (isMounted) {
          const managers = deriveManagerOptions(allData);
          setManagerOptions(managers);
        }
      })
      .catch((err) => {
        console.error("Failed to load initial manager options:", err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch filtered employees
  useEffect(() => {
    let isCancelled = false;

    employeeService
      .getEmployees({
        search: debouncedSearch,
        department,
        status,
        employeeType,
        managerId,
      })
      .then((data) => {
        if (!isCancelled) {
          setEmployees(data);
          setError(null);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          setError(err.message || "Failed to load employees.");
          setLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [debouncedSearch, department, status, employeeType, managerId, refreshTrigger]);

  // Reset kanban page when filters change (so user sees fresh results from top)
  useEffect(() => {
    setKanbanPage(1);
  }, [debouncedSearch, department, status, employeeType, managerId]);

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    setRefreshTrigger((prev) => prev + 1);
  };

  // Reset all filters
  const handleClearAllFilters = () => {
    setSearchInput("");
    setDebouncedSearch("");
    setDepartment("all");
    setStatus("all");
    setEmployeeType("all");
    setManagerId("all");
  };

  // Deactivate or reactivate an employee
  const handleDeactivate = async (emp) => {
    const isInactive = emp.status?.toLowerCase() === "inactive";
    const action = isInactive ? "reactivate" : "deactivate";
    if (!window.confirm(`${isInactive ? "Reactivate" : "Deactivate"} ${emp.firstName} ${emp.lastName}?`)) return;
    try {
      if (isInactive) {
        await employeeService.reactivateEmployee(emp.id);
      } else {
        await employeeService.deactivateEmployee(emp.id);
      }
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      alert(err.message || `Failed to ${action} employee.`);
    }
  };


  // Columns configuration for DataTable
  const columns = useMemo(
    () => [
      {
        key: "name",
        header: "Employee",
        sortable: true,
        render: (row) => (
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 border border-border shrink-0">
              <AvatarImage src={row.avatarUrl} alt={`${row.firstName} ${row.lastName}`} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                {getInitials(row.firstName, row.lastName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <span className="font-medium text-foreground block truncate">
                {row.firstName} {row.lastName}
              </span>
              <span className="text-xs text-muted-foreground block truncate">
                {row.email}
              </span>
            </div>
          </div>
        ),
      },
      {
        key: "employeeId",
        header: "Employee ID",
        sortable: true,
        render: (row) => (
          <span className="font-mono text-xs text-muted-foreground">
            {row.employeeId}
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
        header: "Job Position",
        sortable: true,
      },
      {
        key: "managerName",
        header: "Manager",
        sortable: true,
        render: (row) => row.managerName || <span className="text-muted-foreground">â€”</span>,
      },
      {
        key: "workSchedule",
        header: "Work Schedule",
        sortable: true,
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
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem
                  onClick={() => navigate(`/employees/${row.id}`)}
                  className="text-xs cursor-pointer gap-2"
                >
                  <Eye className="h-3.5 w-3.5" />
                  View Details
                </DropdownMenuItem>
                {can("employee.edit") && (
                  <DropdownMenuItem
                    onClick={() => navigate(`/employees/${row.id}/edit`)}
                    className="text-xs cursor-pointer gap-2"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </DropdownMenuItem>
                )}
                {can("employee.delete") && (
                  <DropdownMenuItem
                    onClick={() => handleDeactivate(row)}
                    className="text-xs cursor-pointer gap-2 text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {row.status?.toLowerCase() === "inactive" ? "Reactivate" : "Deactivate"}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [can, navigate]
  );

  // Reusable EmptyState config
  const emptyStateConfig = {
    icon: debouncedSearch || department !== "all" || status !== "all" || employeeType !== "all" || managerId !== "all"
      ? UserX
      : Users,
    title: "No employees found",
    description:
      "Try adjusting your filters or add your first employee to get started.",
    actionLabel: can("employee.create") ? "Add Employee" : null,
    onAction: can("employee.create") ? () => navigate("/employees/new") : null,
  };

  const handleExportCSV = () => {
    if (!employees || employees.length === 0) return;
    const headers = ["ID", "Name", "Email", "Phone", "Department", "Job Position", "Employee Type", "Joining Date", "Status"];
    const rows = employees.map((e) => [
      e.id,
      `"${(e.name || "").replace(/"/g, '""')}"`,
      `"${(e.email || "").replace(/"/g, '""')}"`,
      `"${(e.phone || "").replace(/"/g, '""')}"`,
      `"${(e.department || "").replace(/"/g, '""')}"`,
      `"${(e.job_position || "").replace(/"/g, '""')}"`,
      `"${(e.employee_type || "").replace(/"/g, '""')}"`,
      `"${(e.joining_date ? e.joining_date.split("T")[0] : "")}"`,
      `"${(e.status || "")}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `employees_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <PageHeader
        title="Employees"
        subtitle="Manage your organization's workforce"
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => alert("Import coming soon")}
              className="text-xs gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              Import
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="text-xs gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Export
            </Button>
            <PermissionGuard permission="employee.create">
              <Button
                size="sm"
                onClick={() => navigate("/employees/new")}
                className="text-xs gap-1.5 shadow-sm"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Add Employee
              </Button>
            </PermissionGuard>
          </>
        }
      />

      {/* Toolbar: FilterBar + View Toggle */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <FilterBar
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          searchPlaceholder="Search by name, email, or ID..."
          filters={[
            {
              key: "department",
              label: "Department",
              options: DEPARTMENT_OPTIONS,
              value: department,
              onChange: (val) => {
                setLoading(true);
                setDepartment(val);
              },
            },
            {
              key: "status",
              label: "Status",
              options: STATUS_OPTIONS,
              value: status,
              onChange: (val) => {
                setLoading(true);
                setStatus(val);
              },
            },
            {
              key: "employeeType",
              label: "Type",
              options: EMPLOYEE_TYPE_OPTIONS,
              value: employeeType,
              onChange: (val) => {
                setLoading(true);
                setEmployeeType(val);
              },
            },
            {
              key: "manager",
              label: "Manager",
              options: managerOptions,
              value: managerId,
              onChange: (val) => {
                setLoading(true);
                setManagerId(val);
              },
            },
          ]}
          onClearAll={handleClearAllFilters}
          className="flex-1"
        />

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border border-border shrink-0 self-end lg:self-center">
          <Button
            variant={view === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("list")}
            className="h-8 px-3 text-xs gap-1.5"
            title="List View"
          >
            <List className="w-3.5 h-3.5" />
            List
          </Button>
          <Button
            variant={view === "kanban" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("kanban")}
            className="h-8 px-3 text-xs gap-1.5"
            title="Kanban View"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            Kanban
          </Button>
        </div>
      </div>

      {/* Content: List or Kanban */}
      {view === "list" ? (
        <DataTable
          columns={columns}
          data={employees}
          loading={loading}
          error={error}
          onRetry={handleRetry}
          emptyState={emptyStateConfig}
          onRowClick={(row) => navigate(`/employees/${row.id}`)}
          pageSize={10}
        />
      ) : (
        /* Kanban View */
        <div className="space-y-4">
          {/* Kanban Loading Skeletons */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, idx) => (
                <Card key={`kanban-skeleton-${idx}`} className="p-5 space-y-4 border border-border">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-11 w-11 rounded-full" />
                      <div className="space-y-1.5">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                  <div className="space-y-2 pt-2 border-t border-border/40">
                    <Skeleton className="h-3 w-40" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-border/40">
                    <Skeleton className="h-5 w-20 rounded-md" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Kanban Error State */}
          {!loading && error && (
            <Card className="p-12 text-center border-border">
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    Failed to load employees
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{error}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetry}
                  className="mt-2 text-xs gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Retry
                </Button>
              </div>
            </Card>
          )}

          {/* Kanban Empty State */}
          {!loading && !error && employees.length === 0 && (
            <EmptyState
              icon={emptyStateConfig.icon}
              title={emptyStateConfig.title}
              description={emptyStateConfig.description}
              actionLabel={emptyStateConfig.actionLabel}
              onAction={emptyStateConfig.onAction}
            />
          )}

          {/* Kanban Cards Grid — only renders kanbanPage * KANBAN_PAGE_SIZE cards */}
          {!loading && !error && employees.length > 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {employees.slice(0, kanbanPage * KANBAN_PAGE_SIZE).map((employee) => (
                  <EmployeeCard
                    key={employee.id}
                    employee={employee}
                    onClick={(emp) => navigate(`/employees/${emp.id}`)}
                  />
                ))}
              </div>

              {/* Load More footer */}
              {employees.length > kanbanPage * KANBAN_PAGE_SIZE && (
                <div className="flex flex-col items-center gap-1.5 pt-4">
                  <p className="text-xs text-muted-foreground">
                    Showing <span className="font-medium text-foreground">{Math.min(kanbanPage * KANBAN_PAGE_SIZE, employees.length)}</span> of{" "}
                    <span className="font-medium text-foreground">{employees.length}</span> employees
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setKanbanPage((p) => p + 1)}
                    className="text-xs gap-1.5"
                  >
                    Load More
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

