// src/pages/Login.jsx
import { useState } from "react";
import { useAuth } from "../auth/AuthContext.jsx";
import { useNavigate, useLocation, Link } from "react-router-dom";
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
      <h1 className="auth-heading">NEO Builder <span>|</span> Validorix</h1>
      <form className="auth-card" onSubmit={handleSubmit}>
        <h2>Login</h2>
        {error && <div className="alert">{error}</div>}
        <input type="email" placeholder="Email" value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <input type="password" placeholder="Password" value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        <button type="submit" disabled={loading}>Login</button>
        <p className="link">No account? <Link to="/signup">Sign up</Link></p>
      </form>
    </div>
  );
  }
