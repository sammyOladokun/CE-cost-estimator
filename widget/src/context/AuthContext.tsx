import React, { createContext, useContext, useEffect, useState } from "react";

type User = {
  email: string;
  full_name?: string;
  tenant_id?: string;
  token?: string;
};

type AuthContextValue = {
  user: User | null;
  login: (payload: { email: string; password: string }) => Promise<void>;
  register: (payload: { email: string; password: string; full_name: string; tenant_name: string }) => Promise<void>;
  logout: () => void;
  showAuth: boolean;
  openAuth: () => void;
  closeAuth: () => void;
  setAuthMode: (mode: "login" | "register") => void;
  authMode: "login" | "register";
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

  useEffect(() => {
    const cached = localStorage.getItem("nex:user");
    if (cached) setUser(JSON.parse(cached));
  }, []);

  const login = async (payload: { email: string; password: string }) => {
    // Placeholder: swap with real /api/auth/login
    const resp = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!resp.ok) throw new Error("Login failed");
    const data = await resp.json();
    const nextUser = {
      email: data.email || payload.email,
      full_name: data.full_name,
      tenant_id: data.tenant_id,
      token: data.token,
    };
    setUser(nextUser);
    localStorage.setItem("nex:user", JSON.stringify(nextUser));
    setShowAuth(false);
  };

  const register = async (payload: { email: string; password: string; full_name: string; tenant_name: string }) => {
    // Placeholder: swap with real /api/auth/register
    const resp = await fetch(`${API_BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!resp.ok) throw new Error("Registration failed");
    const data = await resp.json();
    const nextUser = {
      email: data.email || payload.email,
      full_name: data.full_name || payload.full_name,
      tenant_id: data.tenant_id,
      token: data.token,
    };
    setUser(nextUser);
    localStorage.setItem("nex:user", JSON.stringify(nextUser));
    setShowAuth(false);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("nex:user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        showAuth,
        openAuth: () => setShowAuth(true),
        closeAuth: () => setShowAuth(false),
        setAuthMode,
        authMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
