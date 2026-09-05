import { useAuth } from "../context/AuthContext";

function UserProfile() {
  const { user } = useAuth();

  return (
    <div style={{ padding: "20px" }}>
      <h1>User Profile</h1>
      {user ? (
        <div>
          <p>
            <strong>ID:</strong> {user.id}
          </p>
          <p>
            <strong>Name:</strong> {user.name}
          </p>
          <p>
            <strong>Email:</strong> {user.email}
          </p>
          <p>
            <strong>Role:</strong> {user.role}
          </p>
        </div>
      ) : (
        <p>No user data found. Please log in.</p>
      )}
    </div>
  );
}

export default UserProfile;
