import React from "react";
import { Building2 } from "lucide-react";
import EmptyState from "../../components/common/EmptyState";

export default function SalaryStructuresPage() {
  return (
    <div>
      <EmptyState
        icon={Building2}
        title="Salary Structures — Coming in Phase 4"
        description="Configure compensation tiers, base salary rules, and structural packages across job grades."
      />
    </div>
  );
}
