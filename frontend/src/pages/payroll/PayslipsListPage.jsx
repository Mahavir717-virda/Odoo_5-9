import React from "react";
import { FileText } from "lucide-react";
import EmptyState from "../../components/common/EmptyState";

export default function PayslipsListPage() {
  return (
    <div>
      <EmptyState
        icon={FileText}
        title="Payslips — Coming in Phase 4"
        description="Browse all generated employee payslips, status filters, bulk printing, and PDF exports."
      />
    </div>
  );
}
