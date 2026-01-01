import React, { useState } from "react";
import "../styles.css";
import { useAuth } from "../context/AuthContext";

type Props = {
  onAuthed?: () => void;
};

const AuthModal: React.FC<Props> = ({ onAuthed }) => {
  const { showAuth, closeAuth, authMode, setAuthMode, login, register, authError, setAuthError } = useAuth();
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
    setAuthError(null);
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
    window.open(`${import.meta.env.VITE_API_BASE || "http://localhost:8000"}/api/auth/google`, "_self");
  };

  const LoginCard = (
    <div className="gate-panel">
      <p className="nx-kicker">Login</p>
      <form className="gate-form" onSubmit={handleSubmit}>
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <div className="google-row">
          <button className="nx-cta secondary" type="button" onClick={handleGoogle}>
            Continue with Google
          </button>
        </div>
        {(error || authError) && <p className="error">{error || authError}</p>}
        <div className="cta-row" style={{ justifyContent: "flex-end" }}>
          <button className="nx-ghost" type="button" onClick={closeAuth}>
            Cancel
          </button>
          <button className="nx-cta" type="submit" disabled={loading}>
            {loading ? "Please wait..." : "Login"}
          </button>
        </div>
        <p className="nx-subtle small">
          Need an account?{" "}
          <button className="link-inline" type="button" onClick={() => setAuthMode("register")}>
            Register
          </button>
        </p>
      </form>
    </div>
  );

  const RegisterCard = (
    <div className="gate-panel">
      <p className="nx-kicker">Register</p>
      <form className="gate-form" onSubmit={handleSubmit}>
        <input placeholder="Tenant / Company" value={tenantName} onChange={(e) => setTenantName(e.target.value)} required />
        <input placeholder="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <div className="google-row">
          <button className="nx-cta secondary" type="button" onClick={handleGoogle}>
            Continue with Google
          </button>
        </div>
        {(error || authError) && <p className="error">{error || authError}</p>}
        <div className="cta-row" style={{ justifyContent: "flex-end" }}>
          <button className="nx-ghost" type="button" onClick={closeAuth}>
            Cancel
          </button>
          <button className="nx-cta" type="submit" disabled={loading}>
            {loading ? "Please wait..." : "Register"}
          </button>
        </div>
        <p className="nx-subtle small">
          Already have an account?{" "}
          <button className="link-inline" type="button" onClick={() => setAuthMode("login")}>
            Login
          </button>
        </p>
      </form>
    </div>
  );

  return <div className="gate-overlay">{authMode === "login" ? LoginCard : RegisterCard}</div>;
};

export default AuthModal;
