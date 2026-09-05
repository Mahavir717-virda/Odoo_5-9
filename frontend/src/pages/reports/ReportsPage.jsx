import React from "react";
import { BarChart3 } from "lucide-react";
import EmptyState from "../../components/common/EmptyState";

export default function ReportsPage() {
  return (
    <div>
      <EmptyState
        icon={BarChart3}
        title="Reports & Analytics — Coming in Phase 5"
        description="Generate HR metrics, attendance summaries, payroll cost analysis, and export compliance reports."
      />
    </div>
  );
}
