import { createContext, useContext, useState, useEffect } from "react";
import * as authService from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedUser = localStorage.getItem("authUser");
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }

        const token = localStorage.getItem("authToken");
        if (token) {
          const freshUser = await authService.getCurrentUser();
          if (freshUser) {
            setUser(freshUser);
          }
        }
      } catch (error) {
        console.error("Failed to initialize auth state:", error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const userData = await authService.loginUser(email, password);
    setUser(userData);
    localStorage.setItem("authUser", JSON.stringify(userData));
    return userData;
  };

  const register = async (formData) => {
    const newUser = await authService.registerUser(formData);
    if (newUser) {
      setUser(newUser);
    }
    return newUser;
  };

  const logout = async () => {
    await authService.logoutUser();
    localStorage.removeItem("authUser");
    setUser(null);
    return true;
  };

  const value = {
    user,
    isAuthenticated: Boolean(user),
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
