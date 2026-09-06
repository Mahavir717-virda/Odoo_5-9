import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  FileCheck,
  AlertCircle,
  Loader2,
  DollarSign,
  Calendar,
  User,
} from "lucide-react";

import PageHeader from "../../components/common/PageHeader";
import FormField from "../../components/common/FormField";
import EmptyState from "../../components/common/EmptyState";

import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Skeleton } from "../../components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";

import * as contractService from "../../services/contractService";
import * as employeeService from "../../services/employeeService";

const DEPARTMENT_OPTIONS = [
  { value: "Engineering", label: "Engineering" },
  { value: "HR", label: "HR" },
  { value: "Finance", label: "Finance" },
  { value: "Sales", label: "Sales" },
  { value: "Marketing", label: "Marketing" },
];

const SALARY_STRUCTURE_OPTIONS = [
  { value: "Regular Salary", label: "Regular Salary (Standard)" },
  { value: "Contract Salary", label: "Contract Salary" },
  { value: "Executive Salary", label: "Executive Salary" },
  { value: "Part-Time Consultant Structure", label: "Part-Time Consultant Structure" },
];

const STATUS_OPTIONS = [
  { value: "Active", label: "Active" },
  { value: "Draft", label: "Draft" },
  { value: "Expired", label: "Expired" },
  { value: "Cancelled", label: "Cancelled" },
];

export default function ContractFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  // Form Fields
  const [employeeId, setEmployeeId] = useState("");
  const [employeeName, setEmployeeName] = useState("");
  const [department, setDepartment] = useState("Engineering");
  const [jobPosition, setJobPosition] = useState("");
  const [wage, setWage] = useState("");
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState("");
  const [salaryStructure, setSalaryStructure] = useState("Regular Salary");
  const [status, setStatus] = useState("Active");

  // Dynamic Employee List
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);

  // UI States
  const [fetching, setFetching] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [errors, setErrors] = useState({});

  // Load available employees on mount (limit 100 active employees)
  useEffect(() => {
    let isMounted = true;
    setLoadingEmployees(true);
    employeeService
      .getEmployees({ limit: 100, status: "Active" })
      .then((data) => {
        if (isMounted) {
          setEmployees(data || []);
          setLoadingEmployees(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load employees for contract form:", err);
        if (isMounted) setLoadingEmployees(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch contract details if editing
  useEffect(() => {
    if (!isEditMode) {
      setFetching(false);
      return;
    }

    let isMounted = true;
    setFetching(true);
    setFetchError(null);

    contractService
      .getContractById(id)
      .then((data) => {
        if (!isMounted) return;
        setEmployeeId(data.employeeId || "");
        setEmployeeName(data.employeeName || "");
        setDepartment(data.department || "Engineering");
        setJobPosition(data.jobPosition || "");
        setWage(data.wage != null ? String(data.wage) : "");
        setStartDate(data.startDate || "");
        setEndDate(data.endDate || "");
        setSalaryStructure(data.salaryStructure || "Regular Salary");
        setStatus(data.status || "Active");
        setFetching(false);
      })
      .catch((err) => {
        if (isMounted) {
          setFetchError(err.message || "Contract not found.");
          setFetching(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [id, isEditMode]);

  // Handle employee selection in creation mode
  const handleEmployeeSelect = (empId) => {
    setEmployeeId(empId);
    if (errors.employeeId) {
      setErrors((prev) => ({ ...prev, employeeId: null }));
    }

    const emp = employees.find((e) => String(e.id) === String(empId));
    if (emp) {
      const fullName = `${emp.firstName} ${emp.lastName}`;
      setEmployeeName(fullName);
      if (emp.department) setDepartment(emp.department);
      if (emp.jobPosition) setJobPosition(emp.jobPosition);
    }
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    const newErrors = {};

    if (!employeeId) {
      newErrors.employeeId = "Please select an employee";
    }
    if (!jobPosition.trim()) {
      newErrors.jobPosition = "Job position is required";
    }
    if (!wage || isNaN(wage) || parseFloat(wage) <= 0) {
      newErrors.wage = "Valid monthly wage greater than 0 is required";
    }
    if (!startDate) {
      newErrors.startDate = "Contract start date is required";
    }
    if (startDate && endDate) {
      if (new Date(endDate) <= new Date(startDate)) {
        newErrors.endDate = "End date must be strictly after start date";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setSubmitError("Please fix the errors below before submitting.");
      return;
    }

    setSubmitting(true);

    const payload = {
      employeeId,
      employeeName,
      department,
      jobPosition: jobPosition.trim(),
      wage: parseFloat(wage),
      startDate,
      endDate: endDate ? endDate : null,
      salaryStructure,
      status,
    };

    try {
      if (isEditMode) {
        await contractService.updateContract(id, payload);
      } else {
        await contractService.createContract(payload);
      }
      navigate("/contracts");
    } catch (err) {
      const msg = err.message || "Failed to save contract.";
      setSubmitError(msg);
      if (msg.toLowerCase().includes("overlap")) {
        setErrors((prev) => ({
          ...prev,
          startDate: "Contract dates overlap with an existing contract for this employee",
          endDate: "Contract dates overlap with an existing contract for this employee",
        }));
      }
      setSubmitting(false);
    }
  };

  // Skeleton during fetch
  if (fetching) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto pb-12">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-md" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-36" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Record Not Found State
  if (isEditMode && fetchError) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto pb-12">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/contracts")}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Contracts
        </Button>
        <EmptyState
          icon={FileCheck}
          title="Contract Not Found"
          description={fetchError}
          actionLabel="Back to Contracts"
          onAction={() => navigate("/contracts")}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/contracts")}
          className="gap-2 text-muted-foreground hover:text-foreground -ml-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Contracts
        </Button>
      </div>

      <PageHeader
        title={isEditMode ? "Edit Contract" : "New Employment Contract"}
        subtitle={
          isEditMode
            ? `Update terms and compensation for ${employeeName || "contract"}`
            : "Assign a new employment contract and salary structure to an existing employee"
        }
      />

      {/* Global Submit Error */}
      {submitError && (
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold block">Error saving contract</span>
            <span>{submitError}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card 1: Employee & Position Details */}
        <Card className="border border-border shadow-sm">
          <CardHeader className="border-b border-border/40 pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              Employee & Position Details
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            {/* Employee Selection */}
            <FormField
              label="Select Employee"
              required
              error={errors.employeeId}
              hint={isEditMode ? "Employee cannot be changed after creation" : "Select from registered workforce"}
            >
              <Select
                value={employeeId}
                onValueChange={handleEmployeeSelect}
                disabled={isEditMode || loadingEmployees}
              >
                <SelectTrigger className={errors.employeeId ? "border-destructive" : ""}>
                  <SelectValue placeholder={loadingEmployees ? "Loading workforce..." : "Choose employee..."} />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={String(emp.id)}>
                      {emp.firstName} {emp.lastName} ({emp.department || "No Dept"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            {/* Department */}
            <FormField label="Department" required>
              <Select value={department} onValueChange={(val) => setDepartment(val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENT_OPTIONS.map((dept) => (
                    <SelectItem key={dept.value} value={dept.value}>
                      {dept.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            {/* Job Position */}
            <FormField label="Job Position" required error={errors.jobPosition}>
              <Input
                value={jobPosition}
                onChange={(e) => {
                  setJobPosition(e.target.value);
                  if (errors.jobPosition) {
                    setErrors((prev) => ({ ...prev, jobPosition: null }));
                  }
                }}
                placeholder="e.g. Senior Software Engineer"
                className={errors.jobPosition ? "border-destructive" : ""}
              />
            </FormField>

            {/* Status */}
            <FormField label="Contract Status">
              <Select value={status} onValueChange={(val) => setStatus(val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((st) => (
                    <SelectItem key={st.value} value={st.value}>
                      {st.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </CardContent>
        </Card>

        {/* Card 2: Compensation & Salary Structure */}
        <Card className="border border-border shadow-sm">
          <CardHeader className="border-b border-border/40 pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-primary" />
              Compensation & Terms
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            {/* Monthly Wage */}
            <FormField
              label="Monthly Wage (₹ INR)"
              required
              error={errors.wage}
              hint="Gross monthly base compensation"
            >
              <Input
                type="number"
                value={wage}
                onChange={(e) => {
                  setWage(e.target.value);
                  if (errors.wage) {
                    setErrors((prev) => ({ ...prev, wage: null }));
                  }
                }}
                placeholder="e.g. 95000"
                className={errors.wage ? "border-destructive" : ""}
              />
            </FormField>

            {/* Salary Structure */}
            <FormField label="Salary Structure">
              <Select
                value={salaryStructure}
                onValueChange={(val) => setSalaryStructure(val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select structure" />
                </SelectTrigger>
                <SelectContent>
                  {SALARY_STRUCTURE_OPTIONS.map((struct) => (
                    <SelectItem key={struct.value} value={struct.value}>
                      {struct.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </CardContent>
        </Card>

        {/* Card 3: Contract Schedule & Dates */}
        <Card className="border border-border shadow-sm">
          <CardHeader className="border-b border-border/40 pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              Contract Validity Dates
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            {/* Start Date */}
            <FormField label="Start Date" required error={errors.startDate}>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (errors.startDate) {
                    setErrors((prev) => ({ ...prev, startDate: null }));
                  }
                }}
                className={errors.startDate ? "border-destructive" : ""}
              />
            </FormField>

            {/* End Date */}
            <FormField
              label="End Date"
              error={errors.endDate}
              hint="Leave blank for an ongoing open-ended contract"
            >
              <Input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  if (errors.endDate) {
                    setErrors((prev) => ({ ...prev, endDate: null }));
                  }
                }}
                className={errors.endDate ? "border-destructive" : ""}
              />
            </FormField>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/contracts")}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={submitting} className="gap-2">
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {isEditMode ? "Saving..." : "Creating..."}
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {isEditMode ? "Save Changes" : "Create Contract"}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

