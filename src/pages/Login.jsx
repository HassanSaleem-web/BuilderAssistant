// src/pages/Login.jsx
import { useState } from "react";
import { useAuth } from "../auth/AuthContext.jsx";
import { useNavigate, useLocation, Link } from "react-router-dom";
import bgVideo from "../assets/bgvideo.mp4"; // ⬅️ local asset
import "../styles/auth.css";

export default function Login() {
  const { login, loading } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(form.email, form.password);
      navigate(location.state?.from || "/");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-page">
      {/* Background video */}
      <video
        className="auth-bg-video"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
      >
        <source src={bgVideo} type="video/mp4" />
      </video>

      <h1 className="auth-heading">
        DigiStav <span>|</span> Validorix
      </h1>

      <form className="auth-card" onSubmit={handleSubmit}>
        <h2>Login</h2>
        {error && <div className="alert">{error}</div>}

        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>

        <p className="link">
          No account? <Link to="/signup">Sign up</Link>
        </p>
      </form>
    </div>
  );
}
