import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Pencil,
  Archive,
  MoreHorizontal,
  FileText,
  Clock,
  CalendarDays,
  Wallet,
  Receipt,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building2,
  Briefcase,
  UserCheck,
  ShieldCheck,
  UserX,
} from "lucide-react";

import { usePermissions } from "../../hooks/usePermissions";
import StatusBadge from "../../components/common/StatusBadge";
import EmptyState from "../../components/common/EmptyState";
import SmartButton from "../../components/employees/SmartButton";
import EmployeeTabPlaceholder from "../../components/employees/EmployeeTabPlaceholder";

import { Button } from "../../components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Skeleton } from "../../components/ui/skeleton";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "../../components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";

import * as employeeService from "../../services/employeeService";

/**
 * Format ISO date string into readable format (e.g. "Jan 15, 2024")
 */
function formatDate(dateString) {
  if (!dateString) return "—";
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

/**
 * Helper to get two initials from names
 */
function getInitials(first, last) {
  const f = first ? first[0] : "";
  const l = last ? last[0] : "";
  return `${f}${l}`.toUpperCase() || "U";
}

/**
 * Label-Value Pair helper
 */
function InfoItem({ label, value, icon: Icon }) {
  return (
    <div className="flex items-start gap-3 py-2">
      {Icon && (
        <div className="p-1.5 rounded-md bg-muted text-muted-foreground mt-0.5 shrink-0">
          <Icon className="w-4 h-4 text-primary" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <span className="text-xs text-muted-foreground block font-medium">
          {label}
        </span>
        <div className="text-sm font-medium text-foreground mt-0.5 truncate">
          {value || "—"}
        </div>
      </div>
    </div>
  );
}

export default function EmployeeDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { can } = usePermissions();

  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  // Relation counts for smart buttons
  const [relationCounts, setRelationCounts] = useState({
    contracts: 0,
    attendanceRecords: 0,
    timeOffRequests: 0,
    allocations: 0,
    payslips: 0,
  });
  const [countsLoading, setCountsLoading] = useState(true);

  // Load employee data and relation counts
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    // Main employee fetch
    employeeService
      .getEmployeeById(id)
      .then((data) => {
        if (isMounted) {
          setEmployee(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || "Failed to load employee.");
          setLoading(false);
        }
      });

    // Relation counts fetch in parallel
    setCountsLoading(true);
    employeeService
      .getEmployeeRelationCounts(id)
      .then((counts) => {
        if (isMounted) {
          setRelationCounts(counts);
          setCountsLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load relation counts:", err);
        if (isMounted) setCountsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  // Handle Archive action
  const handleArchive = async () => {
    if (!window.confirm("Archive this employee? This will mark their status as Inactive.")) {
      return;
    }

    try {
      await employeeService.archiveEmployee(id);
      setEmployee((prev) => (prev ? { ...prev, status: "Inactive" } : null));
      alert("Employee archived successfully.");
    } catch (err) {
      alert(err.message || "Failed to archive employee.");
    }
  };

  // Loading skeleton state
  if (loading) {
    return (
      <div className="space-y-6 pb-12 max-w-6xl mx-auto">
        {/* Header Skeleton */}
        <Card className="p-6 border border-border">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-36" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-20 rounded-md" />
              <Skeleton className="h-9 w-24 rounded-md" />
            </div>
          </div>
        </Card>

        {/* Smart Buttons Skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="p-4 space-y-2 border border-border">
              <div className="flex justify-between">
                <Skeleton className="h-7 w-7 rounded-md" />
                <Skeleton className="h-7 w-10" />
              </div>
              <Skeleton className="h-4 w-20" />
            </Card>
          ))}
        </div>

        {/* Tabs Skeleton */}
        <Card className="p-6 h-64 border border-border">
          <Skeleton className="h-8 w-64 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </Card>
      </div>
    );
  }

  // Error / Not found state
  if (error || !employee) {
    return (
      <div className="py-12 max-w-lg mx-auto">
        <EmptyState
          icon={UserX}
          title="Employee Not Found"
          description={error || "The requested employee record could not be found or has been removed."}
          actionLabel="Back to Employees"
          onAction={() => navigate("/employees")}
        />
      </div>
    );
  }

  const fullName = `${employee.firstName} ${employee.lastName}`;
  const initials = getInitials(employee.firstName, employee.lastName);

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/employees")}
          className="text-xs text-muted-foreground hover:text-foreground gap-1.5 pl-0"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Employees
        </Button>
      </div>

      {/* Profile Header Card */}
      <Card className="border border-border bg-card shadow-xs">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            {/* Left: Avatar & Identity */}
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-primary/20 shadow-xs shrink-0">
                <AvatarImage src={employee.avatarUrl} alt={fullName} />
                <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight truncate">
                    {fullName}
                  </h1>
                  <StatusBadge status={employee.status} />
                </div>

                <p className="text-sm text-muted-foreground mt-0.5">
                  {employee.jobPosition} •{" "}
                  <span className="font-medium text-foreground/80">
                    {employee.department}
                  </span>
                </p>

                <p className="text-xs text-muted-foreground/80 font-mono mt-0.5">
                  {employee.employeeId}
                </p>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              {can("employee.edit") && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => navigate(`/employees/${id}/edit`)}
                  className="text-xs gap-1.5 shadow-xs"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edit
                </Button>
              )}

              {can("employee.delete") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleArchive}
                  className="text-xs gap-1.5 text-muted-foreground hover:text-destructive hover:border-destructive/30"
                >
                  <Archive className="w-3.5 h-3.5" />
                  Archive
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 w-9 p-0"
                    title="More actions"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => alert("Profile export coming soon")}
                    className="text-xs cursor-pointer"
                  >
                    Export Profile
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Smart Buttons Row (5 horizontal buttons) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <SmartButton
          label="Contracts"
          count={relationCounts.contracts}
          icon={FileText}
          loading={countsLoading}
          onClick={() => setActiveTab("contracts")}
        />
        <SmartButton
          label="Attendance"
          count={relationCounts.attendanceRecords}
          icon={Clock}
          loading={countsLoading}
          onClick={() => setActiveTab("attendance")}
        />
        <SmartButton
          label="Time Off"
          count={relationCounts.timeOffRequests}
          icon={CalendarDays}
          loading={countsLoading}
          onClick={() => setActiveTab("timeoff")}
        />
        <SmartButton
          label="Allocations"
          count={relationCounts.allocations}
          icon={Wallet}
          loading={countsLoading}
          onClick={() => setActiveTab("timeoff")}
        />
        <SmartButton
          label="Payslips"
          count={relationCounts.payslips}
          icon={Receipt}
          loading={countsLoading}
          onClick={() => setActiveTab("payroll")}
        />
      </div>

      {/* Tabs Section */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full space-y-4"
      >
        <div className="overflow-x-auto pb-1">
          <TabsList className="h-10 bg-muted/80 p-1">
            <TabsTrigger value="overview" className="text-xs">
              Overview
            </TabsTrigger>
            <TabsTrigger value="personal" className="text-xs">
              Personal Information
            </TabsTrigger>
            <TabsTrigger value="work" className="text-xs">
              Work Information
            </TabsTrigger>
            <TabsTrigger value="contracts" className="text-xs">
              Contracts
            </TabsTrigger>
            <TabsTrigger value="attendance" className="text-xs">
              Attendance
            </TabsTrigger>
            <TabsTrigger value="timeoff" className="text-xs">
              Time Off
            </TabsTrigger>
            <TabsTrigger value="payroll" className="text-xs">
              Payroll
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Animated Tab Content Transition */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
            {/* 1. OVERVIEW TAB */}
            {activeTab === "overview" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-border bg-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-foreground">
                      Contact Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 divide-y divide-border/40">
                    <InfoItem label="Email" value={employee.email} icon={Mail} />
                    <InfoItem label="Phone" value={employee.phone} icon={Phone} />
                    <InfoItem label="Work Location" value={employee.address} icon={MapPin} />
                  </CardContent>
                </Card>

                <Card className="border-border bg-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-foreground">
                      Department & Role
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 divide-y divide-border/40">
                    <InfoItem label="Department" value={employee.department} icon={Building2} />
                    <InfoItem label="Job Position" value={employee.jobPosition} icon={Briefcase} />
                    <InfoItem label="Reporting Manager" value={employee.managerName || "Top Level"} icon={UserCheck} />
                  </CardContent>
                </Card>

                <Card className="border-border bg-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-foreground">
                      Schedule & Dates
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 divide-y divide-border/40">
                    <InfoItem label="Work Schedule" value={employee.workSchedule} icon={Clock} />
                    <InfoItem label="Employee Type" value={employee.employeeType} icon={Briefcase} />
                    <InfoItem label="Joining Date" value={formatDate(employee.joiningDate)} icon={Calendar} />
                  </CardContent>
                </Card>

                <Card className="border-border bg-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-foreground">
                      Employment Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-1">
                    <div>
                      <span className="text-xs text-muted-foreground block font-medium mb-1">
                        Current Status
                      </span>
                      <StatusBadge status={employee.status} />
                    </div>
                    <div className="pt-2 border-t border-border/40">
                      <span className="text-xs text-muted-foreground block font-medium">
                        System Employee ID
                      </span>
                      <span className="text-sm font-mono font-medium text-foreground">
                        {employee.employeeId}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* 2. PERSONAL INFORMATION TAB */}
            {activeTab === "personal" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-border bg-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-foreground">
                      Personal Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 divide-y divide-border/40">
                    <InfoItem label="Date of Birth" value={formatDate(employee.dateOfBirth)} icon={Calendar} />
                    <InfoItem label="Full Name" value={fullName} icon={UserCheck} />
                    <InfoItem label="Residential Address" value={employee.address} icon={MapPin} />
                  </CardContent>
                </Card>

                <Card className="border-border bg-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-foreground">
                      Contact Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 divide-y divide-border/40">
                    <InfoItem label="Personal Email" value={employee.email} icon={Mail} />
                    <InfoItem label="Primary Phone" value={employee.phone} icon={Phone} />
                  </CardContent>
                </Card>
              </div>
            )}

            {/* 3. WORK INFORMATION TAB */}
            {activeTab === "work" && (
              <Card className="border-border bg-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-foreground">
                    Work & Organizational Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 divide-y sm:divide-y-0 divide-border/40">
                    <InfoItem label="Department" value={employee.department} icon={Building2} />
                    <InfoItem label="Job Position" value={employee.jobPosition} icon={Briefcase} />
                    <InfoItem label="Reporting Manager" value={employee.managerName || "Top Level"} icon={UserCheck} />
                    <InfoItem label="Employee Type" value={employee.employeeType} icon={ShieldCheck} />
                    <InfoItem label="Work Schedule" value={employee.workSchedule} icon={Clock} />
                    <InfoItem label="Joining Date" value={formatDate(employee.joiningDate)} icon={Calendar} />
                    <InfoItem label="Employee ID" value={employee.employeeId} icon={Briefcase} />
                    <div className="py-2">
                      <span className="text-xs text-muted-foreground block font-medium mb-1">
                        Employment Status
                      </span>
                      <StatusBadge status={employee.status} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 4. CONTRACTS TAB */}
            {activeTab === "contracts" && (
              <EmployeeTabPlaceholder
                moduleName="Contracts"
                phaseLabel="Phase 2"
                employeeName={fullName}
              />
            )}

            {/* 5. ATTENDANCE TAB */}
            {activeTab === "attendance" && (
              <EmployeeTabPlaceholder
                moduleName="Attendance"
                phaseLabel="Phase 2"
                employeeName={fullName}
              />
            )}

            {/* 6. TIME OFF TAB */}
            {activeTab === "timeoff" && (
              <EmployeeTabPlaceholder
                moduleName="Time Off"
                phaseLabel="Phase 3"
                employeeName={fullName}
              />
            )}

            {/* 7. PAYROLL TAB */}
            {activeTab === "payroll" && (
              <EmployeeTabPlaceholder
                moduleName="Payroll"
                phaseLabel="Phase 4"
                employeeName={fullName}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </Tabs>
    </div>
  );
}
