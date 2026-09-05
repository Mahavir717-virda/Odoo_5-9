import React from "react";
import { FileText } from "lucide-react";
import EmptyState from "../../components/common/EmptyState";

export default function SalaryRulesPage() {
  return (
    <div>
      <EmptyState
        icon={FileText}
        title="Salary Rules — Coming in Phase 4"
        description="Define computational formulas for allowances, tax brackets, insurance deductions, and bonuses."
      />
    </div>
  );
}
