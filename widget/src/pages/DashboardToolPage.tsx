import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import "../styles.css";

type Tool = {
  id: string;
  slug: string;
  name: string;
  summary: string;
  price_monthly?: number;
};

type WidgetLead = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  estimate_amount?: number;
};

type WidgetConfig = {
  primary_color: string;
  secondary_color: string;
  theme: "frosted" | "smoked";
  logo_url?: string;
  mark_text?: string;
};

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";
const TENANT_ID = import.meta.env.VITE_DEMO_TENANT_ID || "";

const DashboardToolPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [tool, setTool] = useState<Tool | null>(null);
  const [leads, setLeads] = useState<WidgetLead[]>([]);
  const [config, setConfig] = useState<WidgetConfig | null>(null);
  const [primary, setPrimary] = useState("#0A0F1A");
  const [secondary, setSecondary] = useState("#1F6BFF");
  const [theme, setTheme] = useState<"frosted" | "smoked">("frosted");
  const [mark, setMark] = useState("neX");
  const [saving, setSaving] = useState(false);
  const [hook, setHook] = useState("See Your Roof from Space & Get a Technical Estimate in 60 Seconds.");
  const [materialRate, setMaterialRate] = useState("2.25");
  const [laborRate, setLaborRate] = useState("1.50");

  useEffect(() => {
    const headers = TENANT_ID ? { "X-Tenant-ID": TENANT_ID } : {};
    const loadTool = async () => {
      const resp = await fetch(`${API_BASE}/api/marketplace/tools/${slug}`);
      if (resp.ok) {
        const data = await resp.json();
        setTool(data);
      }
    };
    const loadLeads = async () => {
      if (!slug) return;
      const resp = await fetch(`${API_BASE}/api/leads/widget?tool=${slug}`, { headers });
      if (resp.ok) {
        const data = await resp.json();
        setLeads(data);
      }
    };
    const loadConfig = async () => {
      const resp = await fetch(`${API_BASE}/api/widget/config`, { headers });
      if (resp.ok) {
        const data = await resp.json();
        setConfig(data);
        setPrimary(data.primary_color || primary);
        setSecondary(data.secondary_color || secondary);
        setTheme((data.theme as "frosted" | "smoked") || theme);
        setMark(data.mark_text || "neX");
      }
    };
    loadTool();
    loadLeads();
    loadConfig();
  }, [slug]);

  const saveVibe = async () => {
    setSaving(true);
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (TENANT_ID) headers["X-Tenant-ID"] = TENANT_ID;
    await fetch(`${API_BASE}/api/widget/config`, {
      method: "PUT",
      headers,
      body: JSON.stringify({
        primary_color: primary,
        secondary_color: secondary,
        theme,
        mark_text: mark,
      }),
    });
    setSaving(false);
  };

  const installedPrice = useMemo(() => (tool?.price_monthly ?? 99).toLocaleString(), [tool]);

  return (
    <div className="page-shell">
      <Link to="/tenant" className="backlink">
        ← Back to dashboard
      </Link>
      <header className="page-header">
        <p className="nx-kicker">Tool</p>
        <h1>{tool?.name || slug}</h1>
        <p className="nx-subtle">{tool?.summary}</p>
        <p className="price-tag">Plan: ${installedPrice}/mo</p>
      </header>

      <section className="panel">
        <div className="panel-head">
          <h3>Leads for {tool?.name || slug}</h3>
          <span className="nx-subtle">{leads.length} lead(s)</span>
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

      <section className="panel vibe">
        <div className="panel-head">
          <h3>Vibe Editor</h3>
          <p className="nx-subtle">Brand the widget for this tenant.</p>
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
              <button className={theme === "frosted" ? "active" : ""} onClick={() => setTheme("frosted")} type="button">
                Frosted
              </button>
              <button className={theme === "smoked" ? "active" : ""} onClick={() => setTheme("smoked")} type="button">
                Smoked
              </button>
            </div>
            <label className="nx-field">
              <span>Watermark Text</span>
              <input value={mark} onChange={(e) => setMark(e.target.value)} />
            </label>
            <button className="nx-cta" type="button" onClick={saveVibe} disabled={saving}>
              {saving ? "Saving..." : "Save Vibe"}
            </button>
          </div>
          <div className="vibe-preview" style={{ ["--accent" as string]: secondary, ["--secondary" as string]: primary }}>
            <p className="nx-kicker">{config?.mark_text || "neX"}</p>
            <h4>Preview</h4>
            <p className="nx-subtle">Theme: {theme}</p>
            <div className="vibe-swatches">
              <span style={{ background: primary }} />
              <span style={{ background: secondary }} />
            </div>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h3>Marketing Hook & Branding</h3>
          <p className="nx-subtle">Customize the hero copy and logo.</p>
        </div>
        <div className="vibe-grid">
          <div>
            <label className="nx-field">
              <span>Marketing Hook</span>
              <input value={hook} onChange={(e) => setHook(e.target.value)} />
            </label>
            <label className="nx-field">
              <span>Logo Upload</span>
              <input type="file" />
            </label>
          </div>
          <div className="vibe-preview">
            <p className="nx-kicker">Preview Text</p>
            <h4>{hook}</h4>
            <p className="nx-subtle">Update widget/landing copy to match brand voice.</p>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h3>Embed Code</h3>
          <p className="nx-subtle">Copy/paste into your site.</p>
        </div>
        <pre className="code-block">
{`<script src="https://cdn.yourdomain.com/nex-widget.iife.js"></script>
<div id="nex-slot"></div>
<script>
  window.nexWidget({
    tenantId: "${TENANT_ID || "<tenant-id>"}",
    apiBase: "${API_BASE}",
    toolSlug: "${slug}",
    sandbox: false,
    target: "#nex-slot"
  });
</script>`}
        </pre>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h3>Price Settings</h3>
          <p className="nx-subtle">Set material and labor rates.</p>
        </div>
        <div className="vibe-grid">
          <label className="nx-field">
            <span>Material ($/sqft)</span>
            <input value={materialRate} onChange={(e) => setMaterialRate(e.target.value)} />
          </label>
          <label className="nx-field">
            <span>Labor ($/sqft)</span>
            <input value={laborRate} onChange={(e) => setLaborRate(e.target.value)} />
          </label>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h3>Analytics</h3>
          <p className="nx-subtle">How many people used my calculator this week?</p>
        </div>
        <div className="chart-placeholder">[Usage chart placeholder]</div>
      </section>
    </div>
  );
};

export default DashboardToolPage;
