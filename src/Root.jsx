// src/Root.jsx
import { Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "./auth/AuthContext.jsx";
import ProtectedRoute from "./auth/ProtectedRoute.jsx";
import Login from "./pages/Login.jsx";
import SignUp from "./pages/Signup.jsx";
import Dashboard from "./pages/Dashboard.jsx";

export default function Root() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isAuthPage = location.pathname === "/login" || location.pathname === "/signup";

  return (
    <>
      {!isAuthPage && (
        <header className="header-bar">
         
          <nav className="controls">
  {!user ? (
    <>
      <Link to="/login" className="btn-secondary">Login</Link>
      <Link to="/signup" className="btn-primary">Sign Up</Link>
    </>
  ) : null}
</nav>

        </header>
      )}

      <Routes>
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
        <Route path="/signup" element={!user ? <SignUp /> : <Navigate to="/" />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}
