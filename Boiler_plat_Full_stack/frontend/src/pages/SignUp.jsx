import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import GoogleSignInButton from "../components/GoogleSignInButton";

function SignUp() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  
  const [avatar, setAvatar] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatar(file);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const SubmitForm = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Use FormData to handle both text and files
      const data = new FormData();
      data.append("email", formData.email);
      data.append("password", formData.password);

      if (avatar) {
        data.append("avatar", avatar); // Key "avatar" must match upload.single("avatar")
      }

      // 2. Send as multipart/form-data
      const response = await axios.post("/users/register", data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("Registration successful:", response.data);
      navigate("/Signin");
    } catch (error) {
      console.log(
        "Error while signing up",
        error.response?.data || error.message,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={SubmitForm}>
      <div>Email :</div>
      <input
        value={formData.email}
        name="email"
        type="email"
        required
        onChange={handleChange}
      />

      <div>Password :</div>
      <input
        value={formData.password}
        name="password"
        type="password"
        required
        onChange={handleChange}
      />

      <div>Profile Picture:</div>
      <input type="file" accept="image/*" onChange={handleFileChange} />

      <button type="submit" disabled={loading}>
        {loading ? "Registering..." : "Sign Up"}
      </button>

      <GoogleSignInButton />
    </form>
  );
}

export default SignUp;
