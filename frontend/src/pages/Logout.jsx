import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LogOut } from "lucide-react";

function Logout() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [message, setMessage] = useState("Logging out...");

  useEffect(() => {
    const handleLogout = async () => {
      try {
        await logout();
        setMessage("Logged out successfully. Redirecting...");
      } catch (error) {
        console.error("Logout error:", error);
        setMessage("Logged out locally. Redirecting...");
      } finally {
        navigate("/login");
      }
    };

    handleLogout();
  }, [logout, navigate]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="max-w-sm w-full bg-white rounded-xl shadow-md border border-slate-200 p-8 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center mx-auto">
          <LogOut className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Logging Out</h2>
        <p className="text-sm text-slate-500">{message}</p>
      </div>
    </div>
  );
}

export default Logout;
