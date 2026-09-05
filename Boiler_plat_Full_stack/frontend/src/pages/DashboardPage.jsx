import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

function Dashboard() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");

  useEffect(() => {
    const storedEmail = localStorage.getItem("userEmail");
    if (storedEmail) {
      setEmail(storedEmail);
    }
  }, []);

  const handleLogout = async () => {
    try {
      await axios.post("/users/logout", {}, { withCredentials: true });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("userEmail");
      navigate("/Signin");
    }
  };

  return (
    <>
      <h1> Dashboard page</h1>
      {email && <p>Welcome, {email}!</p>}
      <br />
      <button onClick={handleLogout}>Logout</button>
      <br />
      <br />
      <Link to="/change-password">Change Password</Link>
      <br />
      <br />
      <Link to="/profile">Profile</Link>

    </>
  );
}

export default Dashboard;

