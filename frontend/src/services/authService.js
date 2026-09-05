/**
 * MOCK SERVICE — replace each function body with a real axios call to the backend when available.
 * Function signatures and return shapes are designed to stay the same.
 */

import { mockUsers } from "./mockUsers";

const SIMULATED_DELAY_MS = 500;

const delay = (ms = SIMULATED_DELAY_MS) =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Authenticate user credentials against mock database.
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<{ id: string, email: string, name: string, role: string }>}
 */
export const loginUser = async (email, password) => {
  await delay();
  
  const user = mockUsers.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
  );

  if (!user) {
    throw new Error("Invalid email or password");
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
};

/**
 * Register a new user with default EMPLOYEE role.
 * @param {FormData|Object} formData 
 * @returns {Promise<{ id: string, email: string, name: string, role: string }>}
 */
export const registerUser = async (formData) => {
  await delay();

  let email = "";
  let password = "";
  let name = "";
  let avatarFile = null;

  if (formData instanceof FormData) {
    email = formData.get("email") || "";
    password = formData.get("password") || "";
    name = formData.get("name") || "";
    avatarFile = formData.get("avatar");
  } else if (formData && typeof formData === "object") {
    email = formData.email || "";
    password = formData.password || "";
    name = formData.name || "";
  }

  if (avatarFile) {
    console.log("[mockAuthService] Received profile image:", avatarFile.name);
  }

  if (!email || !password) {
    throw new Error("Email and password are required");
  }

  const existingUser = mockUsers.find(
    (u) => u.email.toLowerCase() === email.toLowerCase()
  );

  if (existingUser) {
    throw new Error("User with this email already exists");
  }

  const newUser = {
    id: `usr_${Date.now()}`,
    email,
    password,
    name: name || email.split("@")[0],
    role: "EMPLOYEE", // New signups always default to EMPLOYEE role
  };

  mockUsers.push(newUser);

  return {
    id: newUser.id,
    email: newUser.email,
    name: newUser.name,
    role: newUser.role,
  };
};

/**
 * Simulate user logout.
 * @returns {Promise<boolean>}
 */
export const logoutUser = async () => {
  await delay();
  return true;
};
