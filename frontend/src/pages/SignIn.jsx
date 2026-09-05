import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import GoogleSignInButton from "../components/GoogleSignInButton";

function SignIn() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const SubmitForm = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        email: formData.email,
        password: formData.password,
      };
      const response = await axios.post("/users/signin", payload);

      const userEmail = formData.email;
      setMessage(`User ${userEmail} Logged In successfully`);
      localStorage.setItem("userEmail", userEmail);
      navigate("/Dashboard");
    } catch (error) {
      console.log(error);
      setMessage(error.response?.data?.message || "Login failed");
    }
  };
  return (
    <>
      <form onSubmit={SubmitForm}>
        <div>Email : </div>
        <input name="email" onChange={handleChange} type="text"></input>
        <div>Password : </div>
        <input name="password" onChange={handleChange} type="text"></input>
        <br></br>
        <button type="submit">Log in </button>
      </form>

      <GoogleSignInButton />

      {/* Display message if it exists */}
      {message && (
        <>
          <p style={{ color: message.includes("failed") ? "red" : "green" }}>
            {message}
          </p>
          <br />
          <div>
            <a href="/change-password">Forgot / Change Password?</a>
            <a href="/Signup">Sign Up</a>
          </div>
        </>
      )}
    </>
  );
}
export default SignIn;
