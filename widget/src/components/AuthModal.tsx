import React, { useState } from "react";
import "../styles.css";
import { useAuth } from "../context/AuthContext";

type Props = {
  onAuthed?: () => void;
};

const AuthModal: React.FC<Props> = ({ onAuthed }) => {
  const { showAuth, closeAuth, authMode, setAuthMode, login, register } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [tenantName, setTenantName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!showAuth) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (authMode === "login") {
        await login({ email, password });
      } else {
        await register({ email, password, full_name: fullName, tenant_name: tenantName });
      }
      onAuthed?.();
    } catch (err: any) {
      setError(err.message || "Unable to authenticate");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    // Placeholder: trigger your OAuth flow
    window.open(`${import.meta.env.VITE_API_BASE || "http://localhost:8000"}/api/auth/google`, "_self");
  };

  return (
    <div className="gate-overlay">
      <div className="gate-panel">
        <p className="nx-kicker">Account</p>
        <div className="nx-toggle" style={{ marginBottom: 8 }}>
          <button className={authMode === "login" ? "active" : ""} onClick={() => setAuthMode("login")} type="button">
            Login
          </button>
          <button className={authMode === "register" ? "active" : ""} onClick={() => setAuthMode("register")} type="button">
            Register
          </button>
        </div>
        <button className="nx-cta" type="button" onClick={handleGoogle} style={{ marginBottom: 10 }}>
          Continue with Google
        </button>
        <form className="gate-form" onSubmit={handleSubmit}>
          {authMode === "register" && (
            <>
              <input placeholder="Tenant / Company" value={tenantName} onChange={(e) => setTenantName(e.target.value)} required />
              <input placeholder="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </>
          )}
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          {error && <p className="error">{error}</p>}
          <div className="cta-row" style={{ justifyContent: "flex-end" }}>
            <button className="nx-ghost" type="button" onClick={closeAuth}>
              Cancel
            </button>
            <button className="nx-cta" type="submit" disabled={loading}>
              {loading ? "Please wait…" : authMode === "login" ? "Login" : "Register"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuthModal;
