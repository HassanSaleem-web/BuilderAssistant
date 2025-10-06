// src/auth/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("user")));
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("token", token || "");
  }, [user, token]);

  const login = async (email, password) => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    if (email === "demo@neo.com" && password === "password") {
      setUser({ email });
      setToken("mock-token");
    } else {
      throw new Error("Invalid credentials");
    }
    setLoading(false);
  };

  const signup = async (email, password) => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    setUser({ email });
    setToken("mock-token");
    setLoading(false);
  };

  const logout = () => {
    setUser(null);
    setToken("");
    localStorage.clear();
  };

  return (
    <AuthContext.Provider value={{ user, token, login, signup, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
