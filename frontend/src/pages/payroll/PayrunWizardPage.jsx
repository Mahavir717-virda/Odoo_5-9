import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  DollarSign,
  ArrowLeft,
  Calendar,
  Layers,
  Sparkles,
  AlertCircle,
  Play,
  CheckCircle2,
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

export default function PayrunWizardPage() {
  const navigate = useNavigate();

  const [structures, setStructures] = useState([]);
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
    const loadStructures = async () => {
      try {
        const data = await payrollManagerService.listSalaryStructures();
        setStructures(data || []);
        if (data && data.length > 0) {
          setStructureId(String(data[0].id));
        }
      } catch (err) {
        setFormError(err.message || "Failed to load salary structures");
      } finally {
        setLoading(false);
      }
    };
    loadStructures();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim() || !periodStart || !periodEnd || !structureId) {
      setFormError("All fields are required to initialize a payrun batch.");
      return;
    }

    setSubmitting(true);
    try {
      const created = await payrollManagerService.createPayrun({
        name: name.trim(),
        period_start: periodStart,
        period_end: periodEnd,
        structure_id: structureId,
      });

      // Navigate to Payrun details page to compute and review
      navigate(`/payroll/payruns/${created.id}`);
    } catch (err) {
      setFormError(err.message || "Failed to create payrun.");
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-16 max-w-3xl mx-auto">
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
        subtitle="Initialize a new monthly salary processing batch with active employee contracts and salary structures."
      />

      <Card className="border-border bg-card shadow-xs">
        <CardHeader className="border-b border-border/40 pb-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
            <DollarSign className="w-4 h-4 text-primary" />
            Batch Configuration & Payroll Period
          </CardTitle>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="p-6 space-y-5">
            {formError && (
              <div className="p-3.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <FormField label="Payrun Batch Name" required>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. March 2026 Standard Payrun"
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

            <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-800/40 text-xs text-blue-900 dark:text-blue-200 space-y-1">
              <p className="font-semibold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-600" />
                Automatic Batch Computation
              </p>
              <p className="text-[11px] text-muted-foreground">
                After initializing this batch, you will be directed to the Payrun Manager to compute payslips against all active employee contracts, attendance hours, and approved leaves.
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
            <Button
              type="submit"
              size="sm"
              disabled={submitting}
              className="text-xs gap-1.5 shadow-xs"
            >
              {submitting ? "Creating..." : "Initialize Batch"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
