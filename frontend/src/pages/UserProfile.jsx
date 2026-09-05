import { useEffect, useState } from "react";
import axios from "axios";

function UserProfile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchUserData() {
      try {
        const response = await axios.get("/users/profile", {
          withCredentials: true, // ⚠️ CRUCIAL: sends the accessToken cookie to the backend
        });

        console.log("User data:", response.data);
        setUser(response.data);
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError(err.response?.data?.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
  }, []);

  if (loading) return <p>Loading profile...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>User Profile</h1>
      {user ? (
        <div>
          <img
            src={user.avatar}
            alt="User Profile"
            style={{
              width: "190px",
              height: "190px",
              objectFit: "cover",
              border: "2px solid #ccc",
              marginTop: "8px",
            }}
          />
          <p>
            <strong>ID:</strong> {user._id}
          </p>
          <p>
            <strong>Email:</strong> {user.email}
          </p>
          <p>
            <strong>Auth Provider:</strong> {user.authProvider}
          </p>
        </div>
      ) : (
        <p>No user data found.</p>
      )}
    </div>
  );
}

export default UserProfile;
