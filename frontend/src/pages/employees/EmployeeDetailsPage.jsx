import React from "react";
import { UserCheck } from "lucide-react";
import EmptyState from "../../components/common/EmptyState";

export default function EmployeeDetailsPage() {
  return (
    <div>
      <EmptyState
        icon={UserCheck}
        title="Employee Details — Coming in Phase 2"
        description="Detailed view of employee records, contracts, work schedules, attendance history, and payslips."
      />
    </div>
  );
}
