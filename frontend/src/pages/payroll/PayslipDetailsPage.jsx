import React from "react";
import { FileText } from "lucide-react";
import EmptyState from "../../components/common/EmptyState";

export default function PayslipDetailsPage() {
  return (
    <div>
      <EmptyState
        icon={FileText}
        title="Payslip Details — Coming in Phase 4"
        description="Detailed itemization of basic salary, allowances, tax deductions, social security, and net pay."
      />
    </div>
  );
}
