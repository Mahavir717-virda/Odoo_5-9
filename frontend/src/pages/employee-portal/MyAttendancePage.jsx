import React from "react";
import { Clock } from "lucide-react";
import EmptyState from "../../components/common/EmptyState";

export default function MyAttendancePage() {
  return (
    <div>
      <EmptyState
        icon={Clock}
        title="My Attendance — Self Service"
        description="Clock in and out, view personal attendance history, check daily worked hours, and request attendance corrections."
      />
    </div>
  );
}
