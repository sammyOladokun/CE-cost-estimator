import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import "../styles.css";
import { useAuth } from "../context/AuthContext";

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
const WIDGET_CDN = import.meta.env.VITE_WIDGET_CDN || `${API_BASE}/nex-widget.iife.js`;
const TENANT_ID = import.meta.env.VITE_DEMO_TENANT_ID || "";

const DashboardToolPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const [tool, setTool] = useState<Tool | null>(null);
  const [leads, setLeads] = useState<WidgetLead[]>([]);
  const [leadPage, setLeadPage] = useState(1);
  const [leadCount, setLeadCount] = useState(0);
  const [leadPageSize, setLeadPageSize] = useState(10);
  const [leadEmailFilter, setLeadEmailFilter] = useState("");
  const [leadFrom, setLeadFrom] = useState("");
  const [leadTo, setLeadTo] = useState("");
  const [leadError, setLeadError] = useState<string | null>(null);
  const [leadLoading, setLeadLoading] = useState(false);
  const [config, setConfig] = useState<WidgetConfig | null>(null);
  const [primary, setPrimary] = useState("#0A0F1A");
  const [secondary, setSecondary] = useState("#1F6BFF");
  const [theme, setTheme] = useState<"frosted" | "smoked">("frosted");
  const [mark, setMark] = useState("neX");
  const [saving, setSaving] = useState(false);
  const [hook, setHook] = useState("See Your Roof from Space & Get a Technical Estimate in 60 Seconds.");
  const [logoUrl, setLogoUrl] = useState("");
  const [materials, setMaterials] = useState<{ name: string; materialRate: string; laborRate: string }[]>([
    { name: "Asphalt Shingle", materialRate: "2.25", laborRate: "1.50" },
  ]);
  const [materialsStatus, setMaterialsStatus] = useState<string | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null);
  const [siteUrl, setSiteUrl] = useState("https://yourdomain.com");
  const [vibeStatus, setVibeStatus] = useState<string | null>(null);
  const [originStatus, setOriginStatus] = useState<string | null>(null);

  useEffect(() => {
    const headers = TENANT_ID ? { "X-Tenant-ID": TENANT_ID } : {};
    const loadTool = async () => {
      const resp = await fetch(`${API_BASE}/api/marketplace/tools/${slug}`);
      if (resp.ok) {
        const data = await resp.json();
        setTool(data);
      }
    };
    const loadLeads = async (page = 1) => {
      if (!slug) return;
      setLeadLoading(true);
      setLeadError(null);
      const params = new URLSearchParams();
      params.set("tool", slug);
      params.set("page", String(page));
      params.set("page_size", String(leadPageSize));
      if (leadEmailFilter) params.set("email", leadEmailFilter);
      if (leadFrom) params.set("from", leadFrom);
      if (leadTo) params.set("to", leadTo);
      const resp = await fetch(`${API_BASE}/api/leads/widget?${params.toString()}`, { headers });
      if (resp.ok) {
        const data = await resp.json();
        if (Array.isArray(data)) {
          setLeads(data);
          setLeadCount(data.length);
        } else {
          setLeads(data.results || []);
          setLeadCount(data.count || 0);
        }
      } else {
        setLeadError("Unable to load leads");
      }
      setLeadLoading(false);
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
        setHook(data.marketing_hook || hook);
        setLogoUrl(data.logo_url || "");
      }
    };
    const loadMaterials = async () => {
      const resp = await fetch(`${API_BASE}/api/materials?tool=${slug}`, { headers });
      if (resp.ok) {
        const data = await resp.json();
        if (Array.isArray(data) && data.length) {
          setMaterials(
            data.map((m: any) => ({
              name: m.name,
              materialRate: String(m.material_rate),
              laborRate: String(m.labor_rate),
            })),
          );
        }
      }
    };
    loadTool();
    loadLeads();
    loadConfig();
    loadMaterials();
  }, [slug]);

  const handleLeadPage = (dir: "next" | "prev") => {
    const nextPage = dir === "next" ? leadPage + 1 : Math.max(1, leadPage - 1);
    setLeadPage(nextPage);
    const headers = TENANT_ID ? { "X-Tenant-ID": TENANT_ID } : {};
    if (user?.token) headers["Authorization"] = `Token ${user.token}`;
    fetch(`${API_BASE}/api/leads/widget?tool=${slug}&page=${nextPage}`, { headers }).then(async (resp) => {
      if (resp.ok) {
        const data = await resp.json();
        if (Array.isArray(data)) {
          setLeads(data);
        } else {
          setLeads(data.results || []);
        }
      }
    });
  };

  const applyLeadFilters = () => {
    setLeadPage(1);
    const headers = TENANT_ID ? { "X-Tenant-ID": TENANT_ID } : {};
    if (user?.token) headers["Authorization"] = `Token ${user.token}`;
    const params = new URLSearchParams();
    params.set("tool", slug || "");
    params.set("page", "1");
    params.set("page_size", String(leadPageSize));
    if (leadEmailFilter) params.set("email", leadEmailFilter);
    if (leadFrom) params.set("from", leadFrom);
    if (leadTo) params.set("to", leadTo);
    fetch(`${API_BASE}/api/leads/widget?${params.toString()}`, { headers }).then(async (resp) => {
      if (resp.ok) {
        const data = await resp.json();
        setLeads(Array.isArray(data) ? data : data.results || []);
        setLeadCount(Array.isArray(data) ? data.length : data.count || 0);
      } else {
        setLeadError("Unable to load leads");
      }
    });
  };

  const saveMaterials = async () => {
    setMaterialsStatus(null);
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (TENANT_ID) headers["X-Tenant-ID"] = TENANT_ID;
    if (user?.token) headers["Authorization"] = `Token ${user.token}`;
    const resp = await fetch(`${API_BASE}/api/materials`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        tool: slug,
        materials: materials.map((m) => ({
          name: m.name,
          material_rate: m.materialRate,
          labor_rate: m.laborRate,
        })),
      }),
    });
    if (resp.ok) {
      setMaterialsStatus("Saved");
    } else {
      setMaterialsStatus("Error saving");
    }
  };

  const saveOrigin = async () => {
    setOriginStatus(null);
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (TENANT_ID) headers["X-Tenant-ID"] = TENANT_ID;
    if (user?.token) headers["Authorization"] = `Token ${user.token}`;
    const resp = await fetch(`${API_BASE}/api/tenant/origin`, {
      method: "POST",
      headers,
      body: JSON.stringify({ domain: siteUrl }),
    });
    if (resp.ok) {
      const data = await resp.json();
      setOriginStatus(data.note || "Origin saved; add to CORS/CSRF allowlists.");
    } else setOriginStatus("Error saving origin");
  };

  const saveVibe = async () => {
    setSaving(true);
    setMaterialsStatus(null);
    setVibeStatus(null);
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (TENANT_ID) headers["X-Tenant-ID"] = TENANT_ID;
    if (user?.token) headers["Authorization"] = `Token ${user.token}`;
    const resp = await fetch(`${API_BASE}/api/widget/config`, {
      method: "PUT",
      headers,
      body: JSON.stringify({
        primary_color: primary,
        secondary_color: secondary,
        theme,
        mark_text: mark,
        marketing_hook: hook,
        logo_url: logoUrl,
      }),
    });
    if (resp.ok) {
      setVibeStatus("Saved");
    } else {
      setVibeStatus("Error saving");
    }
    setSaving(false);
  };

  const installedPrice = useMemo(() => (tool?.price_monthly ?? 99).toLocaleString(), [tool]);

  if (!user) {
    return (
      <div className="page-shell">
        <p className="nx-subtle">Please log in to view tool settings.</p>
      </div>
    );
  }

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
          <div className="leads-row">
            <input
              placeholder="Filter by email"
              value={leadEmailFilter}
              onChange={(e) => setLeadEmailFilter(e.target.value)}
            />
            <input type="date" value={leadFrom} onChange={(e) => setLeadFrom(e.target.value)} />
            <input type="date" value={leadTo} onChange={(e) => setLeadTo(e.target.value)} />
            <select value={leadPageSize} onChange={(e) => setLeadPageSize(Number(e.target.value))}>
              {[5, 10, 25, 50].map((n) => (
                <option key={n} value={n}>
                  {n}/page
                </option>
              ))}
            </select>
            <button className="nx-ghost" type="button" onClick={applyLeadFilters}>
              Apply
            </button>
          </div>
          {leadError && <p className="status error">{leadError}</p>}
          {!leadError && !leadLoading && leads.length === 0 && <p className="nx-subtle">No leads yet. Capture via widget.</p>}
          {leadLoading && <p className="nx-subtle">Loading leads…</p>}
          {leads.map((lead) => (
            <div key={lead.id} className="leads-row">
              <span>{lead.full_name}</span>
              <span>{lead.email}</span>
              <span>{lead.phone}</span>
              <span>{lead.address}</span>
              <span>{lead.estimate_amount ? `$${lead.estimate_amount}` : "—"}</span>
            </div>
          ))}
          {leads.length > 0 && (
            <div className="leads-row">
              <button
                className="nx-ghost"
                type="button"
                onClick={() => {
                  const csv = [
                    ["Name", "Email", "Phone", "Address", "Estimate"],
                    ...leads.map((l) => [l.full_name, l.email, l.phone, l.address, l.estimate_amount || ""]),
                  ]
                    .map((row) => row.join(","))
                    .join("\n");
                  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `leads-${slug}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                Export CSV
              </button>
            </div>
          )}
          {leadCount > leads.length && (
            <div className="leads-row">
              <button className="nx-ghost" type="button" onClick={() => handleLeadPage("prev")} disabled={leadPage === 1}>
                Prev
              </button>
              <span className="nx-subtle">
                Page {leadPage} • Showing {leads.length} of {leadCount}
              </span>
              <button className="nx-cta" type="button" onClick={() => handleLeadPage("next")}>
                Next
              </button>
            </div>
          )}
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
            {vibeStatus && <p className={`status ${vibeStatus.startsWith("Error") ? "error" : ""}`}>{vibeStatus}</p>}
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
              <span>Logo URL</span>
              <input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://..." />
            </label>
            <label className="nx-field">
              <span>Upload Logo</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = () => {
                      if (typeof reader.result === "string") setLogoUrl(reader.result);
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
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
          <p className="nx-subtle">Copy/paste into your site. Set your domain so CORS can allow it.</p>
        </div>
        <label className="nx-field">
          <span>Website URL (for CORS allowlist)</span>
          <input value={siteUrl} onChange={(e) => setSiteUrl(e.target.value)} />
        </label>
        <pre className="code-block">
{`<script src="${WIDGET_CDN}"></script>
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
        <button
          className="nx-cta"
          type="button"
          onClick={() => navigator.clipboard.writeText(`<script src="${WIDGET_CDN}"></script>
<div id="nex-slot"></div>
<script>
  window.nexWidget({
    tenantId: "${TENANT_ID || "<tenant-id>"}",
    apiBase: "${API_BASE}",
    toolSlug: "${slug}",
    sandbox: false,
    target: "#nex-slot"
  });
</script>`)}
        >
          Copy Embed Code
        </button>
        <button className="nx-ghost" type="button" onClick={saveOrigin}>
          Save Site URL for CORS/CSRF
        </button>
        {originStatus && <p className={`status ${originStatus.startsWith("Error") ? "error" : ""}`}>{originStatus}</p>}
      </section>

      <section className="panel">
        <div className="panel-head">
          <h3>Price Settings</h3>
          <p className="nx-subtle">Set material and labor rates per material type.</p>
        </div>
        <label className="nx-field">
          <span>Material applied in estimates</span>
          <select value={selectedMaterial || ""} onChange={(e) => setSelectedMaterial(e.target.value || null)}>
            <option value="">First in list (default)</option>
            {materials.map((m, idx) => (
              <option key={`${m.name}-${idx}`} value={m.name}>
                {m.name}
              </option>
            ))}
          </select>
        </label>
        <div className="vibe-grid">
          {materials.map((m, idx) => (
            <div key={idx} className="price-row">
              <label className="nx-field">
                <span>Material Type</span>
                <input
                  value={m.name}
                  onChange={(e) =>
                    setMaterials((prev) => prev.map((item, i) => (i === idx ? { ...item, name: e.target.value } : item)))
                  }
                />
              </label>
              <label className="nx-field">
                <span>Material ($/sqft)</span>
                <input
                  value={m.materialRate}
                  onChange={(e) =>
                    setMaterials((prev) =>
                      prev.map((item, i) => (i === idx ? { ...item, materialRate: e.target.value } : item)),
                    )
                  }
                />
              </label>
              <label className="nx-field">
                <span>Labor ($/sqft)</span>
                <input
                  value={m.laborRate}
                  onChange={(e) =>
                    setMaterials((prev) => prev.map((item, i) => (i === idx ? { ...item, laborRate: e.target.value } : item)))
                  }
                />
              </label>
            </div>
          ))}
        </div>
        <button
          className="nx-ghost"
          type="button"
          onClick={() => setMaterials((prev) => [...prev, { name: "New Material", materialRate: "0.00", laborRate: "0.00" }])}
        >
          + Add Material
        </button>
        <button className="nx-cta" type="button" onClick={saveMaterials}>
          Save Rates
        </button>
        {materialsStatus && <p className={`status ${materialsStatus.startsWith("Error") ? "error" : ""}`}>{materialsStatus}</p>}
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
