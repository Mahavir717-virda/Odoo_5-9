import React from "react";
import { DollarSign } from "lucide-react";
import EmptyState from "../../components/common/EmptyState";

export default function PayrunsListPage() {
  return (
    <div>
      <EmptyState
        icon={DollarSign}
        title="Payruns — Coming in Phase 4"
        description="Manage batch payroll processing, batch calculation, approval workflows, and payment confirmations."
      />
    </div>
  );
}
