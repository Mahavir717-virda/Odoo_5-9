import api from "./api";

/**
 * Login user against backend PostgreSQL database
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<{ id: string|number, email: string, name: string, role: string, token: string }>}
 */
export const loginUser = async (email, password) => {
  const response = await api.post("/auth/login", {
    email: email.trim(),
    password,
  });

  const { token, user } = response.data.data;
  if (token) {
    localStorage.setItem("authToken", token);
  }

  // Attempt to fetch detailed employee profile (name, department, avatar, etc.)
  let profileName = user.email.split("@")[0];
  let employeeId = null;
  let department = "";
  let jobPosition = "";
  let avatar = "";

  try {
    const profileRes = await api.get("/employees/me");
    if (profileRes.data?.data) {
      const emp = profileRes.data.data;
      profileName = emp.name || profileName;
      employeeId = emp.id;
      department = emp.department;
      jobPosition = emp.job_position;
      avatar = emp.avatar || "";
    }
  } catch (err) {
    // Fallback if employee profile not created yet
    console.warn("Could not load employee details on login:", err.message);
  }

  const normalizedUser = {
    id: user.id,
    employeeId: employeeId || user.id,
    email: user.email,
    name: profileName,
    role: (user.role || "EMPLOYEE").toUpperCase(),
    department,
    jobPosition,
    avatar,
    token,
  };

  localStorage.setItem("authUser", JSON.stringify(normalizedUser));
  return normalizedUser;
};

/**
 * Fetch current authenticated user session from backend
 */
export const getCurrentUser = async () => {
  const token = localStorage.getItem("authToken");
  if (!token) return null;

  try {
    const authRes = await api.get("/auth/me");
    const user = authRes.data.data;

    let profileName = user.email.split("@")[0];
    let employeeId = null;
    let department = "";
    let jobPosition = "";
    let avatar = "";

    try {
      const profileRes = await api.get("/employees/me");
      if (profileRes.data?.data) {
        const emp = profileRes.data.data;
        profileName = emp.name || profileName;
        employeeId = emp.id;
        department = emp.department;
        jobPosition = emp.job_position;
        avatar = emp.avatar || "";
      }
    } catch {
      // Continue with base user info
    }

    const normalizedUser = {
      id: user.id,
      employeeId: employeeId || user.id,
      email: user.email,
      name: profileName,
      role: (user.role || "EMPLOYEE").toUpperCase(),
      department,
      jobPosition,
      avatar,
      token,
    };

    localStorage.setItem("authUser", JSON.stringify(normalizedUser));
    return normalizedUser;
  } catch (err) {
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
    return null;
  }
};

/**
 * Register a new user
 */
export const registerUser = async (formData) => {
  let email = "";
  let password = "";
  let name = "";

  if (formData instanceof FormData) {
    email = formData.get("email") || "";
    password = formData.get("password") || "";
    name = formData.get("name") || "";
  } else if (formData && typeof formData === "object") {
    email = formData.email || "";
    password = formData.password || "";
    name = formData.name || "";
  }

  // If backend registration endpoint is available, call it; otherwise login or throw
  const response = await api.post("/auth/register", { email, password, name });
  return response.data?.data;
};

/**
 * Logout user
 */
export const logoutUser = async () => {
  localStorage.removeItem("authToken");
  localStorage.removeItem("authUser");
  return true;
};
