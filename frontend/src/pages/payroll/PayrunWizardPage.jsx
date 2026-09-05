import React from "react";
import { DollarSign } from "lucide-react";
import EmptyState from "../../components/common/EmptyState";

export default function PayrunWizardPage() {
  return (
    <div>
      <EmptyState
        icon={DollarSign}
        title="Payrun Processing Wizard — Coming in Phase 4"
        description="Step-by-step wizard to generate monthly payruns, validate attendance inputs, compute deductions, and finalize payments."
      />
    </div>
  );
}
