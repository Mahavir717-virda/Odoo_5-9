import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

function ChangePassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [step, setStep] = useState(1); // 1: Send OTP, 2: Verify OTP, 3: Change Password

  const handleSendOtp = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("/users/send-otp", { email });
      setMessage(response.data.message || "OTP sent successfully!");
      setStep(2);
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to send OTP");
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("/users/verify-otp", { email, otp });
      setMessage(response.data.message || "OTP verified successfully!");
      setStep(3);
    } catch (error) {
      setMessage(error.response?.data?.message || "Invalid or expired OTP");
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("/users/change-password", {
        email,
        password: newPassword,
      });
      setMessage(response.data.message || "Password changed successfully!");
      setTimeout(() => {
        navigate("/Signin");
      }, 1500);
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to change password");
    }
  };

  return (
    <div>
      <h2>Change / Reset Password</h2>

      {step === 1 && (
        <form onSubmit={handleSendOtp}>
          <div>Email:</div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <br />
          <button type="submit">Send OTP</button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleVerifyOtp}>
          <div>Enter OTP sent to {email}:</div>
          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
          />
          <br />
          <button type="submit">Verify OTP</button>
          <button type="button" onClick={() => setStep(1)}>
            Back
          </button>
        </form>
      )}

      {step === 3 && (
        <form onSubmit={handleChangePassword}>
          <div>Enter New Password:</div>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <br />
          <button type="submit">Change Password</button>
        </form>
      )}

      {message && <p>{message}</p>}

      <br />
      <Link to="/Signin">Back to Sign In</Link>
    </div>
  );
}

export default ChangePassword;
