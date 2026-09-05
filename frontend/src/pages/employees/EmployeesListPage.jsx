import React from "react";
import { Users } from "lucide-react";
import EmptyState from "../../components/common/EmptyState";

export default function EmployeesListPage() {
  return (
    <div>
      <EmptyState
        icon={Users}
        title="Employees Management — Coming in Phase 2"
        description="Comprehensive employee lifecycle management, directory listings, status tracking, and profile creation."
      />
    </div>
  );
}
