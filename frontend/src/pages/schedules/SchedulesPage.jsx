import React from "react";
import { Clock } from "lucide-react";
import EmptyState from "../../components/common/EmptyState";

export default function SchedulesPage() {
  return (
    <div>
      <EmptyState
        icon={Clock}
        title="Work Schedules — Coming in Phase 2"
        description="Define working hours, shift assignments, flexible schedules, and attendance time parameters."
      />
    </div>
  );
}
