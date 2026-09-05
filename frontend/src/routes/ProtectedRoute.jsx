import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { usePermissions } from "../hooks/usePermissions";

export default function ProtectedRoute({
  children,
  requiredPermission,
  requiredAnyOf,
}) {
  const { isAuthenticated, loading } = useAuth();
  const { can, canAny } = usePermissions();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm text-gray-500">Checking authentication...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredPermission && !can(requiredPermission)) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (Array.isArray(requiredAnyOf) && !canAny(requiredAnyOf)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
