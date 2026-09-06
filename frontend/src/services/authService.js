import api from "./api";

/**
 * Authenticate user credentials against backend database
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
    localStorage.setItem("token", token);
    localStorage.setItem("authToken", token);
  }

  // Fetch detailed employee profile (name, department, avatar, jobPosition, etc.)
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
    // If not an employee profile or not created yet, proceed with basic user info
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
 * Authenticate via Google SSO Token
 */
export const googleAuth = async ({ credential, email, name }) => {
  const response = await api.post("/auth/google-auth", {
    credential,
    email,
    name,
  });

  const { token, user } = response.data.data;
  if (token) {
    localStorage.setItem("token", token);
    localStorage.setItem("authToken", token);
  }

  let profileName = name || user.email.split("@")[0];
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
};

/**
 * Fetch current authenticated user session from backend
 */
export const getCurrentUser = async () => {
  const token = localStorage.getItem("token") || localStorage.getItem("authToken");
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
    localStorage.removeItem("token");
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

  const response = await api.post("/auth/register", { email, password, name });
  const { token, user } = response.data?.data || {};
  if (token) {
    localStorage.setItem("token", token);
    localStorage.setItem("authToken", token);
  }

  const normalizedUser = {
    id: user?.id,
    employeeId: user?.id,
    email: user?.email || email,
    name: name || email.split("@")[0],
    role: (user?.role || "EMPLOYEE").toUpperCase(),
    department: "Engineering",
    jobPosition: "Software Engineer",
    token,
  };

  localStorage.setItem("authUser", JSON.stringify(normalizedUser));
  return normalizedUser;
};

/**
 * Logout user and clear tokens
 */
export const logoutUser = async () => {
  localStorage.removeItem("token");
  localStorage.removeItem("authToken");
  localStorage.removeItem("authUser");
  return true;
};
