import React from "react";
import { Clock } from "lucide-react";
import EmptyState from "../../components/common/EmptyState";

export default function AttendancePage() {
  return (
    <div>
      <EmptyState
        icon={Clock}
        title="Attendance Tracking — Coming in Phase 2"
        description="Monitor daily check-ins/check-outs, calculate worked hours, manage overtime, and edit attendance records."
      />
    </div>
  );
}
