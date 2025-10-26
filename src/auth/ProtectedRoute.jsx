// src/auth/ProtectedRoute.jsx
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function ProtectedRoute({ children }) {
  const { token } = useAuth();
  const location = useLocation();

  const { user } = useAuth();
  const cachedUser = JSON.parse(localStorage.getItem("user"));
  if (!user && !cachedUser) return <Navigate to="/login" />;
  
  return children;
}
