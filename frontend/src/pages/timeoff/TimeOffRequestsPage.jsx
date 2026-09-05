import React from "react";
import { Calendar } from "lucide-react";
import EmptyState from "../../components/common/EmptyState";

export default function TimeOffRequestsPage() {
  return (
    <div>
      <EmptyState
        icon={Calendar}
        title="Time Off Requests — Coming in Phase 3"
        description="Review, approve, or reject employee leave requests and track leave history across departments."
      />
    </div>
  );
}
