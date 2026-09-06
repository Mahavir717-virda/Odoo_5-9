import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";

function ChangePassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Send OTP, 2: Verify OTP, 3: New Password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  // Step 1: Send OTP to email
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setIsError(false);
    setMessage("");

    if (!email.trim()) {
      setIsError(true);
      setMessage("Please enter your email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/send-otp", {
        email: email.trim().toLowerCase(),
      });

      setIsError(false);
      setMessage(res.data?.message || `OTP sent to ${email}. Check your inbox or use demo OTP.`);
      setStep(2);
    } catch (error) {
      setIsError(true);
      setMessage(
        error.message ||
        error.response?.data?.message ||
        "Failed to send OTP. Please check your email and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setIsError(false);
    setMessage("");

    if (!otp.trim()) {
      setIsError(true);
      setMessage("Please enter the 6-digit OTP.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/verify-otp", {
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
      });

      setIsError(false);
      setMessage(res.data?.message || "OTP verified! Please create your new password.");
      setStep(3);
    } catch (error) {
      setIsError(true);
      setMessage(
        error.message ||
        error.response?.data?.message ||
        "Invalid OTP. Please check the code and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Change Password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setIsError(false);
    setMessage("");

    if (newPassword !== confirmPassword) {
      setIsError(true);
      setMessage("Passwords do not match. Please re-enter.");
      return;
    }

    if (newPassword.length < 6) {
      setIsError(true);
      setMessage("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/reset-password", {
        email: email.trim().toLowerCase(),
        password: newPassword,
        otp: otp.trim(),
      });

      setIsError(false);
      setMessage(res.data?.message || "Password changed successfully! Redirecting to login...");
      setTimeout(() => navigate("/login"), 2000);
    } catch (error) {
      setIsError(true);
      setMessage(
        error.message ||
        error.response?.data?.message ||
        "Failed to change password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md border border-slate-200 p-8 space-y-6">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-teal-700 flex items-center justify-center text-white font-bold text-sm mx-auto mb-3 shadow-md">
            P360
          </div>
          <h2 className="text-2xl font-bold text-slate-800">
            {step === 1 && "Reset Password"}
            {step === 2 && "Enter Verification Code"}
            {step === 3 && "Set New Password"}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {step === 1 && "Enter your email address to receive a secure OTP code."}
            {step === 2 && `Enter the 6-digit verification code sent to ${email}.`}
            {step === 3 && "Choose a strong password with at least 6 characters."}
          </p>

          {/* Stepper Indicator */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <span className={`h-1.5 rounded-full transition-all ${step === 1 ? "w-8 bg-teal-700" : "w-3 bg-slate-200"}`} />
            <span className={`h-1.5 rounded-full transition-all ${step === 2 ? "w-8 bg-teal-700" : "w-3 bg-slate-200"}`} />
            <span className={`h-1.5 rounded-full transition-all ${step === 3 ? "w-8 bg-teal-700" : "w-3 bg-slate-200"}`} />
          </div>
        </div>

        {/* Step 1: Request OTP */}
        {step === 1 && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
                Enter your email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@company.com"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              {loading ? "Sending OTP..." : "Send Verification Code"}
            </button>
          </form>
        )}

        {/* Step 2: Verify OTP */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
                Enter 6-Digit OTP
              </label>
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="e.g. 123456"
                required
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white transition-colors text-center tracking-widest font-mono text-base font-bold"
              />
              <p className="text-[11px] text-slate-400 mt-1 text-center">
                Check server log / alert or enter demo code <strong className="text-teal-700">123456</strong>
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setMessage("");
                }}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 px-4 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Set New Password */}
        {step === 3 && (
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              {loading ? "Saving Password..." : "Update Password"}
            </button>
          </form>
        )}

        {message && (
          <div
            className={`p-3 rounded-lg text-xs font-medium text-center ${
              isError
                ? "bg-red-50 text-red-700 border border-red-200"
                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
            }`}
          >
            {message}
          </div>
        )}

        <div className="pt-2 border-t border-slate-100 text-center text-xs">
          <Link to="/login" className="text-teal-700 font-medium hover:underline">
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ChangePassword;

