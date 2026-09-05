import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import GoogleSignInButton from "../components/GoogleSignInButton";

function SignIn() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const SubmitForm = async (e) => {
    e.preventDefault();
    try {
      const userData = await login(formData.email, formData.password);
      setMessage(`User ${userData.email} Logged In successfully`);
      navigate("/dashboard");
    } catch (error) {
      console.log(error);
      setMessage(error.message || "Login failed");
    }
  };

  const isError =
    message.toLowerCase().includes("failed") ||
    message.toLowerCase().includes("invalid") ||
    message.toLowerCase().includes("error");

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md border border-slate-200 p-8 space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800">Sign In</h2>
          <p className="text-xs text-slate-500 mt-1">
            PeoplePay360 — HR & Payroll Management System
          </p>
        </div>

        <form onSubmit={SubmitForm} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
              Email Address
            </label>
            <input
              name="email"
              onChange={handleChange}
              value={formData.email}
              type="email"
              required
              placeholder="admin@peoplepay360.com"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
              Password
            </label>
            <input
              name="password"
              onChange={handleChange}
              value={formData.password}
              type="password"
              required
              placeholder="••••••••"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
          >
            Log in
          </button>
        </form>

        <div className="flex justify-center">
          <GoogleSignInButton />
        </div>

        {/* Demo Credentials Helper Note */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-600 space-y-1">
          <p className="font-semibold text-slate-800 border-b border-slate-200 pb-1 mb-1">
            Demo Credentials:
          </p>
          <p><span className="font-medium text-slate-700">Admin:</span> admin@gmail.com / Password123!</p>
          <p><span className="font-medium text-slate-700">HR Manager:</span> hr@gmail.com / Password123!</p>
          <p><span className="font-medium text-slate-700">HR Payroll User:</span> hrpayrolluser@gmail.com / SecurePassword123!</p>
          <p><span className="font-medium text-slate-700">HR Payroll Manager:</span> payrolluser@gmail.com / Password123!</p>
          <p><span className="font-medium text-slate-700">Employee:</span> employee@gmail.com / Password123</p>
        </div>

        {/* Feedback Message & Links */}
        {message && (
          <div
            className={`p-3 rounded-lg text-xs font-medium text-center ${
              isError ? "bg-red-50 text-red-700 border border-red-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"
            }`}
          >
            {message}
          </div>
        )}

        <div className="pt-2 border-t border-slate-100 flex flex-col items-center gap-1.5 text-xs text-blue-600 font-medium">
          <Link to="/change-password" className="hover:underline">
            Forgot / Change Password?
          </Link>
          <Link to="/signup" className="hover:underline">
            Don't have an account? Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}

export default SignIn;
