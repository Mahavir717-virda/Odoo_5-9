import React from "react";
import { Settings } from "lucide-react";
import EmptyState from "../../components/common/EmptyState";

export default function SystemSettingsPage() {
  return (
    <div>
      <EmptyState
        icon={Settings}
        title="System Settings — Coming in Phase 5"
        description="Manage global platform configurations, company branding, localization settings, and integration parameters."
      />
    </div>
  );
}
