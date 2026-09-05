import React from "react";
import { UserPlus } from "lucide-react";
import EmptyState from "../../components/common/EmptyState";

export default function EmployeeFormPage() {
  return (
    <div>
      <EmptyState
        icon={UserPlus}
        title="Employee Form — Coming in Phase 2"
        description="Add and edit employee personal details, job position, department, and compensation specifications."
      />
    </div>
  );
}
