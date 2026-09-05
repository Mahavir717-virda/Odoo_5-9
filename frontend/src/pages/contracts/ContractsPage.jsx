import React from "react";
import { FileCheck } from "lucide-react";
import EmptyState from "../../components/common/EmptyState";

export default function ContractsPage() {
  return (
    <div>
      <EmptyState
        icon={FileCheck}
        title="Contracts Management — Coming in Phase 2"
        description="Track active employee contracts, wage structures, duration periods, and renewal statuses."
      />
    </div>
  );
}
