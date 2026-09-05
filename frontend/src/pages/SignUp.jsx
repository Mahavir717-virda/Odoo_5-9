import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import GoogleSignInButton from "../components/GoogleSignInButton";

function SignUp() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [avatar, setAvatar] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatar(file);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const SubmitForm = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const data = new FormData();
      data.append("email", formData.email);
      data.append("password", formData.password);

      if (avatar) {
        data.append("avatar", avatar);
      }

      const response = await register(data);
      console.log("Registration successful:", response);
      navigate("/login");
    } catch (error) {
      console.log("Error while signing up", error);
      setMessage(error.message || "Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md border border-slate-200 p-8 space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800">Create Account</h2>
          <p className="text-xs text-slate-500 mt-1">
            Join PeoplePay360 Employee Portal
          </p>
        </div>

        <form onSubmit={SubmitForm} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
              Email Address
            </label>
            <input
              value={formData.email}
              name="email"
              type="email"
              required
              onChange={handleChange}
              placeholder="you@company.com"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
              Password
            </label>
            <input
              value={formData.password}
              name="password"
              type="password"
              required
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
              Profile Picture (Optional)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
          >
            {loading ? "Registering..." : "Sign Up"}
          </button>
        </form>

        <div className="flex justify-center">
          <GoogleSignInButton />
        </div>

        {message && (
          <div className="p-3 rounded-lg text-xs font-medium text-center bg-red-50 text-red-700 border border-red-200">
            {message}
          </div>
        )}

        <div className="pt-2 border-t border-slate-100 text-center text-xs">
          <Link to="/login" className="text-blue-600 font-medium hover:underline">
            Already have an account? Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

export default SignUp;
