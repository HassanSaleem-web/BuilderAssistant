// src/auth/ProtectedRoute.jsx
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function ProtectedRoute({ children }) {
  const { token } = useAuth();
  const location = useLocation();

  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
}
