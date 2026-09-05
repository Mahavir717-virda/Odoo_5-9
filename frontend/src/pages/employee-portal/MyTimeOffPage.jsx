import React from "react";
import { Calendar } from "lucide-react";
import EmptyState from "../../components/common/EmptyState";

export default function MyTimeOffPage() {
  return (
    <div>
      <EmptyState
        icon={Calendar}
        title="My Time Off — Self Service"
        description="Submit leave requests, check your remaining annual/sick leave balances, and view request approval statuses."
      />
    </div>
  );
}
