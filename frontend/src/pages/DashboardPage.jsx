import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { User, Mail, Shield, LogOut, Key, UserCheck } from "lucide-react";

function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      navigate("/login");
    }
  };

  const formatRole = (role) => {
    if (!role) return "User";
    return role
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            Welcome back, {user?.name || "User"}!
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            PeoplePay360 HR & Payroll Management Dashboard
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-semibold rounded-lg border border-red-200 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>

      {/* User Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <User className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Full Name</p>
            <p className="text-base font-semibold text-slate-800">{user?.name || "N/A"}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Email Address</p>
            <p className="text-base font-semibold text-slate-800 truncate">{user?.email || "N/A"}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Assigned Role</p>
            <span className="inline-block mt-0.5 px-2.5 py-0.5 text-xs font-semibold bg-purple-100 text-purple-700 rounded-full">
              {formatRole(user?.role)}
            </span>
          </div>
        </div>
      </div>

      {/* Action Links */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-800 mb-3 uppercase tracking-wider">
          Quick Actions
        </h3>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/change-password"
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors"
          >
            <Key className="w-4 h-4 text-slate-500" />
            Change Password
          </Link>
          <Link
            to="/profile"
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors"
          >
            <UserCheck className="w-4 h-4 text-slate-500" />
            View Full Profile
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
