import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  User,
  Building2,
  Briefcase,
  Calendar,
  Wallet,
  Receipt,
  Info,
  FileText,
  FileCheck,
  Pencil,
} from "lucide-react";

import StatusBadge from "../../components/common/StatusBadge";
import EmptyState from "../../components/common/EmptyState";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Skeleton } from "../../components/ui/skeleton";
import * as contractService from "../../services/contractService";
import { isSameId } from "../../services/contractService";

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

/**
 * InfoItem helper component matching EmployeeDetailsPage Overview tab styling
 */
function InfoItem({ label, value, icon: Icon, isLink, to }) {
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
          {isLink && to ? (
            <Link
              to={to}
              className="text-primary hover:underline font-semibold"
            >
              {value || "â€”"}
            </Link>
          ) : (
            value || "â€”"
          )}
        </div>
      </div>
    </div>
  );
}

export default function ContractDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [contract, setContract] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch target contract data
  useEffect(() => {
    let isMounted = true;
    setContract(null);
    setHistory([]);
    setError(null);
    setLoading(true);

    contractService
      .getContractById(id)
      .then((data) => {
        if (isMounted) {
          setContract(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || "Contract not found.");
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  // Fetch contract history for employee once main contract is loaded
  useEffect(() => {
    if (!contract?.employeeId) return;

    let isMounted = true;
    setHistoryLoading(true);

    contractService
      .getContractsByEmployeeId(contract.employeeId)
      .then((list) => {
        if (isMounted) {
          setHistory(list);
          setHistoryLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load contract history:", err);
        if (isMounted) setHistoryLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [contract?.employeeId]);

  // Loading skeleton state
  if (loading) {
    return (
      <div className="space-y-6 pb-12 max-w-5xl mx-auto">
        <Button
          variant="ghost"
          size="sm"
          disabled
          className="text-xs text-muted-foreground gap-1.5 pl-0"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Contracts
        </Button>

        <Card className="p-6 border border-border">
          <div className="space-y-3">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-6 h-48 border border-border">
            <Skeleton className="h-6 w-32 mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </Card>
          <Card className="p-6 h-48 border border-border">
            <Skeleton className="h-6 w-32 mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </Card>
        </div>
      </div>
    );
  }

  // Error / Not found state
  if (error || !contract) {
    return (
      <div className="py-12 max-w-lg mx-auto">
        <EmptyState
          icon={FileText}
          title="Contract Not Found"
          description={
            error || "The requested contract record could not be found or has been removed."
          }
          actionLabel="Back to Contracts"
          onAction={() => navigate("/contracts")}
        />
      </div>
    );
  }

  const isActive = String(contract.status).toLowerCase() === "active";

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* Top Navigation Bar */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/contracts")}
          className="text-xs text-muted-foreground hover:text-foreground gap-1.5 pl-0"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Contracts
        </Button>
      </div>

      {/* Header Card */}
      <Card className="border border-border bg-card shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold font-mono text-foreground tracking-tight">
                  {contract.contractId}
                </h1>
                <div className="flex items-center gap-2">
                  <StatusBadge status={contract.status} />
                  {isActive && (
                    <motion.span
                      className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"
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
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Contract details for{" "}
                <Link
                  to={`/employees/${contract.employeeId}`}
                  className="font-medium text-foreground hover:underline"
                >
                  {contract.employeeName}
                </Link>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/contracts/${contract.id}/edit`)}
                className="text-xs gap-1.5"
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit Contract
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/employees/${contract.employeeId}`)}
                className="text-xs gap-1.5"
              >
                <User className="w-3.5 h-3.5" />
                View Employee Profile
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Information Grid (2-column, Card-based) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left Card: Assignment & Employee Info */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3 border-b border-border/40">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-primary" />
              Employment Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 divide-y divide-border/40 pt-2">
            <InfoItem
              label="Employee"
              value={contract.employeeName}
              icon={User}
              isLink
              to={`/employees/${contract.employeeId}`}
            />
            <InfoItem
              label="Department"
              value={contract.department}
              icon={Building2}
            />
            <InfoItem
              label="Job Position"
              value={contract.jobPosition}
              icon={Briefcase}
            />
            <InfoItem
              label="Contract Status"
              value={contract.status}
              icon={FileCheck}
            />
          </CardContent>
        </Card>

        {/* Right Card: Wage & Terms */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3 border-b border-border/40">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Wallet className="w-4 h-4 text-primary" />
              Compensation & Terms
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 divide-y divide-border/40 pt-2">
            <InfoItem
              label="Wage / Month"
              value={formatCurrency(contract.wage)}
              icon={Wallet}
            />
            <InfoItem
              label="Salary Structure"
              value={contract.salaryStructure}
              icon={Receipt}
            />
            <InfoItem
              label="Start Date"
              value={formatDate(contract.startDate)}
              icon={Calendar}
            />
            <InfoItem
              label="End Date"
              value={contract.endDate ? formatDate(contract.endDate) : "Ongoing"}
              icon={Calendar}
            />
          </CardContent>
        </Card>
      </div>

      {/* Business Rule Note Block */}
      <div className="bg-muted/50 border border-border rounded-md p-3.5 text-sm text-muted-foreground flex items-center gap-3">
        <Info className="w-4 h-4 text-primary shrink-0" />
        <span>
          Payroll uses only the contract marked <strong className="text-foreground font-semibold">Active</strong> for the selected payroll period.
        </span>
      </div>

      {/* Contract History Timeline Section */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3 border-b border-border/40">
          <CardTitle className="text-base font-semibold text-foreground">
            Contract History for {contract.employeeName}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {historyLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : history.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No historical contract records found.
            </p>
          ) : (
            <div className="relative border-l-2 border-border/70 ml-3.5 pl-6 space-y-6">
              {history.map((c) => {
                const isCurrent = isSameId(c.id, contract.id);
                const cIsActive = String(c.status).toLowerCase() === "active";

                return (
                  <div key={c.id} className="relative group">
                    {/* Timeline Dot */}
                    <div
                      className={`absolute -left-[31px] top-4 w-3.5 h-3.5 rounded-full border-2 border-background transition-colors ${
                        isCurrent
                          ? "bg-primary ring-4 ring-primary/20"
                          : "bg-muted-foreground/40 group-hover:bg-primary/60"
                      }`}
                    />

                    {/* Timeline Card */}
                    <Card
                      onClick={() => {
                        if (!isCurrent) navigate(`/contracts/${c.id}`);
                      }}
                      className={`p-4 transition-all duration-200 border ${
                        isCurrent
                          ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20"
                          : "border-border/60 bg-card hover:border-border hover:shadow-sm cursor-pointer"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2.5">
                            <span className="font-mono text-xs font-semibold text-foreground">
                              {c.contractId}
                            </span>
                            {isCurrent && (
                              <span className="text-[10px] uppercase font-bold tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                                Currently Viewing
                              </span>
                            )}
                            <StatusBadge status={c.status} />
                            {cIsActive && (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                            )}
                          </div>

                          <p className="text-xs text-muted-foreground">
                            {c.jobPosition} â€¢ {c.department}
                          </p>
                        </div>

                        <div className="sm:text-right space-y-0.5 shrink-0">
                          <div className="text-sm font-semibold text-foreground">
                            {formatCurrency(c.wage)}{" "}
                            <span className="text-xs text-muted-foreground font-normal">
                              / month
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground font-medium">
                            {formatDate(c.startDate)} â€“{" "}
                            {c.endDate ? formatDate(c.endDate) : "Ongoing"}
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

