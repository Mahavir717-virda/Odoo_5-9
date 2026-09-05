import React from "react";
import { Settings } from "lucide-react";
import EmptyState from "../../components/common/EmptyState";

export default function RolesSettingsPage() {
  return (
    <div>
      <EmptyState
        icon={Settings}
        title="Roles & Permissions Settings — Coming in Phase 5"
        description="Configure fine-grained access policies, permission sets, and custom organizational roles."
      />
    </div>
  );
}
