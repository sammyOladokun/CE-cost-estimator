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
            <Link key={tool.id} to={`/tenant/tools/${tool.slug}`} className="store-card">
              <div className="store-meta">
                <p className="nx-kicker">Installed</p>
                <h3>{tool.name}</h3>
                <p className="nx-subtle">{tool.summary}</p>
              </div>
              <p className="price-tag">Active • ${tool.price_monthly ?? 99}/mo</p>
            </Link>
          ))}
          {available.map((tool) => (
            <Link key={tool.id} to={`/tenant/tools/${tool.slug}`} className="store-card">
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

    </div>
  );
};

export default DashboardPage;
