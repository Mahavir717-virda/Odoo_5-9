import { useAuth } from "../context/AuthContext";
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
} from "../utils/permissions";

export function usePermissions() {
  const { user } = useAuth();
  const role = user?.role ?? null;

  return {
    role,
    can: (permission) => hasPermission(role, permission),
    canAny: (permissionsArray) => hasAnyPermission(role, permissionsArray),
    canAll: (permissionsArray) => hasAllPermissions(role, permissionsArray),
  };
}
