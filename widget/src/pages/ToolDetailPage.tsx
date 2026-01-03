import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowRight,
  Brain,
  Calculator,
  ChartLine,
  CheckCircle,
  Code,
  CurrencyCircleDollar,
  DeviceMobile,
  GitBranch,
  HandPointing,
  HouseLine,
  Lightning,
  MagnifyingGlass,
  Planet,
  ShieldCheck,
  SlidersHorizontal,
  SquaresFour,
  Waves,
} from "@phosphor-icons/react";
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

  const ensureWidget = async () => {
    if (typeof window !== "undefined" && !window.nexWidget) {
      await import("../index");
    }
  };

  const features: Feature[] = useMemo(
    () =>
      tool?.bento_features?.length
        ? tool.bento_features
        : [
            { title: "AI Roof Detection", copy: "Auto-calculate surface area from satellite imagery with high accuracy." },
            { title: "Material Customization", copy: "Price asphalt, metal, or tile instantly with live updates." },
            { title: "CRM Integration", copy: "Push captured leads to HubSpot, Salesforce, or Jobber automatically." },
            { title: "Responsive Widget", copy: "Works perfectly on mobile, tablet, and desktop." },
            { title: "Analytics Dashboard", copy: "Track estimates, conversion, and popular materials." },
            { title: "Custom Branding", copy: "Match the calculator to your site for a white-label experience." },
          ],
    [tool?.bento_features],
  );

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

  const launchSandbox = async () => {
    if (!tool) return;
    if (!user) {
      openAuth();
      return;
    }
    await ensureWidget();
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

  const handleEmbed = async () => {
    if (!user) {
      openAuth();
      return;
    }
    navigate(`/tenant/tools/${slug}`);
  };

  if (loading) return <p className="page-shell">Loading…</p>;
  if (error || !tool) return <p className="page-shell">Error: {error || "Not found"}</p>;

  return (
    <div className="tool-page">
      <div className="bg-glow glow-left" />
      <div className="bg-glow glow-right" />

      <section className="hero-wrap">
        <div className="hero">
          <div className="hero-content">
            <div className="pill">
              <ShieldCheck size={16} weight="duotone" />
              <span>Top Rated Tool</span>
            </div>
            <h1>
              Capture Leads 24/7 with the <span className="accent-text">Smart Estimator</span>
            </h1>
            <p className="hero-sub">
              {tool.summary ||
                "Embed the industry's most accurate estimator on your site. Turn traffic into qualified appointments instantly with AI-powered estimates and seamless CRM integration."}
            </p>
            <div className="hero-actions">
              <button className="btn purple" onClick={launchSandbox}>
                <span>Request Demo</span>
                <ArrowRight size={18} weight="duotone" />
              </button>
              <button className="btn glass" onClick={handleEmbed}>
                <Code size={18} weight="duotone" />
                <span>Get Embed Code</span>
              </button>
            </div>
            <div className="hero-meta">
              <div className="avatar-row">
                <div className="avatar a1" />
                <div className="avatar a2" />
                <div className="avatar a3" />
              </div>
              <p>Used by 500+ Contractors</p>
            </div>
          </div>

          <div className="hero-card">
            <div className="mock-header">
              <div className="mock-title">
                <Calculator size={22} weight="duotone" />
                <div>
                  <p className="mock-name">{tool.name || "Roofing Estimator"}</p>
                  <p className="mock-sub">Powered by Smart AI</p>
                </div>
              </div>
              <div className="mock-lights">
                <span className="light red" />
                <span className="light yellow" />
                <span className="light green" />
              </div>
            </div>
            <div className="mock-body">
              <div>
                <p className="label">Property Address</p>
                <div className="chip">
                  <Planet size={16} weight="duotone" />
                  <span>124 Maple Ave, Springfield</span>
                </div>
              </div>
              <div className="mock-map">
                <div className="chip map-chip">
                  <CheckCircle size={14} weight="duotone" />
                  <span>Roof Detected: 2,400 sq ft</span>
                </div>
              </div>
              <div>
                <p className="label">Select Material</p>
                <div className="material-grid">
                  <button className="material active">
                    <SquaresFour size={18} weight="duotone" />
                    <span>Shingle</span>
                  </button>
                  <button className="material">
                    <Waves size={18} weight="duotone" />
                    <span>Metal</span>
                  </button>
                  <button className="material">
                    <SlidersHorizontal size={18} weight="duotone" />
                    <span>Tile</span>
                  </button>
                </div>
              </div>
              <div className="mock-footer">
                <div>
                  <p className="label">Estimated Range</p>
                  <p className="mock-range">$12,500 - $14,200</p>
                </div>
                <button className="btn white">Send Quote</button>
              </div>
            </div>
            <div className="floating-card">
              <HandPointing size={18} weight="duotone" className="float-icon" />
              <div>
                <p className="float-sub">New Lead Captured</p>
                <p className="float-title">Just now</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="stats">
        <div className="stat glass">
          <div className="stat-head">
            <p>Lead Capture Increase</p>
            <TrendUp size={18} weight="duotone" className="text-green" />
          </div>
          <p className="stat-value">30%</p>
          <p className="stat-tag positive">+15% vs industry avg</p>
        </div>
        <div className="stat glass">
          <div className="stat-head">
            <p>Quote Generation Speed</p>
            <Lightning size={18} weight="duotone" className="text-cyan" />
          </div>
          <p className="stat-value">Instant</p>
          <p className="stat-sub">Real-time calculation</p>
        </div>
        <div className="stat glass">
          <div className="stat-head">
            <p>Contractor Trust</p>
            <ShieldCheck size={18} weight="duotone" className="text-purple" />
          </div>
          <p className="stat-value">500+</p>
          <p className="stat-tag primary">Active Installations</p>
        </div>
      </section>

      <section className="feature-section">
        <div className="feature-head">
          <p className="nx-kicker">Powerful Features</p>
          <h3>Why choose Smart Estimator?</h3>
          <p className="nx-subtle">
            Our tool combines precision technology with seamless UX to boost your roofing business without manual legwork.
          </p>
        </div>
        <div className="feature-grid">
          {features.map((feat, idx) => {
            const icons = [Planet, SquaresFour, GitBranch, DeviceMobile, ChartLine, SlidersHorizontal];
            const Icon = icons[idx % icons.length];
            return (
              <div key={idx} className="feature glass">
                <div className="feature-icon">
                  <Icon size={22} weight="duotone" />
                </div>
                <h4>{feat.title}</h4>
                <p>{feat.copy}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="workflow-section">
        <div className="workflow-head">
          <h3>Seamless Workflow</h3>
          <p>From visitor to closed deal, automated at every step.</p>
        </div>
        <div className="workflow-steps">
          {[
            { title: "Visitor Input", copy: "Enters address & info", icon: HandPointing },
            { title: "Smart Calculation", copy: "AI measures & prices", icon: Brain },
            { title: "CRM Sync", copy: "Data sent to your tools", icon: GitBranch },
            { title: "Lead Closed", copy: "Sales team follows up", icon: CurrencyCircleDollar },
          ].map((step, idx) => {
            const Icon = step.icon;
            return (
              <div key={idx} className="workflow-card">
                <div className="workflow-icon">
                  <Icon size={24} weight="duotone" />
                </div>
                <h5>{step.title}</h5>
                <p>{step.copy}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-body">
          <h3>Ready to transform your roofing website?</h3>
          <p>Join hundreds of top-tier contractors using the Smart Estimator to generate leads while they sleep.</p>
          <div className="hero-actions">
            <button className="btn white" onClick={() => setShowOnboard(true)}>
              Start Free Trial
            </button>
            <button className="btn glass" onClick={handleEmbed}>
              Contact Sales
            </button>
          </div>
        </div>
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
                  {saving ? "Working..." : "Continue to payment"}
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
