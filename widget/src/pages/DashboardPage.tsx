import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "../styles.css";

type Tool = {
  id: string;
  slug: string;
  name: string;
  summary: string;
  price_monthly?: number;
};

type WidgetConfig = {
  primary_color: string;
  secondary_color: string;
  theme: "frosted" | "smoked";
  logo_url?: string;
  mark_text?: string;
};

type WidgetLead = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  estimate_amount?: number;
};

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";
const DEMO_TENANT_ID = import.meta.env.VITE_DEMO_TENANT_ID || "";

const DashboardPage: React.FC = () => {
  const [tools, setTools] = useState<Tool[]>([]);
  const [widgetConfig, setWidgetConfig] = useState<WidgetConfig | null>(null);
  const [leads, setLeads] = useState<WidgetLead[]>([]);
  const [themeChoice, setThemeChoice] = useState<"frosted" | "smoked">("frosted");
  const [primary, setPrimary] = useState("#0A0F1A");
  const [secondary, setSecondary] = useState("#1F6BFF");

  useEffect(() => {
    const load = async () => {
      try {
        const resp = await fetch(`${API_BASE}/api/marketplace/tools`);
        const data = await resp.json();
        setTools(data);
      } catch {
        setTools([]);
      }
      try {
        const configResp = await fetch(`${API_BASE}/api/widget/config`, {
          headers: DEMO_TENANT_ID ? { "X-Tenant-ID": DEMO_TENANT_ID } : {},
        });
        const config = await configResp.json();
        setWidgetConfig(config);
        setThemeChoice(config.theme || "frosted");
        setPrimary(config.primary_color || "#0A0F1A");
        setSecondary(config.secondary_color || "#1F6BFF");
      } catch {
        setWidgetConfig(null);
      }
      // Leads endpoint not yet built; placeholder for future implementation
      setLeads([]);
    };
    load();
  }, []);

  const installed = useMemo(() => tools.slice(0, 2), [tools]);
  const available = useMemo(() => tools.slice(2), [tools]);

  return (
    <div className="page-shell dashboard">
      <header className="page-header">
        <div>
          <p className="nx-kicker">neX Command Center</p>
          <h1>Dashboard</h1>
          <p className="nx-subtle">Manage tools, vibes, and leads with the neXdigitals.agency brand.</p>
        </div>
      </header>

      <section className="panel">
        <div className="panel-head">
          <h3>My Tools</h3>
          <Link to="/marketplace" className="nx-ghost">
            Browse Marketplace
          </Link>
        </div>
        <div className="store-grid">
          {installed.map((tool) => (
            <Link key={tool.id} to={`/dashboard/tools/${tool.slug}`} className="store-card">
              <div className="store-meta">
                <p className="nx-kicker">Installed</p>
                <h3>{tool.name}</h3>
                <p className="nx-subtle">{tool.summary}</p>
              </div>
              <p className="price-tag">Active • ${tool.price_monthly ?? 99}/mo</p>
            </Link>
          ))}
          {available.map((tool) => (
            <Link key={tool.id} to={`/dashboard/tools/${tool.slug}`} className="store-card">
              <div className="store-meta">
                <p className="nx-kicker">Available</p>
                <h3>{tool.name}</h3>
                <p className="nx-subtle">{tool.summary}</p>
              </div>
              <p className="price-tag">${tool.price_monthly ?? 99}/mo</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="panel vibe">
        <div className="panel-head">
          <h3>Vibe Editor</h3>
          <p className="nx-subtle">Set your brand colors and theme for the Landmark widget.</p>
        </div>
        <div className="vibe-grid">
          <div>
            <label className="nx-field">
              <span>Primary Color</span>
              <input type="color" value={primary} onChange={(e) => setPrimary(e.target.value)} />
            </label>
            <label className="nx-field">
              <span>Secondary Color</span>
              <input type="color" value={secondary} onChange={(e) => setSecondary(e.target.value)} />
            </label>
            <div className="nx-toggle">
              <button className={themeChoice === "frosted" ? "active" : ""} onClick={() => setThemeChoice("frosted")} type="button">
                Frosted Glass
              </button>
              <button className={themeChoice === "smoked" ? "active" : ""} onClick={() => setThemeChoice("smoked")} type="button">
                Smoked Glass
              </button>
            </div>
            <p className="nx-subtle small">Saving not wired yet; placeholder until backend PATCH is added.</p>
          </div>
          <div className="vibe-preview" style={{ ["--accent" as string]: secondary, ["--secondary" as string]: primary }}>
            <p className="nx-kicker">{widgetConfig?.mark_text || "neX"}</p>
            <h4>Widget Preview</h4>
            <p className="nx-subtle">Theme: {themeChoice}</p>
            <div className="vibe-swatches">
              <span style={{ background: primary }} />
              <span style={{ background: secondary }} />
            </div>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h3>Leads</h3>
          <p className="nx-subtle">Widget leads per tenant (placeholder until API is wired).</p>
        </div>
        <div className="leads-table">
          <div className="leads-row head">
            <span>Name</span>
            <span>Email</span>
            <span>Phone</span>
            <span>Address</span>
            <span>Estimate</span>
          </div>
          {leads.length === 0 && <p className="nx-subtle">No leads yet. Capture via widget.</p>}
          {leads.map((lead) => (
            <div key={lead.id} className="leads-row">
              <span>{lead.full_name}</span>
              <span>{lead.email}</span>
              <span>{lead.phone}</span>
              <span>{lead.address}</span>
              <span>{lead.estimate_amount ? `$${lead.estimate_amount}` : "—"}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;
