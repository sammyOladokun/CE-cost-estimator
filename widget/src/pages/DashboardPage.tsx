import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "../styles.css";
import { useAuth } from "../context/AuthContext";
import { Gauge, SquaresFour, SlidersHorizontal, CreditCard, Pulse, Lifebuoy } from "@phosphor-icons/react";
import DashboardNav from "../components/DashboardNav";

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
  const [activeTab, setActiveTab] = useState<string>("overview");
  const { user, openAuth } = useAuth();
  const [showProfile, setShowProfile] = useState(false);

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

  if (!user) {
    return (
      <div className="page-shell dashboard">
        <section className="panel">
          <p className="nx-subtle">Please log in to manage your tools.</p>
          <button className="nx-cta" onClick={openAuth} type="button">
            Login / Register
          </button>
        </section>
      </div>
    );
  }

  const nav = [
    { id: "overview", label: "Overview", Icon: Gauge },
    { id: "my-tools", label: "My Tools", Icon: SquaresFour },
    { id: "tool-settings", label: "Tool Settings", Icon: SlidersHorizontal },
    { id: "billing", label: "Billing", Icon: CreditCard },
    { id: "activity", label: "Activity", Icon: Pulse },
    { id: "support", label: "Support", Icon: Lifebuoy },
  ];

  const invoiceSamples = [
    { id: "INV-1042", amount: 199, status: "Paid", date: "2025-12-10" },
    { id: "INV-1043", amount: 349, status: "Pending", date: "2025-12-22" },
    { id: "INV-1044", amount: 99, status: "Paid", date: "2025-12-28" },
  ];

  const activityFeed = [
    { title: "New lead captured", detail: "Widget form submitted", time: "2h ago" },
    { title: "Tool updated", detail: "Roof estimator theme tuned", time: "6h ago" },
    { title: "Invoice paid", detail: "INV-1042 settled", time: "1d ago" },
    { title: "Support reply", detail: "We answered a tenant ticket", time: "2d ago" },
  ];

  return (
    <div className="syn-shell" onClick={() => setShowProfile(false)}>
      <DashboardNav user={user} showProfile={showProfile} onToggleProfile={() => setShowProfile((p) => !p)} />

      <div className="page-shell dashboard command-surface">
        <div className="dashboard-main-card">
          <aside className="command-sidebar neon-rail">
          <div className="sidebar-brand">
            <p className="nx-kicker">Tenant</p>
            <h3>Ops Board</h3>
            <p className="nx-subtle">Control center</p>
          </div>
          <div className="sidebar-links">
            {nav.map((link) => (
              <button
                key={link.id}
                className={`sidebar-link neon-link ${activeTab === link.id ? "active" : ""}`}
                onClick={() => setActiveTab(link.id)}
              >
                <span className="sidebar-icon">
                  <link.Icon size={16} weight="duotone" />
                </span>
                <span className="sidebar-label">{link.label}</span>
              </button>
            ))}
          </div>
          <div className="sidebar-glow" />
        </aside>

        <div className="dashboard-body-scroll">
          <main className="command-main">
          {activeTab === "overview" && (
            <header className="command-hero holo-hero">
              <div>
                <p className="nx-kicker">neX Command Center</p>
                <h1>Tenant Dashboard</h1>
                <p className="nx-subtle">Manage your tools, billing, activity, and support in one neon cockpit.</p>
                <div className="hero-badges">
                  <span className="glass-chip">Live sync</span>
                  <span className="glass-chip">Frosted UI</span>
                  <span className="glass-chip">Secure tokens</span>
                </div>
              </div>
              <div className="hero-stats">
                <div className="mini-card pulse">
                  <p className="nx-kicker">Active Tools</p>
                  <h2>{installed.length}</h2>
                  <p className="nx-subtle">Installed</p>
                </div>
                <div className="mini-card pulse">
                  <p className="nx-kicker">Available</p>
                  <h2>{available.length}</h2>
                  <p className="nx-subtle">Marketplace</p>
                </div>
                <div className="mini-card pulse">
                  <p className="nx-kicker">Theme</p>
                  <h2>{themeChoice}</h2>
                  <p className="nx-subtle">Branding</p>
                </div>
              </div>
            </header>
          )}

          <div className="floating-grid">
            {activeTab === "overview" && (
              <section className="floating-card neon-card panel-wide">
                <div className="panel-head">
                  <h3>Overview</h3>
                  <span className="nx-subtle">Quick health for your tenant</span>
                </div>
                <div className="analytics-grid">
                  <div className="mini-card aurora">
                    <p className="nx-kicker">Installed</p>
                    <h2>{installed.length}</h2>
                    <p className="nx-subtle">Active tools</p>
                  </div>
                  <div className="mini-card aurora">
                    <p className="nx-kicker">Leads</p>
                    <h2>{leads.length}</h2>
                    <p className="nx-subtle">Captured</p>
                  </div>
                  <div className="mini-card aurora">
                    <p className="nx-kicker">Theme</p>
                    <h2>{themeChoice}</h2>
                    <p className="nx-subtle">Brand vibe</p>
                  </div>
                </div>
                <div className="floating-grid">
                  <div className="chart-card neon-frame">
                    <div className="chart-head">
                      <p className="nx-kicker">Tool mix</p>
                    </div>
                    <div className="nx-subtle">Add usage analytics here as data becomes available.</div>
                  </div>
                  <div className="chart-card neon-frame">
                    <div className="chart-head">
                      <p className="nx-kicker">Lead flow</p>
                    </div>
                    <div className="nx-subtle">Hook your lead series to visualize conversions.</div>
                  </div>
                </div>
              </section>
            )}

            {activeTab === "my-tools" && (
              <section className="floating-card neon-card panel-wide">
                <div className="panel-head">
                  <h3>My Tools</h3>
                  <Link to="/marketplace" className="nx-ghost">
                    Browse Marketplace
                  </Link>
                </div>
                <div className="store-grid">
                  {installed.map((tool) => (
                    <Link key={tool.id} to={`/tenant/tools/${tool.slug}`} className="store-card floating">
                      <div className="store-meta">
                        <p className="nx-kicker">Installed</p>
                        <h3>{tool.name}</h3>
                        <p className="nx-subtle">{tool.summary}</p>
                      </div>
                      <p className="price-tag">Active � ${tool.price_monthly ?? 99}/mo</p>
                    </Link>
                  ))}
                  {available.map((tool) => (
                    <Link key={tool.id} to={`/tenant/tools/${tool.slug}`} className="store-card floating">
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
            )}

            {activeTab === "tool-settings" && (
              <section className="floating-card neon-card panel-wide">
                <div className="panel-head">
                  <h3>Tool Settings</h3>
                  <span className="nx-subtle">Brand your widget and data feed</span>
                </div>
                <div className="vibe-grid">
                  <label className="nx-field">
                    <span>Theme</span>
                    <select value={themeChoice} onChange={(e) => setThemeChoice(e.target.value as "frosted" | "smoked")}>
                      <option value="frosted">Frosted</option>
                      <option value="smoked">Smoked</option>
                    </select>
                  </label>
                  <label className="nx-field">
                    <span>Primary Color</span>
                    <input type="color" value={primary} onChange={(e) => setPrimary(e.target.value)} />
                  </label>
                  <label className="nx-field">
                    <span>Secondary Color</span>
                    <input type="color" value={secondary} onChange={(e) => setSecondary(e.target.value)} />
                  </label>
                  <label className="nx-field">
                    <span>Mark Text</span>
                    <input
                      value={widgetConfig?.mark_text || ""}
                      onChange={(e) => setWidgetConfig((prev) => (prev ? { ...prev, mark_text: e.target.value } : prev))}
                    />
                  </label>
                  <label className="nx-field">
                    <span>Logo URL</span>
                    <input
                      value={widgetConfig?.logo_url || ""}
                      onChange={(e) => setWidgetConfig((prev) => (prev ? { ...prev, logo_url: e.target.value } : prev))}
                    />
                  </label>
                </div>
                <div className="glass-table" style={{ marginTop: 16 }}>
                  <div className="leads-row head">
                    <span>Setting</span>
                    <span>Value</span>
                  </div>
                  <div className="leads-row">
                    <span>Theme</span>
                    <span>{themeChoice}</span>
                  </div>
                  <div className="leads-row">
                    <span>Primary</span>
                    <span>{primary}</span>
                  </div>
                  <div className="leads-row">
                    <span>Secondary</span>
                    <span>{secondary}</span>
                  </div>
                  <div className="leads-row">
                    <span>Mark</span>
                    <span>{widgetConfig?.mark_text || "�"}</span>
                  </div>
                </div>
              </section>
            )}

            {activeTab === "billing" && (
              <section className="floating-card neon-card panel-wide">
                <div className="panel-head">
                  <h3>Billing</h3>
                  <span className="nx-subtle">Subscriptions and invoices</span>
                </div>
                <div className="leads-table glass-table">
                  <div className="leads-row head">
                    <span>Invoice</span>
                    <span>Amount</span>
                    <span>Status</span>
                    <span>Date</span>
                  </div>
                  {invoiceSamples.map((inv) => (
                    <div key={inv.id} className="leads-row">
                      <span>{inv.id}</span>
                      <span>${inv.amount}</span>
                      <span>{inv.status}</span>
                      <span>{inv.date}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {activeTab === "activity" && (
              <section className="floating-card neon-card panel-wide">
                <div className="panel-head">
                  <h3>Activity</h3>
                  <span className="nx-subtle">Recent events</span>
                </div>
                <div className="glass-table">
                  <div className="leads-row head">
                    <span>Event</span>
                    <span>Detail</span>
                    <span>Time</span>
                  </div>
                  {activityFeed.map((item, idx) => (
                    <div key={idx} className="leads-row">
                      <span>{item.title}</span>
                      <span>{item.detail}</span>
                      <span>{item.time}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {activeTab === "support" && (
              <section className="floating-card neon-card panel-wide">
                <div className="panel-head">
                  <h3>Support</h3>
                  <span className="nx-subtle">Get help fast</span>
                </div>
                <div className="vibe-grid">
                  <div className="nx-field">
                    <span className="nx-kicker">Open a ticket</span>
                    <p className="nx-subtle">Email support@nexdigital.io or chat in-app.</p>
                  </div>
                  <div className="nx-field">
                    <span className="nx-kicker">Status</span>
                    <p className="nx-subtle">All systems nominal.</p>
                  </div>
                </div>
              </section>
            )}
          </div>
        </main>
      </div>
    </div>
  </div>
</div>
  );
};

export default DashboardPage;
