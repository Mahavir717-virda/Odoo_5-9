import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import GoogleSignInButton from "../components/auth/GoogleSignInButton";
import Logo from "../components/common/Logo";
import { Eye, EyeOff, ArrowRight, Lock, Mail } from "lucide-react";

function SignIn() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const SubmitForm = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");
    try {
      const userData = await login(formData.email, formData.password);
      setMessage(`Welcome back, ${userData.name || userData.email}`);
      navigate("/dashboard");
    } catch (error) {
      setMessage(error.message || "Invalid email or password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const isError =
    message.toLowerCase().includes("failed") ||
    message.toLowerCase().includes("invalid") ||
    message.toLowerCase().includes("error") ||
    message.toLowerCase().includes("incorrect") ||
    message.toLowerCase().includes("wrong");

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Left Brand Panel */}
      <div
        className="hidden lg:flex lg:w-[420px] xl:w-[480px] shrink-0 flex-col justify-between p-10 bg-slate-900 text-white"
      >
        <div>
          <div className="mb-14">
            <Logo size={46} lightText={true} />
          </div>

          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white leading-tight">
              Your complete HR &<br />Payroll platform
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed max-w-xs">
              Streamline your workforce management, automate payroll processing, and keep your team informed — all in one place.
            </p>
          </div>

          <div className="mt-12 space-y-4">
            {[
              { label: "Payroll Automation", desc: "Process payroll in minutes" },
              { label: "Employee Management", desc: "Complete HR lifecycle" },
              { label: "Leave & Attendance", desc: "Track time accurately" },
            ].map((f) => (
              <div key={f.label} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-teal-500/20 border border-teal-500/30 flex items-center justify-center mt-0.5 shrink-0">
                  <div className="w-2 h-2 rounded-full bg-teal-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{f.label}</p>
                  <p className="text-xs text-slate-400">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-slate-500">
          © {new Date().getFullYear()} PeoplePay360. Enterprise HR & Payroll.
        </p>
      </div>

      {/* Right Login Panel */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-10 bg-slate-50">
        {/* Mobile brand */}
        <div className="lg:hidden flex items-center justify-center mb-8">
          <Logo size={44} />
        </div>

        <div className="w-full max-w-md bg-white p-8 rounded-2xl border border-slate-200/80 shadow-xs">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900">Sign in to your account</h1>
            <p className="text-sm text-slate-500 mt-1">
              Enter your credentials to access the platform
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={SubmitForm} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  name="email"
                  onChange={handleChange}
                  value={formData.email}
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@company.com"
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 text-slate-900 placeholder:text-slate-400 transition-all shadow-xs"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-slate-700">
                  Password
                </label>
                <Link
                  to="/change-password"
                  className="text-xs font-semibold text-teal-700 hover:text-teal-800 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  name="password"
                  onChange={handleChange}
                  value={formData.password}
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 text-slate-900 placeholder:text-slate-400 transition-all shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Error / Success Message */}
            {message && (
              <div
                className={`p-3 rounded-lg text-sm ${
                  isError
                    ? "bg-red-50 text-red-700 border border-red-200"
                    : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                }`}
              >
                {message}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white text-sm font-semibold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 border-t border-slate-200" />
            <span className="text-xs text-slate-400 font-medium">or continue with</span>
            <div className="flex-1 border-t border-slate-200" />
          </div>

          <div className="flex justify-center">
            <GoogleSignInButton />
          </div>

          {/* Demo Credentials */}
          <div className="mt-6 bg-slate-50 border border-slate-200 rounded-lg p-4">
            <p className="text-xs font-semibold text-slate-900 uppercase tracking-wide mb-2">
              Demo Credentials
            </p>
            <div className="space-y-1">
              {[
                { role: "Admin",          cred: "admin@gmail.com / Password123!" },
                { role: "HR Manager",     cred: "hr@gmail.com / Password123!" },
                { role: "HR Payroll User",cred: "hrpayrolluser@gmail.com / SecurePassword123!" },
                { role: "HR Pay Manager", cred: "payrolluser@gmail.com / Password123!" },
                { role: "Employee",       cred: "employee@gmail.com / Password123" },
              ].map(({ role, cred }) => (
                <div key={role} className="flex items-baseline gap-2 text-xs">
                  <span className="font-medium text-slate-700 shrink-0 w-28">{role}:</span>
                  <span className="text-slate-500 font-mono text-[11px]">{cred}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-center text-xs text-slate-500 mt-5">
            Don't have an account?{" "}
            <Link to="/signup" className="text-teal-700 font-semibold hover:text-teal-800 hover:underline">
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default SignIn;
