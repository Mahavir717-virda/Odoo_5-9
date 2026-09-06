import { ShieldAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Unauthorized() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
      <div className="max-w-sm w-full bg-white shadow-xs rounded-2xl p-8 text-center border border-slate-200">
        <div className="mx-auto flex items-center justify-center w-14 h-14 rounded-full bg-red-50 text-red-600 mb-5 border border-red-100">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">Access Restricted</h1>
        <p className="text-sm text-slate-500 mb-2 leading-relaxed">
          Your current role
        </p>
        <span className="inline-block px-3 py-1 text-xs font-semibold bg-slate-100 text-slate-700 rounded-full mb-4">
          {user?.role || "Guest"}
        </span>
        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
          does not have permission to view this page. Contact your administrator if you believe this is an error.
        </p>
        <button
          onClick={() => navigate("/dashboard")}
          className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-teal-700 rounded-lg hover:bg-teal-800 active:bg-teal-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-1 transition-colors shadow-sm cursor-pointer"
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  );
}
