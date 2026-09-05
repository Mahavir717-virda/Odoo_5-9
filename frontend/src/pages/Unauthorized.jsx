import { ShieldAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Unauthorized() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 text-center border border-gray-200 dark:border-gray-700">
        <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Access Restricted
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Your current role (
          <span className="font-semibold text-gray-800 dark:text-gray-200">
            {user?.role || "Guest"}
          </span>
          ) does not have permission to view this page. Contact an administrator if you believe this is an error.
        </p>
        <button
          onClick={() => navigate("/dashboard")}
          className="w-full py-2 px-4 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}
