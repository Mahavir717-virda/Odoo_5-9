import React from "react";
import { Users } from "lucide-react";
import EmptyState from "../../components/common/EmptyState";

export default function UsersSettingsPage() {
  return (
    <div>
      <EmptyState
        icon={Users}
        title="User Management Settings — Coming in Phase 5"
        description="Administer system users, manage account activation states, send password resets, and assign security roles."
      />
    </div>
  );
}
