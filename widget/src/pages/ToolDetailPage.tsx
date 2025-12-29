import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../styles.css";
import { useAuth } from "../context/AuthContext";

type Feature = { title?: string; copy?: string; icon?: string };

type Tool = {
  id: string;
  slug: string;
  name: string;
  summary: string;
  media_url?: string;
  price_monthly?: number;
  bento_features?: Feature[];
};

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";
const DEMO_TENANT_ID = import.meta.env.VITE_DEMO_TENANT_ID || "";

declare global {
  interface Window {
    nexWidget?: (config: { tenantId: string; apiBase?: string; toolSlug?: string; sandbox?: boolean }) => void;
  }
}

const ToolDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, openAuth } = useAuth();
  const [tool, setTool] = useState<Tool | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showOnboard, setShowOnboard] = useState(false);
  const [existing, setExisting] = useState(false);
  const [tenantName, setTenantName] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tenantId, setTenantId] = useState(DEMO_TENANT_ID);
  const [saving, setSaving] = useState(false);
  const [onboardError, setOnboardError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const resp = await fetch(`${API_BASE}/api/marketplace/tools/${slug}`);
        if (!resp.ok) {
          throw new Error("Tool not found");
        }
        const data = await resp.json();
        setTool(data);
      } catch (err: any) {
        setError(err.message || "Unable to load tool");
      } finally {
        setLoading(false);
      }
    };
    if (slug) load();
  }, [slug]);

  const launchSandbox = () => {
    if (!tool) return;
    if (!user) {
      openAuth();
      return;
    }
    const tenantPrompt = user.tenant_id || DEMO_TENANT_ID || prompt("Enter tenant id for sandbox widget:") || "";
    window.nexWidget?.({
      tenantId: tenantPrompt,
      apiBase: API_BASE,
      toolSlug: tool.slug,
      sandbox: true,
    }) ?? alert("Widget bundle not loaded");
  };

  const startOnboarding = async () => {
    if (!tool) return;
    if (!user && !existing) {
      openAuth();
      return;
    }
    setSaving(true);
    setOnboardError(null);
    try {
      const payload: Record<string, any> = {
        tool: tool.slug,
        email: user?.email || email,
      };
      if (user && user.tenant_id) {
        payload.existing_tenant_id = user.tenant_id;
      } else if (existing) {
        payload.existing_tenant_id = tenantId;
      } else {
        payload.tenant_name = tenantName;
        payload.full_name = fullName || user?.full_name;
        payload.password = password;
      }
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (user?.token) headers["Authorization"] = `Token ${user.token}`;
      const resp = await fetch(`${API_BASE}/api/onboarding/start`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.detail || "Unable to start onboarding");
      }
      const data = await resp.json();
      const pay = data.payment_url as string;
      if (pay) {
        window.location.href = pay;
      } else {
        alert("Onboarding started. License created.");
      }
    } catch (err: any) {
      setOnboardError(err.message || "Unable to start onboarding");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="page-shell">Loading…</p>;
  if (error || !tool) return <p className="page-shell">Error: {error || "Not found"}</p>;

  return (
    <div className="page-shell">
      <button className="backlink" onClick={() => navigate(-1)}>
        ← Back to marketplace
      </button>
      <header className="tool-hero">
        <div>
          <p className="nx-kicker">Tool</p>
          <h1>{tool.name}</h1>
          <p className="nx-subtle">{tool.summary}</p>
          <div className="cta-row">
            <button className="nx-cta" onClick={launchSandbox}>
              Try it (sandbox)
            </button>
            <button className="nx-ghost" onClick={() => setShowOnboard(true)}>
              Get Started — ${tool.price_monthly ?? 99}/mo
            </button>
          </div>
        </div>
        <div className="hero-media">
          {tool.media_url ? (
            <video autoPlay loop muted playsInline src={tool.media_url} />
          ) : (
            <div className="store-icon">🛰</div>
          )}
        </div>
      </header>

      <section className="bento-grid">
        {(tool.bento_features || []).map((feat, idx) => (
          <div key={idx} className="bento-card">
            <p className="nx-kicker">{feat.icon || "◆"}</p>
            <h4>{feat.title}</h4>
            <p className="nx-subtle">{feat.copy}</p>
          </div>
        ))}
      </section>

      {showOnboard && (
        <div className="gate-overlay">
          <div className="gate-panel">
            <p className="nx-kicker">Get Started</p>
            <h3>{existing ? "Existing member" : "Create your profile"}</h3>
            <div className="nx-toggle" style={{ marginBottom: 8 }}>
              <button className={!existing ? "active" : ""} type="button" onClick={() => setExisting(false)}>
                I'm new
              </button>
              <button className={existing ? "active" : ""} type="button" onClick={() => setExisting(true)}>
                I'm a member
              </button>
            </div>
            <div className="gate-form">
              {!existing && (
                <>
                  <input placeholder="Company / Tenant Name" value={tenantName} onChange={(e) => setTenantName(e.target.value)} />
                  <input placeholder="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                  <input type="password" placeholder="Set Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </>
              )}
              {existing && (
                <input
                  placeholder="Tenant ID"
                  value={tenantId}
                  onChange={(e) => setTenantId(e.target.value)}
                  title="Provide your tenant id"
                />
              )}
              <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <div className="cta-row" style={{ justifyContent: "flex-end" }}>
                <button className="nx-ghost" type="button" onClick={() => setShowOnboard(false)}>
                  Cancel
                </button>
                <button className="nx-cta" type="button" onClick={startOnboarding} disabled={saving}>
                  {saving ? "Working…" : "Continue to payment"}
                </button>
              </div>
              {onboardError && <p className="error">{onboardError}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ToolDetailPage;
