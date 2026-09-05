import React from "react";
import { DollarSign } from "lucide-react";
import EmptyState from "../../components/common/EmptyState";

export default function PayrunDetailsPage() {
  return (
    <div>
      <EmptyState
        icon={DollarSign}
        title="Payrun Details — Coming in Phase 4"
        description="View individual payrun summaries, employee breakdown, gross-to-net calculations, and export reports."
      />
    </div>
  );
}
