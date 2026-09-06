import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function GoogleSignInButton() {
  const buttonRef = useRef(null);
  const navigate = useNavigate();
  const { loginWithGoogle } = useAuth();
  const [authError, setAuthError] = useState("");

  const handleGoogleResponse = async (response) => {
    try {
      setAuthError("");
      const user = await loginWithGoogle({
        credential: response.credential,
      });

      // Role-based destination
      const role = user?.role?.toUpperCase();
      if (role === "EMPLOYEE") {
        navigate("/portal/dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Google sign-in error:", error);
      setAuthError(error.message || "Google sign-in failed. Please try again.");
    }
  };

  useEffect(() => {
    // Wait for the Google script to load
    const initGoogle = () => {
      if (!window.google || !window.google.accounts?.id || !buttonRef.current) return;

      try {
        window.google.accounts.id.initialize({
          client_id: "246599226169-ep9862s8m1d8d6b2rk8jdhqmfrq66tpa.apps.googleusercontent.com",
          callback: handleGoogleResponse,
        });

        buttonRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: "outline",
          size: "large",
          width: 280,
          text: "continue_with",
          shape: "rectangular",
        });
      } catch (e) {
        console.warn("Google identity init error:", e);
      }
    };

    if (window.google?.accounts?.id) {
      initGoogle();
    } else {
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(interval);
          initGoogle();
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, []);

  return (
    <div className="w-full flex flex-col items-center">
      <div ref={buttonRef} className="min-h-[40px] flex items-center justify-center"></div>
      {authError && (
        <p className="mt-2 text-xs text-rose-600 text-center font-medium">
          {authError}
        </p>
      )}
    </div>
  );
}

export default GoogleSignInButton;
