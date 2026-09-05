import { usePermissions } from "../../hooks/usePermissions";

export default function PermissionGuard({
  permission,
  anyOf,
  allOf,
  children,
  fallback = null,
}) {
  const { can, canAny, canAll } = usePermissions();

  let hasAccess = false;

  if (permission !== undefined) {
    hasAccess = can(permission);
  } else if (Array.isArray(anyOf)) {
    hasAccess = canAny(anyOf);
  } else if (Array.isArray(allOf)) {
    hasAccess = canAll(allOf);
  } else {
    console.warn(
      "PermissionGuard: No 'permission', 'anyOf', or 'allOf' prop was provided. Defaulting to rendering children."
    );
    return children;
  }

  return hasAccess ? children : fallback;
}
