import React from "react";
import { FileText } from "lucide-react";
import EmptyState from "../../components/common/EmptyState";

export default function MyPayslipsPage() {
  return (
    <div>
      <EmptyState
        icon={FileText}
        title="My Payslips — Self Service"
        description="View and download personal monthly payslips, compensation breakdowns, and tax summaries."
      />
    </div>
  );
}
