// src/pages/SignUp.jsx
import { useState } from "react";
import { useAuth } from "../auth/AuthContext.jsx";
import { useNavigate, Link } from "react-router-dom";
import "../styles/auth.css";
export default function SignUp() {
  const { signup, loading } = useAuth();
  const [form, setForm] = useState({ email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) return setError("Passwords do not match");
    try {
      await signup(form.email, form.password);
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-page">
      <h1 className="auth-heading">NEO Builder <span>|</span> Validorix</h1>
      <form className="auth-card" onSubmit={handleSubmit}>
      
        <h2>Sign Up</h2>
        {error && <div className="alert">{error}</div>}
        <input type="email" placeholder="Email" value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <input type="password" placeholder="Password" value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        <input type="password" placeholder="Confirm Password" value={form.confirm}
          onChange={(e) => setForm({ ...form, confirm: e.target.value })} required />
        <button type="submit" disabled={loading}>Sign Up</button>
        <p className="link">Already have an account? <Link to="/login">Log in</Link></p>
      </form>
    </div>
  );
  }
