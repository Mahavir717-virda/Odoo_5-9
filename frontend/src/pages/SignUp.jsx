import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import GoogleSignInButton from "../components/auth/GoogleSignInButton";
import Logo from "../components/common/Logo";
import { Eye, EyeOff, ArrowRight, Lock, Mail, User } from "lucide-react";

function SignUp() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({ email: "", password: "", name: "" });
  const [avatar, setAvatar] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setAvatar(file);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const payload = new FormData();
      payload.append("email", formData.email);
      payload.append("password", formData.password);
      if (formData.name) payload.append("name", formData.name);
      if (avatar) payload.append("avatar", avatar);
      await register(payload);
      setMessage("Account created successfully! Redirecting...");
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (error) {
      setMessage(error.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isError =
    message.toLowerCase().includes("fail") ||
    message.toLowerCase().includes("error") ||
    message.toLowerCase().includes("invalid");

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="flex items-center justify-center mb-8">
          <Logo size={48} />
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-8 space-y-5">
          <div className="text-center">
            <h1 className="text-xl font-bold text-slate-900">Create your account</h1>
            <p className="text-sm text-slate-500 mt-1">Join PeoplePay360 today</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  name="name"
                  onChange={handleChange}
                  value={formData.name}
                  type="text"
                  placeholder="Your full name"
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 text-slate-900 placeholder:text-slate-400 transition-all shadow-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email address</label>
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
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  name="password"
                  onChange={handleChange}
                  value={formData.password}
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  placeholder="Create a strong password"
                  className="w-full pl-10 pr-10 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 text-slate-900 placeholder:text-slate-400 transition-all shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Profile photo <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full text-sm text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-teal-50 file:text-teal-800 hover:file:bg-teal-100 file:transition-colors cursor-pointer"
              />
            </div>

            {message && (
              <div
                className={`flex items-start gap-2.5 p-3 rounded-lg text-sm ${
                  isError
                    ? "bg-red-50 border border-red-200 text-red-700"
                    : "bg-emerald-50 border border-emerald-200 text-emerald-700"
                }`}
              >
                <span>{message}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white text-sm font-semibold rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-1 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Create account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="flex items-center gap-3">
            <div className="flex-1 border-t border-slate-200" />
            <span className="text-xs text-slate-400 font-medium">or</span>
            <div className="flex-1 border-t border-slate-200" />
          </div>

          <div className="flex justify-center">
            <GoogleSignInButton />
          </div>
        </div>

        <p className="text-center text-xs text-slate-500 mt-5">
          Already have an account?{" "}
          <Link to="/login" className="text-teal-700 font-semibold hover:text-teal-800 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default SignUp;
