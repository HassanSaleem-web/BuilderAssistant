import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

// 🌐 Base URL for auth server
const AUTH_BASE = (import.meta.env.VITE_AUTH_API_URL || "http://localhost:4000").replace(/\/$/, "");
const API_URL = `${AUTH_BASE}/api/auth`;

// 🧩 Normalize user object — ensures consistent `_id` key
const normalizeUser = (u) => {
  if (!u) return null;
  const base = u.user ?? u; // handles envelopes like { user: {...} }
  return { ...base, _id: base._id ?? base.id };
};

// 💾 Helper: set user + cache to localStorage
const setUserAndCache = (setter) => (valOrFn) =>
  setter((prev) => {
    const next = typeof valOrFn === "function" ? valOrFn(prev) : valOrFn;
    try {
      if (next) localStorage.setItem("user", JSON.stringify(next));
      else localStorage.removeItem("user");
    } catch (err) {
      console.error("Failed to write user to localStorage:", err);
    }
    return next;
  });

const AuthProvider = ({ children }) => {
  const [userState, _setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const setUser = setUserAndCache(_setUser);

  // 🧠 Restore cached user immediately, then verify session with backend
  useEffect(() => {
    try {
      const cached = localStorage.getItem("user");
      if (cached) _setUser(JSON.parse(cached));
    } catch (err) {
      console.error("Error reading cached user:", err);
    }

    // Small delay ensures cookie propagation before /me call
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${API_URL}/me`, { credentials: "include" });
        if (!res.ok) throw new Error("No active session");
        const data = await res.json();
        const normalized = normalizeUser(data);
        setUser(normalized);
      } catch {
        // Do not clear local user if /me fails once
      }
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  // 🔐 Login user
  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed");

      // ✅ Normalize only the inner user object
      const normalized = normalizeUser(data.user);
      setUser(normalized);
      localStorage.setItem("user", JSON.stringify(normalized)); // ensure cache immediately
      return normalized;
    } catch (err) {
      console.error("Login error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 🧾 Register new user
  const signup = async (email, password) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email,
          password,
          username: email.split("@")[0],
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Signup failed");

      const normalized = normalizeUser(data.user);
      setUser(normalized);
      localStorage.setItem("user", JSON.stringify(normalized)); // immediate cache
      return normalized;
    } catch (err) {
      console.error("Signup error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 🚪 Logout user
  const logout = async () => {
    try {
      await fetch(`${API_URL}/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout error:", err);
    }
    setUser(null);
    localStorage.removeItem("user");
  };

  // 💳 Deduct credits server-side + sync local cache
  const deductCredits = async (amount = 1) => {
    const uid = userState?._id;
    if (!uid) return;

    try {
      const res = await fetch(`${API_URL}/deduct-credits`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId: uid, amount }),
      });

      const data = await res.json();
      if (res.ok && typeof data.creditsLeft === "number") {
        setUser((prev) =>
          prev ? { ...prev, creditsLeft: data.creditsLeft } : prev
        );
      } else {
        console.warn("Credit deduction failed:", data?.message || "unknown error");
      }
    } catch (err) {
      console.error("Failed to deduct credits:", err);
    }
  };

  // 🔄 Refresh user profile (used after Stripe checkout)
  const refreshUserProfile = async () => {
    try {
      const res = await fetch(`${API_URL}/me`, { credentials: "include" });
      if (!res.ok) throw new Error("Session expired");
      const data = await res.json();
      const normalized = normalizeUser(data);
      setUser(normalized);
    } catch (err) {
      console.error("Failed to refresh user profile:", err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user: userState,
        setUser,
        login,
        signup,
        logout,
        loading,
        deductCredits,
        refreshUserProfile,
        AUTH_BASE,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// 🔁 Hook export
const useAuth = () => useContext(AuthContext);
export { AuthProvider, useAuth };
