import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  AlertTriangle,
  AlertCircle,
  Save,
  UserX,
  Loader2,
} from "lucide-react";

import { usePermissions } from "../../hooks/usePermissions";
import PageHeader from "../../components/common/PageHeader";
import FormField from "../../components/common/FormField";
import EmptyState from "../../components/common/EmptyState";

import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Skeleton } from "../../components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";

import * as employeeService from "../../services/employeeService";
import * as scheduleService from "../../services/scheduleService";
import {
  required,
  isEmail,
  isPhone,
  isPastDate,
  isValidIFSC,
  runValidators,
} from "../../utils/validators";

// Validation rules configuration
const VALIDATION_RULES = {
  firstName: [(v) => required(v, "First name")],
  lastName: [(v) => required(v, "Last name")],
  email: [(v) => required(v, "Email"), (v) => isEmail(v)],
  phone: [(v) => required(v, "Phone number"), (v) => isPhone(v)],
  dateOfBirth: [(v) => isPastDate(v, "Date of birth")],
  employeeId: [(v) => required(v, "Employee ID")],
  department: [(v) => required(v, "Department")],
  jobPosition: [(v) => required(v, "Job position")],
  joiningDate: [(v) => required(v, "Joining date"), (v) => isPastDate(v, "Joining date")],
  ifsc: [(v) => isValidIFSC(v)],
};

const DEPARTMENT_OPTIONS = [
  { value: "Engineering", label: "Engineering" },
  { value: "HR", label: "HR" },
  { value: "Finance", label: "Finance" },
  { value: "Sales", label: "Sales" },
  { value: "Marketing", label: "Marketing" },
];

const EMPLOYEE_TYPE_OPTIONS = [
  { value: "Full-time", label: "Full-time" },
  { value: "Part-time", label: "Part-time" },
  { value: "Contract", label: "Contract" },
];

const STATUS_OPTIONS = [
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
  { value: "On Leave", label: "On Leave" },
];

const PAYMENT_METHOD_OPTIONS = [
  { value: "Bank Transfer", label: "Bank Transfer" },
  { value: "Cheque", label: "Cheque" },
  { value: "Cash", label: "Cash" },
];

const INITIAL_FORM_DATA = {
  // Personal
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  dateOfBirth: "",
  address: "",
  // Work
  employeeId: "",
  department: "",
  jobPosition: "",
  managerId: "",
  managerName: "",
  employeeType: "Full-time",
  workSchedule: "40 Hours / Week",
  joiningDate: new Date().toISOString().split("T")[0],
  status: "Active",
  // Payroll
  bankName: "",
  accountNumber: "",
  ifsc: "",
  paymentMethod: "Bank Transfer",
};

export default function EmployeeFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { can } = usePermissions();

  const isEditMode = Boolean(id);

  // Form & Component States
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  // Manager options list loaded from existing employees
  const [availableManagers, setAvailableManagers] = useState([]);
  // Working schedule options list loaded from active schedules
  const [availableSchedules, setAvailableSchedules] = useState([]);

  // Fetch active working schedules
  useEffect(() => {
    scheduleService
      .getSchedules({ status: "Active" })
      .then((schedules) => {
        setAvailableSchedules(schedules);
      })
      .catch((err) => {
        console.error("Failed to load active working schedules:", err);
      });
  }, []);

  // Fetch all employees for manager dropdown
  useEffect(() => {
    employeeService
      .getEmployees()
      .then((emps) => {
        // Exclude current employee if editing to avoid circular manager loop
        const filtered = isEditMode ? emps.filter((e) => e.id !== id) : emps;
        setAvailableManagers(filtered);
      })
      .catch((err) => {
        console.error("Failed to load managers list:", err);
      });
  }, [id, isEditMode]);

  // Fetch employee if edit mode
  useEffect(() => {
    if (!isEditMode) return;

    let isMounted = true;
    setLoading(true);
    setFetchError(null);

    employeeService
      .getEmployeeById(id)
      .then((data) => {
        if (isMounted) {
          setFormData({
            ...INITIAL_FORM_DATA,
            ...data,
            // Ensure fields aren't undefined
            firstName: data.firstName || "",
            lastName: data.lastName || "",
            email: data.email || "",
            phone: data.phone || "",
            dateOfBirth: data.dateOfBirth || "",
            address: data.address || "",
            employeeId: data.employeeId || "",
            department: data.department || "",
            jobPosition: data.jobPosition || "",
            managerId: data.managerId || "none",
            managerName: data.managerName || "",
            employeeType: data.employeeType || "Full-time",
            workSchedule: data.workSchedule || "40 Hours / Week",
            joiningDate: data.joiningDate || "",
            status: data.status || "Active",
            bankName: data.bankName || "",
            accountNumber: data.accountNumber || "",
            ifsc: data.ifsc || "",
            paymentMethod: data.paymentMethod || "Bank Transfer",
          });
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setFetchError(err.message || "Failed to load employee details.");
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [id, isEditMode]);

  // Auto-generate employeeId if creating
  useEffect(() => {
    if (!isEditMode && !formData.employeeId) {
      const randomSuffix = Math.floor(100 + Math.random() * 900);
      setFormData((prev) => ({
        ...prev,
        employeeId: `EMP-${new Date().getFullYear()}-${randomSuffix}`,
      }));
    }
  }, [isEditMode, formData.employeeId]);

  // Validate a single field
  const validateField = (name, value) => {
    const rules = VALIDATION_RULES[name];
    if (!rules || rules.length === 0) return null;
    return runValidators(value, rules);
  };

  // Validate all fields
  const validateAll = () => {
    const newErrors = {};
    let isValid = true;

    Object.keys(VALIDATION_RULES).forEach((field) => {
      const error = validateField(field, formData[field]);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  // Handle field change
  const handleChange = (name, value) => {
    let nextFormData = { ...formData, [name]: value };

    // When manager is selected, also store managerName
    if (name === "managerId") {
      if (value === "none" || !value) {
        nextFormData.managerId = null;
        nextFormData.managerName = null;
      } else {
        const mgr = availableManagers.find((m) => m.id === value);
        nextFormData.managerId = value;
        nextFormData.managerName = mgr ? `${mgr.firstName} ${mgr.lastName}` : "";
      }
    }

    setFormData(nextFormData);

    // Live validation if touched or submit attempted
    if (touched[name] || submitAttempted) {
      const error = validateField(name, value);
      setErrors((prev) => ({
        ...prev,
        [name]: error,
      }));
    }
  };

  // Handle field blur
  const handleBlur = (name) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    const error = validateField(name, formData[name]);
    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  };

  // Check if error should be shown for a field
  const getFieldError = (name) => {
    if (touched[name] || submitAttempted) {
      return errors[name] || null;
    }
    return null;
  };

  // Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitAttempted(true);
    setSubmitError(null);

    const isValid = validateAll();
    if (!isValid) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setSubmitting(true);
    try {
      if (isEditMode) {
        const updated = await employeeService.updateEmployee(id, formData);
        navigate(`/employees/${updated.id || id}`);
      } else {
        const created = await employeeService.createEmployee(formData);
        navigate(`/employees/${created.id}`);
      }
    } catch (err) {
      setSubmitError(err.message || "Failed to save employee. Please try again.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSubmitting(false);
    }
  };

  // Loading skeleton state
  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 pb-12">
        <Skeleton className="h-8 w-48" />
        <Card className="p-6 border border-border space-y-4">
          <Skeleton className="h-6 w-36" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </Card>
      </div>
    );
  }

  // Edit mode error / not found state
  if (isEditMode && (fetchError || !formData)) {
    return (
      <div className="py-12 max-w-lg mx-auto">
        <EmptyState
          icon={UserX}
          title="Employee Not Found"
          description={fetchError || "The employee you are trying to edit does not exist."}
          actionLabel="Back to Employees"
          onAction={() => navigate("/employees")}
        />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16">
      {/* Back Button */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(isEditMode ? `/employees/${id}` : "/employees")}
          className="text-xs text-muted-foreground hover:text-foreground gap-1.5 pl-0"
        >
          <ArrowLeft className="w-4 h-4" />
          {isEditMode ? "Back to Details" : "Back to Employees"}
        </Button>
      </div>

      {/* Page Header */}
      <PageHeader
        title={isEditMode ? "Edit Employee" : "Add New Employee"}
        subtitle={
          isEditMode
            ? `Update workforce credentials and records for ${formData.firstName} ${formData.lastName}`.trim()
            : "Onboard a new employee to your organization's directory and payroll systems."
        }
      />

      {/* Submission Error Banner */}
      {submitError && (
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive flex items-start gap-3 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Unable to save employee</p>
            <p className="text-xs mt-0.5 opacity-90">{submitError}</p>
          </div>
        </div>
      )}

      {/* Form Form Body */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: PERSONAL INFORMATION */}
        <Card className="border border-border bg-card shadow-sm">
          <CardHeader className="pb-4 border-b border-border/40">
            <CardTitle className="text-base font-semibold text-foreground">
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {/* First & Last Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                label="First Name"
                required
                error={getFieldError("firstName")}
                htmlFor="firstName"
              >
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleChange("firstName", e.target.value)}
                  onBlur={() => handleBlur("firstName")}
                  placeholder="e.g. Marcus"
                />
              </FormField>

              <FormField
                label="Last Name"
                required
                error={getFieldError("lastName")}
                htmlFor="lastName"
              >
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleChange("lastName", e.target.value)}
                  onBlur={() => handleBlur("lastName")}
                  placeholder="e.g. Vance"
                />
              </FormField>
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                label="Work Email"
                required
                error={getFieldError("email")}
                htmlFor="email"
              >
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  onBlur={() => handleBlur("email")}
                  placeholder="m.vance@company.com"
                />
              </FormField>

              <FormField
                label="Phone Number"
                required
                error={getFieldError("phone")}
                htmlFor="phone"
              >
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  onBlur={() => handleBlur("phone")}
                  placeholder="+1 (555) 000-0000"
                />
              </FormField>
            </div>

            {/* Date of Birth */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                label="Date of Birth"
                error={getFieldError("dateOfBirth")}
                htmlFor="dateOfBirth"
                hint="Used for age verification and compliance."
              >
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleChange("dateOfBirth", e.target.value)}
                  onBlur={() => handleBlur("dateOfBirth")}
                />
              </FormField>
            </div>

            {/* Residential Address */}
            <FormField
              label="Residential Address"
              error={getFieldError("address")}
              htmlFor="address"
            >
              <Textarea
                id="address"
                rows={3}
                value={formData.address}
                onChange={(e) => handleChange("address", e.target.value)}
                onBlur={() => handleBlur("address")}
                placeholder="Street address, City, State, ZIP code"
              />
            </FormField>
          </CardContent>
        </Card>

        {/* SECTION 2: WORK INFORMATION */}
        <Card className="border border-border bg-card shadow-sm">
          <CardHeader className="pb-4 border-b border-border/40">
            <CardTitle className="text-base font-semibold text-foreground">
              Work Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {/* Employee ID & Department */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                label="Employee ID"
                required
                error={getFieldError("employeeId")}
                htmlFor="employeeId"
              >
                <Input
                  id="employeeId"
                  value={formData.employeeId}
                  onChange={(e) => handleChange("employeeId", e.target.value)}
                  onBlur={() => handleBlur("employeeId")}
                  placeholder="e.g. EMP-2024-001"
                />
              </FormField>

              <FormField
                label="Department"
                required
                error={getFieldError("department")}
                htmlFor="department"
              >
                <Select
                  value={formData.department || undefined}
                  onValueChange={(val) => handleChange("department", val)}
                >
                  <SelectTrigger id="department">
                    <SelectValue placeholder="Select Department" />
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
            </div>

            {/* Job Position & Manager */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                label="Job Position"
                required
                error={getFieldError("jobPosition")}
                htmlFor="jobPosition"
              >
                <Input
                  id="jobPosition"
                  value={formData.jobPosition}
                  onChange={(e) => handleChange("jobPosition", e.target.value)}
                  onBlur={() => handleBlur("jobPosition")}
                  placeholder="e.g. Senior Software Engineer"
                />
              </FormField>

              <FormField
                label="Manager"
                htmlFor="managerId"
                hint="Direct line supervisor."
              >
                <Select
                  value={formData.managerId || "none"}
                  onValueChange={(val) => handleChange("managerId", val)}
                >
                  <SelectTrigger id="managerId">
                    <SelectValue placeholder="Select Manager" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Manager (Top-level)</SelectItem>
                    {availableManagers.map((mgr) => (
                      <SelectItem key={mgr.id} value={mgr.id}>
                        {mgr.firstName} {mgr.lastName} ({mgr.department})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </div>

            {/* Employee Type & Work Schedule */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                label="Employee Type"
                htmlFor="employeeType"
              >
                <Select
                  value={formData.employeeType}
                  onValueChange={(val) => handleChange("employeeType", val)}
                >
                  <SelectTrigger id="employeeType">
                    <SelectValue placeholder="Select Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {EMPLOYEE_TYPE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField
                label="Work Schedule"
                htmlFor="workSchedule"
              >
                <Select
                  value={formData.workSchedule}
                  onValueChange={(val) => handleChange("workSchedule", val)}
                >
                  <SelectTrigger id="workSchedule">
                    <SelectValue placeholder="Select Schedule" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSchedules.map((sch) => (
                      <SelectItem key={sch.id} value={sch.name}>
                        {sch.name} ({sch.weeklyHours}h/wk)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </div>

            {/* Joining Date & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                label="Joining Date"
                required
                error={getFieldError("joiningDate")}
                htmlFor="joiningDate"
              >
                <Input
                  id="joiningDate"
                  type="date"
                  value={formData.joiningDate}
                  onChange={(e) => handleChange("joiningDate", e.target.value)}
                  onBlur={() => handleBlur("joiningDate")}
                />
              </FormField>

              <FormField
                label="Employment Status"
                htmlFor="status"
              >
                <Select
                  value={formData.status}
                  onValueChange={(val) => handleChange("status", val)}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </div>
          </CardContent>
        </Card>

        {/* SECTION 3: PAYROLL INFORMATION (Gated by can("employee.edit")) */}
        {can("employee.edit") && (
          <Card className="border border-border bg-card shadow-sm">
            <CardHeader className="pb-4 border-b border-border/40">
              <CardTitle className="text-base font-semibold text-foreground">
                Payroll Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {/* Sensitive financial notice */}
              <div className="p-3.5 rounded-md bg-amber-50 border border-amber-200/80 text-amber-800 flex items-start gap-2.5 text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Sensitive financial information. Handle with care and only share on a need-to-know basis.
                </span>
              </div>

              {/* Bank Name & Account Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  label="Bank Name"
                  error={getFieldError("bankName")}
                  htmlFor="bankName"
                >
                  <Input
                    id="bankName"
                    value={formData.bankName}
                    onChange={(e) => handleChange("bankName", e.target.value)}
                    placeholder="e.g. HDFC Bank, Chase"
                  />
                </FormField>

                <FormField
                  label="Account Number"
                  error={getFieldError("accountNumber")}
                  htmlFor="accountNumber"
                >
                  <Input
                    id="accountNumber"
                    value={formData.accountNumber}
                    onChange={(e) => handleChange("accountNumber", e.target.value)}
                    placeholder="e.g. 123456789012"
                  />
                </FormField>
              </div>

              {/* IFSC & Payment Method */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  label="IFSC Code"
                  error={getFieldError("ifsc")}
                  htmlFor="ifsc"
                  hint="Required for domestic transfers (e.g. HDFC0001234)."
                >
                  <Input
                    id="ifsc"
                    value={formData.ifsc}
                    onChange={(e) => handleChange("ifsc", e.target.value.toUpperCase())}
                    onBlur={() => handleBlur("ifsc")}
                    placeholder="HDFC0001234"
                    maxLength={11}
                  />
                </FormField>

                <FormField
                  label="Payment Method"
                  htmlFor="paymentMethod"
                >
                  <Select
                    value={formData.paymentMethod}
                    onValueChange={(val) => handleChange("paymentMethod", val)}
                  >
                    <SelectTrigger id="paymentMethod">
                      <SelectValue placeholder="Select Payment Method" />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHOD_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bottom Action Bar */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(isEditMode ? `/employees/${id}` : "/employees")}
            disabled={submitting}
          >
            Cancel
          </Button>

          <Button type="submit" disabled={submitting} className="min-w-[140px] gap-2">
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {isEditMode ? "Save Changes" : "Create Employee"}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

