import React from "react";
import { Calendar } from "lucide-react";
import EmptyState from "../../components/common/EmptyState";

export default function TimeOffAllocationsPage() {
  return (
    <div>
      <EmptyState
        icon={Calendar}
        title="Time Off Allocations — Coming in Phase 3"
        description="Allocate annual leave balances, sick leave allowances, and custom time-off credit pools to employees."
      />
    </div>
  );
}
