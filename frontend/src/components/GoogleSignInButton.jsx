import { useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function GoogleSignInButton() {
  const buttonRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Wait for the Google script to load
    const initGoogle = () => {
      if (!window.google) return;

      window.google.accounts.id.initialize({
        client_id: "246599226169-ep9862s8m1d8d6b2rk8jdhqmfrq66tpa.apps.googleusercontent.com",
        callback: handleGoogleResponse,
      });

      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: "outline",
        size: "large",
        width: 250,
      });
    };

    // If Google script is already loaded, init immediately
    if (window.google) {
      initGoogle();
    } else {
      // Otherwise wait for it to load
      const interval = setInterval(() => {
        if (window.google) {
          clearInterval(interval);
          initGoogle();
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, []);

  const handleGoogleResponse = async (response) => {
    try {
      const res = await axios.post("/users/google-auth", {
        credential: response.credential,
      });

      const userEmail = res.data?.data?.user?.email;
      localStorage.setItem("userEmail", userEmail);
      navigate("/Dashboard");
    } catch (error) {
      console.log("Google sign-in error:", error.response?.data || error.message);
    }
  };

  return (
    <div>
      <div style={{ textAlign: "center", margin: "15px 0", color: "#888" }}>
        — OR —
      </div>
      <div ref={buttonRef}></div>
    </div>
  );
}

export default GoogleSignInButton;
