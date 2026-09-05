import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Logout() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("Logging out...");

  useEffect(() => {
    const handleLogout = async () => {
      try {
        await axios.post("/users/logout", {}, { withCredentials: true });
        localStorage.removeItem("userEmail");
        setMessage("Logged out successfully. Redirecting...");
        setTimeout(() => {
          navigate("/Signin");
        }, 1000);
      } catch (error) {
        console.error(error);
        localStorage.removeItem("userEmail");
        setMessage("Logged out locally. Redirecting...");
        setTimeout(() => {
          navigate("/Signin");
        }, 1000);
      }
    };

    handleLogout();
  }, [navigate]);

  return (
    <div>
      <h2>Logout</h2>
      <p>{message}</p>
    </div>
  );
}

export default Logout;
