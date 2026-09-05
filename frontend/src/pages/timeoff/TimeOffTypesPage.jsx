import React from "react";
import { Calendar } from "lucide-react";
import EmptyState from "../../components/common/EmptyState";

export default function TimeOffTypesPage() {
  return (
    <div>
      <EmptyState
        icon={Calendar}
        title="Time Off Types — Coming in Phase 3"
        description="Configure leave types (Paid Time Off, Sick Leave, Maternity Leave) and custom approval rules."
      />
    </div>
  );
}
