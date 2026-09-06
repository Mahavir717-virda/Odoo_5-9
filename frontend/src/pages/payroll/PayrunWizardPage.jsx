import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  DollarSign,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Users,
  CheckCircle2,
  Search,
  CheckSquare,
  Square,
  Building2,
  Briefcase,
  Loader2,
} from "lucide-react";

import PageHeader from "../../components/common/PageHeader";
import FormField from "../../components/common/FormField";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";

import * as payrollManagerService from "../../services/payrollManagerService";
import * as employeeService from "../../services/employeeService";

export default function PayrunWizardPage() {
  const navigate = useNavigate();

  // Wizard Step State
  const [step, setStep] = useState(1); // 1 = Configuration, 2 = Employee Selection

  const [structures, setStructures] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedEmpIds, setSelectedEmpIds] = useState(new Set());
  const [empSearch, setEmpSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [visibleLimit, setVisibleLimit] = useState(50);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Form State
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0];
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split("T")[0];
  const monthName = today.toLocaleString("en-US", { month: "long", year: "numeric" });

  const [name, setName] = useState(`${monthName} Payroll Batch`);
  const [periodStart, setPeriodStart] = useState(firstDay);
  const [periodEnd, setPeriodEnd] = useState(lastDay);
  const [structureId, setStructureId] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        const [structuresData, empRes] = await Promise.all([
          payrollManagerService.listSalaryStructures().catch(() => []),
          employeeService.getEmployees({ status: "active", limit: 200 }).catch(() => []),
        ]);

        setStructures(structuresData || []);
        if (structuresData && structuresData.length > 0) {
          setStructureId(String(structuresData[0].id));
        }

        const empList = Array.isArray(empRes) ? empRes : (empRes?.employees || empRes?.data || []);
        setEmployees(empList);
        // Start with 0 selected so the user can choose in Step 2 or click Select All
        setSelectedEmpIds(new Set());
      } catch (err) {
        setFormError(err.message || "Failed to load initial wizard data");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Step 1 -> Step 2 validation
  const handleProceedToEmployees = (e) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim() || !periodStart || !periodEnd || !structureId) {
      setFormError("All fields in Step 1 are required.");
      return;
    }

    if (new Date(periodEnd) < new Date(periodStart)) {
      setFormError("Period End Date must be greater than or equal to Start Date.");
      return;
    }

    setStep(2);
  };

  // Toggle single employee
  const toggleEmployee = (id) => {
    setSelectedEmpIds((prev) => {
      const next = new Set(prev);
      if (next.has(String(id))) {
        next.delete(String(id));
      } else {
        next.add(String(id));
      }
      return next;
    });
  };

  // Filtered employees in Step 2
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchesSearch =
        !empSearch.trim() ||
        (emp.name || "").toLowerCase().includes(empSearch.toLowerCase()) ||
        (emp.email || "").toLowerCase().includes(empSearch.toLowerCase()) ||
        (emp.jobPosition || "").toLowerCase().includes(empSearch.toLowerCase());

      const matchesDept =
        deptFilter === "all" ||
        (emp.department || "").toLowerCase() === deptFilter.toLowerCase();

      return matchesSearch && matchesDept;
    });
  }, [employees, empSearch, deptFilter]);

  // Windowed visible employees to prevent UI lag
  const visibleEmployees = useMemo(() => {
    return filteredEmployees.slice(0, visibleLimit);
  }, [filteredEmployees, visibleLimit]);

  // Departments list for filter
  const departments = useMemo(() => {
    const set = new Set(employees.map((e) => e.department).filter(Boolean));
    return Array.from(set);
  }, [employees]);

  // Select/Deselect all filtered
  const handleToggleSelectAll = () => {
    const filteredIds = filteredEmployees.map((e) => String(e.id));
    const allSelected = filteredIds.length > 0 && filteredIds.every((id) => selectedEmpIds.has(id));

    setSelectedEmpIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        filteredIds.forEach((id) => next.delete(id));
      } else {
        filteredIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  // Final Submit
  const handleFinalSubmit = async () => {
    setFormError(null);

    if (selectedEmpIds.size === 0) {
      setFormError("Please select at least 1 employee to include in this payrun batch.");
      return;
    }

    setSubmitting(true);
    try {
      // 1. Create Payrun Batch record
      const created = await payrollManagerService.createPayrun({
        name: name.trim(),
        period_start: periodStart,
        period_end: periodEnd,
        structure_id: structureId,
      });

      // 2. Compute payroll for selected employees
      const employeeIdsArray = Array.from(selectedEmpIds).map((id) => parseInt(id, 10));
      await payrollManagerService.computePayrun(created.id, employeeIdsArray);

      // 3. Navigate directly to Payrun details page
      navigate(`/payroll/payruns/${created.id}`);
    } catch (err) {
      setFormError(err.message || "Failed to initialize and compute payrun.");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[360px] space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground">Loading payroll configuration...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16 max-w-4xl mx-auto">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/payroll/payruns")}
          className="text-xs text-muted-foreground gap-1.5 pl-0"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Payruns
        </Button>
      </div>

      <PageHeader
        title="Create Payrun Batch"
        subtitle="Two-step wizard: configure batch parameters, select eligible employees, and compute payroll."
      />

      {/* Progress Steps Header */}
      <div className="flex items-center justify-between p-4 bg-card border border-border rounded-xl shadow-sm">
        <div className="flex items-center gap-3">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
              step === 1
                ? "bg-primary text-primary-foreground"
                : "bg-emerald-600 text-white"
            }`}
          >
            {step === 2 ? <CheckCircle2 className="w-4 h-4" /> : "1"}
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground">Step 1: Batch Scope</p>
            <p className="text-[11px] text-muted-foreground">Period, Name & Salary Structure</p>
          </div>
        </div>

        <div className="h-0.5 flex-1 mx-4 bg-border/80 max-w-[80px]" />

        <div className="flex items-center gap-3">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
              step === 2
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            2
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground">Step 2: Employee Selection</p>
            <p className="text-[11px] text-muted-foreground">
              {selectedEmpIds.size} of {employees.length} selected
            </p>
          </div>
        </div>
      </div>

      {formError && (
        <div className="p-3.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {/* STEP 1: CONFIGURATION */}
      {step === 1 && (
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="border-b border-border/40 pb-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <DollarSign className="w-4 h-4 text-primary" />
              Batch Configuration & Payroll Period
            </CardTitle>
          </CardHeader>

          <form onSubmit={handleProceedToEmployees}>
            <CardContent className="p-6 space-y-5">
              <FormField label="Payrun Batch Name" required>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. September 2026 Payroll Batch"
                  className="h-9 text-xs"
                />
              </FormField>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Period Start Date" required>
                  <Input
                    type="date"
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                    className="h-9 text-xs"
                  />
                </FormField>

                <FormField label="Period End Date" required>
                  <Input
                    type="date"
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                    className="h-9 text-xs"
                  />
                </FormField>
              </div>

              <FormField label="Default Salary Structure" required>
                <Select value={structureId} onValueChange={setStructureId}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Select salary structure" />
                  </SelectTrigger>
                  <SelectContent>
                    {structures.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)} className="text-xs">
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200/60 text-xs text-blue-900 space-y-1">
                <p className="font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  Two-Step Workflow Note
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Clicking continue will move to Employee Selection without creating records yet. You can review and choose explicitly which staff to process.
                </p>
              </div>
            </CardContent>

            <div className="p-4 border-t border-border flex items-center justify-end gap-2 bg-muted/20">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => navigate("/payroll/payruns")}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" className="text-xs gap-1.5 shadow-sm">
                Continue to Select Employees
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* STEP 2: EMPLOYEE SELECTION */}
      {step === 2 && (
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="border-b border-border/40 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                <Users className="w-4 h-4 text-primary" />
                Select Employees for Batch ({selectedEmpIds.size} selected)
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={handleToggleSelectAll}
                  className="text-xs gap-1.5"
                >
                  {filteredEmployees.length > 0 && filteredEmployees.every((e) => selectedEmpIds.has(String(e.id))) ? (
                    <>
                      <Square className="w-3.5 h-3.5 text-muted-foreground" />
                      Deselect All
                    </>
                  ) : (
                    <>
                      <CheckSquare className="w-3.5 h-3.5 text-primary" />
                      Select All
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-muted-foreground" />
                <Input
                  value={empSearch}
                  onChange={(e) => setEmpSearch(e.target.value)}
                  placeholder="Search by name, email, or role..."
                  className="pl-8 h-8 text-xs"
                />
              </div>

              <div className="w-full sm:w-48">
                <Select value={deptFilter} onValueChange={setDeptFilter}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">
                      All Departments
                    </SelectItem>
                    {departments.map((d) => (
                      <SelectItem key={d} value={d} className="text-xs">
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Employees List with Checkboxes */}
            <div className="border border-border rounded-xl divide-y divide-border/60 max-h-96 overflow-y-auto bg-background/50">
              {visibleEmployees.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-xs">
                  No active employees found matching your criteria.
                </div>
              ) : (
                <>
                  {visibleEmployees.map((emp) => {
                    const isSelected = selectedEmpIds.has(String(emp.id));
                    return (
                      <div
                        key={emp.id}
                        onClick={() => toggleEmployee(emp.id)}
                        className={`p-3.5 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-primary/5 dark:bg-primary/10 hover:bg-primary/10"
                            : "hover:bg-muted/40"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}} // handled by parent div
                            className="w-4 h-4 rounded border-border text-primary focus:ring-primary/40 cursor-pointer"
                          />
                          <div>
                            <p className="text-xs font-semibold text-foreground flex items-center gap-2">
                              {emp.name}
                              <span className="text-[10px] font-normal text-muted-foreground px-1.5 py-0.5 rounded-full bg-muted">
                                {emp.employeeId || `EMP-${emp.id}`}
                              </span>
                            </p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              {emp.email}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-right">
                          <div className="hidden sm:block text-[11px] text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                              <Building2 className="w-3 h-3 text-muted-foreground" />
                              {emp.department || "General"}
                            </span>
                          </div>
                          <div className="hidden sm:block text-[11px] text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                              <Briefcase className="w-3 h-3 text-muted-foreground" />
                              {emp.jobPosition || "Staff"}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {filteredEmployees.length > visibleLimit && (
                    <div className="p-2.5 text-center bg-muted/20 border-t border-border">
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          setVisibleLimit((prev) => prev + 50);
                        }}
                        className="text-xs text-primary hover:text-primary font-medium"
                      >
                        Load Next 50 Employees (Showing {visibleEmployees.length} of {filteredEmployees.length})
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
              <span>
                Showing {visibleEmployees.length} of {filteredEmployees.length} validated active employees
              </span>
              <span className="font-semibold text-foreground">
                {selectedEmpIds.size} selected for this payrun
              </span>
            </div>
          </CardContent>

          <div className="p-4 border-t border-border flex items-center justify-between bg-muted/20">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setStep(1)}
              className="text-xs gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Batch Details
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={submitting || selectedEmpIds.size === 0}
              onClick={handleFinalSubmit}
              className="text-xs gap-1.5 shadow-sm"
            >
              {submitting ? "Processing & Computing..." : `Initialize & Compute (${selectedEmpIds.size})`}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

