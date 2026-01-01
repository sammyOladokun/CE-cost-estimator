import React, { useEffect, useState } from "react";
import "../styles.css";
import { useAuth } from "../context/AuthContext";
import {
  ChartLineUp,
  Funnel,
  UsersThree,
  CreditCard,
  PresentationChart,
  Lifebuoy,
  IdentificationBadge,
  LinkSimple,
  Storefront,
} from "@phosphor-icons/react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

type Tool = {
  id: string;
  slug: string;
  name: string;
  summary: string;
  price_monthly?: number;
  icon_url?: string;
  coupon_code?: string;
  coupon_percent_off?: number;
  media_url?: string;
  coupon_start?: string;
  coupon_end?: string;
  coupon_usage_limit?: number;
  coupon_usage_count?: number;
};

type TenantRow = {
  id: string;
  name: string;
  slug: string;
  plan: string;
  tool_count?: number;
  active_licenses?: number;
  trial_licenses?: number;
  canceled_licenses?: number;
};

type Metrics = {
  mrr: number;
  pending: number;
  coupons: number;
  demo_clicks: number;
  widget_uses: number;
  revenue_series?: { month: string; value: number }[];
  demo_series?: { date: string; count: number }[];
  widget_series?: { date: string; count: number }[];
  top_tools?: { slug: string; count: number }[];
};

type Ticket = { id: string; tenant: string; tenant_name?: string; tool?: string; subject: string; status: string; updated?: string };
type LicenseRow = { id: string; tenant_name: string; tool_name: string; status: string; plan: string };

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

const navLinks = [
  { id: "overview", label: "Overview", Icon: ChartLineUp },
  { id: "filters", label: "Filters", Icon: Funnel },
  { id: "tenants", label: "Tenants", Icon: UsersThree },
  { id: "billing", label: "Billing", Icon: CreditCard },
  { id: "demos", label: "Demos", Icon: PresentationChart },
  { id: "support", label: "Support", Icon: Lifebuoy },
  { id: "licenses", label: "Licenses", Icon: IdentificationBadge },
];

const AdminDashboardPage: React.FC = () => {
  const [tools, setTools] = useState<Tool[]>([]);
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [licenses, setLicenses] = useState<LicenseRow[]>([]);
  const [activeSection, setActiveSection] = useState<string>("overview");
  const [toolQuery, setToolQuery] = useState("");
  const [tenantQuery, setTenantQuery] = useState("");
  const [tenantPlan, setTenantPlan] = useState("");
  const [tenantLicenseStatus, setTenantLicenseStatus] = useState("");
  const [metricsFrom, setMetricsFrom] = useState("");
  const [metricsTo, setMetricsTo] = useState("");
  const [newTool, setNewTool] = useState({
    name: "",
    slug: "",
    summary: "",
    price_monthly: 99,
    coupon_code: "",
    coupon_percent_off: 0,
    coupon_start: "",
    coupon_end: "",
    coupon_usage_limit: 0,
    icon_url: "",
    media_url: "",
  });
  const { user, openAuth } = useAuth();
  const chartColors = ["#1F6BFF", "#00D4FF", "#7C3AED", "#22C55E", "#F59E0B"];
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    const load = async () => {
      const headers: HeadersInit = {};
      if (user?.token) headers["Authorization"] = `Token ${user.token}`;
      const [tResp, tnResp, mResp, tiResp, licResp] = await Promise.all([
        fetch(`${API_BASE}/api/admin/tools/?q=${encodeURIComponent(toolQuery)}`, { headers }),
        fetch(
          `${API_BASE}/api/admin/tenants/?q=${encodeURIComponent(tenantQuery)}&plan=${tenantPlan}&license_status=${tenantLicenseStatus}`,
          { headers },
        ),
        fetch(`${API_BASE}/api/admin/metrics/?from=${metricsFrom}&to=${metricsTo}`, { headers }),
        fetch(`${API_BASE}/api/admin/tickets/`, { headers }),
        fetch(`${API_BASE}/api/admin/licenses/`, { headers }),
      ]);
      if (tResp.ok) setTools(await tResp.json());
      if (tnResp.ok) setTenants(await tnResp.json());
      if (mResp.ok) setMetrics(await mResp.json());
      if (tiResp.ok) setTickets(await tiResp.json());
      if (licResp.ok) setLicenses(await licResp.json());
    };
    load();
  }, [user?.token]);

  const createTool = async () => {
    if (!user?.token) {
      openAuth();
      return;
    }
    const body = { ...newTool };
    const resp = await fetch(`${API_BASE}/api/admin/tools/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${user.token}`,
      },
      body: JSON.stringify(body),
    });
    if (resp.ok) {
      const saved = await resp.json();
      setTools((prev) => [saved, ...prev]);
      setNewTool({
        name: "",
        slug: "",
        summary: "",
        price_monthly: 99,
        coupon_code: "",
        coupon_percent_off: 0,
        coupon_start: "",
        coupon_end: "",
        coupon_usage_limit: 0,
        icon_url: "",
        media_url: "",
      });
    }
  };

  const patchTool = async (slug: string, body: Record<string, any>) => {
    if (!user?.token) {
      openAuth();
      return;
    }
    const resp = await fetch(`${API_BASE}/api/admin/tools/${slug}/`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${user.token}`,
      },
      body: JSON.stringify(body),
    });
    if (resp.ok) {
      const updated = await resp.json();
      setTools((prev) => prev.map((t) => (t.slug === slug ? { ...t, ...updated } : t)));
    }
  };

  const uploadExistingMedia = async (slug: string, file: File, field: "icon_url" | "media_url") => {
    if (!user?.token) {
      openAuth();
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    const resp = await fetch(`${API_BASE}/api/admin/upload`, {
      method: "POST",
      headers: { Authorization: `Token ${user.token}` },
      body: formData,
    });
    if (resp.ok) {
      const data = await resp.json();
      await patchTool(slug, { [field]: data.url });
    }
  };

  const updateTicketStatus = async (id: string, status: string) => {
    if (!user?.token) {
      openAuth();
      return;
    }
    const resp = await fetch(`${API_BASE}/api/admin/tickets/${id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Token ${user.token}` },
      body: JSON.stringify({ status }),
    });
    if (resp.ok) {
      const updated = await resp.json();
      setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, status: updated.status } : t)));
    }
  };

  const updateLicenseStatus = async (id: string, status: string) => {
    if (!user?.token) {
      openAuth();
      return;
    }
    const resp = await fetch(`${API_BASE}/api/admin/licenses/${id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Token ${user.token}` },
      body: JSON.stringify({ status }),
    });
    if (resp.ok) {
      const updated = await resp.json();
      setLicenses((prev) => prev.map((l) => (l.id === id ? { ...l, status: updated.status } : l)));
    }
  };

  return (
    <div className="page-shell dashboard command-surface" onClick={() => setShowProfile(false)}>
      <nav className="syn-nav glass-panel dash-nav" onClick={(e) => e.stopPropagation()}>
        <div className="syn-container syn-nav-inner">
          <Link to="/" className="syn-brand">
            <div className="syn-brand-mark">
              <LinkSimple size={18} weight="duotone" />
            </div>
            <span>Synapse</span>
          </Link>
          <div className="syn-nav-spacer" aria-hidden="true" />
          <div className="syn-nav-actions">
            <Link to="/marketplace" className="syn-link nav-with-icon">
              <Storefront size={16} weight="duotone" />
              MarketPlace
            </Link>
            <div className="profile-wrap" onClick={(e) => e.stopPropagation()}>
              <button className="profile-pill" onClick={() => setShowProfile((p) => !p)}>
                <span className="avatar">{user?.full_name?.[0] || user?.email[0]}</span>
              </button>
              {user && showProfile && (
                <div className="profile-card">
                  <p className="nx-kicker">Profile</p>
                  <p className="nx-subtle">{user.full_name}</p>
                  <p className="nx-subtle">{user.email}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="command-layout">
        <aside className="command-sidebar neon-rail">
          <div className="sidebar-brand">
            <p className="nx-kicker">Platform</p>
            <h3>Command Center</h3>
            <p className="nx-subtle">Neural ops board</p>
          </div>
          <div className="sidebar-links">
            {navLinks.map((link) => (
              <button
                key={link.id}
                className={`sidebar-link neon-link ${activeSection === link.id ? "active" : ""}`}
                onClick={() => setActiveSection(link.id)}
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

        <main className="command-main">
          {activeSection === "overview" && (
            <header className="command-hero holo-hero" id="overview">
              <div>
                <p className="nx-kicker">Platform Admin</p>
                <h1>Command Center</h1>
                <p className="nx-subtle">Glassmorphism cockpit for tools, tenants, billing, demos, and support.</p>
                <div className="hero-badges">
                  <span className="glass-chip">Live sync</span>
                  <span className="glass-chip">Neon secure</span>
                  <span className="glass-chip">Widget feed</span>
                </div>
              </div>
              <div className="hero-stats">
                <div className="mini-card pulse">
                  <p className="nx-kicker">MRR</p>
                  <h2>${metrics?.mrr ?? 0}</h2>
                  <p className="nx-subtle">Live from licenses</p>
                </div>
                <div className="mini-card pulse">
                  <p className="nx-kicker">Pending</p>
                  <h2>${metrics?.pending ?? 0}</h2>
                  <p className="nx-subtle">Invoices queued</p>
                </div>
                <div className="mini-card pulse">
                  <p className="nx-kicker">Coupons</p>
                  <h2>{metrics?.coupons ?? 0}</h2>
                  <p className="nx-subtle">Active boosts</p>
                </div>
              </div>
            </header>
          )}

          <div className="floating-grid">
            {activeSection === "overview" && (
              <section className="floating-card neon-card panel-wide" id="overview">
                <div className="panel-head">
                  <h3>Overview</h3>
                  <span className="nx-subtle">At-a-glance signals</span>
                </div>
                <div className="analytics-grid">
                  <div className="mini-card aurora">
                    <p className="nx-kicker">MRR</p>
                    <h2>${metrics?.mrr ?? 0}</h2>
                    <p className="nx-subtle">Live from licenses</p>
                  </div>
                  <div className="mini-card aurora">
                    <p className="nx-kicker">Pending</p>
                    <h2>${metrics?.pending ?? 0}</h2>
                    <p className="nx-subtle">Invoices queued</p>
                  </div>
                  <div className="mini-card aurora">
                    <p className="nx-kicker">Coupons</p>
                    <h2>{metrics?.coupons ?? 0}</h2>
                    <p className="nx-subtle">Active boosts</p>
                  </div>
                  <div className="mini-card aurora">
                    <p className="nx-kicker">Widget Uses</p>
                    <h2>{metrics?.widget_uses ?? 0}</h2>
                    <p className="nx-subtle">Engagement last 7d</p>
                  </div>
                </div>
                <div className="floating-grid">
                  <div className="chart-card neon-frame">
                    <div className="chart-head">
                      <p className="nx-kicker">Revenue trend</p>
                    </div>
                    <ResponsiveContainer>
                      <LineChart data={metrics?.revenue_series || []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                        <XAxis dataKey="month" stroke="#9aa0b5" />
                        <YAxis stroke="#9aa0b5" />
                        <Tooltip />
                        <Line type="monotone" dataKey="value" stroke="#1F6BFF" strokeWidth={3} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  {metrics?.top_tools && metrics.top_tools.length > 0 && (
                    <div className="chart-card neon-frame">
                      <div className="chart-head">
                        <p className="nx-kicker">Top Tools</p>
                      </div>
                      <ResponsiveContainer>
                        <PieChart>
                          <Pie data={metrics.top_tools} dataKey="count" nameKey="slug" cx="50%" cy="50%" outerRadius={80} label>
                            {metrics.top_tools.map((entry, index) => (
                              <Cell key={entry.slug} fill={chartColors[index % chartColors.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </section>
            )}

            {activeSection === "filters" && (
              <section className="floating-card neon-card panel-wide" id="filters">
                <div className="panel-head">
                  <h3>Filters</h3>
                  <span className="nx-subtle">Scope signals across the grid</span>
                </div>
                <div className="vibe-grid">
                  <label className="nx-field">
                    <span>Tool search</span>
                    <input value={toolQuery} onChange={(e) => setToolQuery(e.target.value)} placeholder="name or slug" />
                  </label>
                  <label className="nx-field">
                    <span>Tenant search</span>
                    <input value={tenantQuery} onChange={(e) => setTenantQuery(e.target.value)} placeholder="name or slug" />
                  </label>
                  <label className="nx-field">
                    <span>Tenant plan</span>
                    <select value={tenantPlan} onChange={(e) => setTenantPlan(e.target.value)}>
                      <option value="">Any</option>
                      <option value="freemium">Freemium</option>
                      <option value="standard">Standard</option>
                      <option value="pro">Pro</option>
                    </select>
                  </label>
                  <label className="nx-field">
                    <span>License status</span>
                    <select value={tenantLicenseStatus} onChange={(e) => setTenantLicenseStatus(e.target.value)}>
                      <option value="">Any</option>
                      <option value="active">Active</option>
                      <option value="trial">Trial</option>
                      <option value="canceled">Canceled</option>
                    </select>
                  </label>
                  <label className="nx-field">
                    <span>Metrics from</span>
                    <input type="date" value={metricsFrom} onChange={(e) => setMetricsFrom(e.target.value)} />
                  </label>
                  <label className="nx-field">
                    <span>Metrics to</span>
                    <input type="date" value={metricsTo} onChange={(e) => setMetricsTo(e.target.value)} />
                  </label>
                </div>
              </section>
            )}

            {activeSection === "marketplace" && (
              <section className="floating-card neon-card panel-wide" id="marketplace">
                <div className="panel-head">
                  <h3>Marketplace Management</h3>
                  <button className="nx-cta neon" type="button" onClick={createTool}>
                    + Add Tool
                  </button>
                </div>
                <div className="vibe-grid">
                  <label className="nx-field">
                    <span>Name</span>
                    <input value={newTool.name} onChange={(e) => setNewTool({ ...newTool, name: e.target.value })} />
                  </label>
                  <label className="nx-field">
                    <span>Slug</span>
                    <input value={newTool.slug} onChange={(e) => setNewTool({ ...newTool, slug: e.target.value })} />
                  </label>
                  <label className="nx-field">
                    <span>Price / mo</span>
                    <input
                      type="number"
                      value={newTool.price_monthly}
                      onChange={(e) => setNewTool({ ...newTool, price_monthly: Number(e.target.value || 0) })}
                    />
                  </label>
                  <label className="nx-field">
                    <span>Coupon Code</span>
                    <input
                      value={newTool.coupon_code || ""}
                      onChange={(e) => setNewTool({ ...newTool, coupon_code: e.target.value })}
                      placeholder="e.g., SAVE20"
                    />
                  </label>
                  <label className="nx-field">
                    <span>Coupon % Off</span>
                    <input
                      type="number"
                      value={newTool.coupon_percent_off || 0}
                      onChange={(e) => setNewTool({ ...newTool, coupon_percent_off: Number(e.target.value || 0) })}
                    />
                  </label>
                  <label className="nx-field">
                    <span>Coupon Start</span>
                    <input type="date" value={newTool.coupon_start} onChange={(e) => setNewTool({ ...newTool, coupon_start: e.target.value })} />
                  </label>
                  <label className="nx-field">
                    <span>Coupon End</span>
                    <input type="date" value={newTool.coupon_end} onChange={(e) => setNewTool({ ...newTool, coupon_end: e.target.value })} />
                  </label>
                  <label className="nx-field">
                    <span>Usage Limit (0 = unlimited)</span>
                    <input
                      type="number"
                      value={newTool.coupon_usage_limit || 0}
                      onChange={(e) => setNewTool({ ...newTool, coupon_usage_limit: Number(e.target.value || 0) })}
                    />
                  </label>
                  <label className="nx-field">
                    <span>Icon Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadMedia(file, "icon_url");
                      }}
                    />
                    {newTool.icon_url && <p className="nx-subtle small">Uploaded: {newTool.icon_url}</p>}
                  </label>
                  <label className="nx-field">
                    <span>Hero Media Upload</span>
                    <input
                      type="file"
                      accept="image/*,video/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadMedia(file, "media_url");
                      }}
                    />
                    {newTool.media_url && <p className="nx-subtle small">Uploaded: {newTool.media_url}</p>}
                  </label>
                </div>
                <div className="store-grid">
                  {tools.map((tool) => (
                    <div key={tool.id} className="store-card floating">
                      <div className="store-meta">
                        <p className="nx-kicker">Tool</p>
                        <h3>{tool.name}</h3>
                        <p className="nx-subtle">{tool.summary}</p>
                        {tool.coupon_code && tool.coupon_percent_off ? (
                          <p className="price-tag">
                            Coupon {tool.coupon_code}: {tool.coupon_percent_off}% off
                            {tool.coupon_usage_limit ? ` | ${tool.coupon_usage_count || 0}/${tool.coupon_usage_limit} used` : ""}
                          </p>
                        ) : null}
                      </div>
                      <div className="nx-field">
                        <span className="nx-kicker">Price / mo</span>
                        <input
                          type="number"
                          defaultValue={tool.price_monthly ?? 99}
                          onBlur={(e) => patchTool(tool.slug, { price_monthly: Number(e.target.value || 0) })}
                        />
                      </div>
                      <div className="nx-field">
                        <span className="nx-kicker">Icon</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) uploadExistingMedia(tool.slug, file, "icon_url");
                          }}
                        />
                      </div>
                      <div className="nx-field">
                        <span className="nx-kicker">Hero Media</span>
                        <input
                          type="file"
                          accept="image/*,video/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) uploadExistingMedia(tool.slug, file, "media_url");
                          }}
                        />
                      </div>
                      <div className="cta-row">
                        <button
                          className="nx-ghost"
                          type="button"
                          onClick={() =>
                            patchTool(tool.slug, {
                              coupon_code: tool.coupon_code || "NEWCODE",
                              coupon_percent_off: tool.coupon_percent_off || 10,
                            })
                          }
                        >
                          Create/Update Coupon
                        </button>
                        <button
                          className="nx-ghost"
                          type="button"
                          onClick={() => patchTool(tool.slug, { coupon_code: "", coupon_percent_off: 0 })}
                        >
                          Clear Coupon
                        </button>
                        <button className="nx-ghost" type="button" onClick={() => updateLicenseStatus(tool.id, "canceled")}>
                          Issue Credit
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {activeSection === "tenants" && (
              <section className="floating-card neon-card panel-wide" id="tenants">
                <div className="panel-head">
                  <h3>Tenant Oversight</h3>
                  <p className="nx-subtle">Active, trialing, cancelled companies</p>
                </div>
                <div className="leads-table glass-table">
                  <div className="leads-row head">
                    <span>Company</span>
                    <span>Plan</span>
                    <span>Tools</span>
                    <span>Licenses</span>
                  </div>
                  {tenants.map((t) => (
                    <div key={t.id} className="leads-row">
                      <span>{t.name}</span>
                      <span>{t.plan}</span>
                      <span>{t.tool_count ?? 0}</span>
                      <span>
                        Active {t.active_licenses ?? 0} | Trial {t.trial_licenses ?? 0} | Canceled {t.canceled_licenses ?? 0}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {activeSection === "billing" && (
              <section className="floating-card neon-card panel-wide" id="billing">
                <div className="panel-head">
                  <h3>Subscription & Billing</h3>
                  <p className="nx-subtle">Revenue, pending payments, coupons</p>
                </div>
                <div className="analytics-grid">
                  <div className="mini-card aurora">
                    <p className="nx-kicker">MRR</p>
                    <h2>${metrics?.mrr ?? 0}</h2>
                    <p className="nx-subtle">Live from licenses</p>
                  </div>
                  <div className="mini-card aurora">
                    <p className="nx-kicker">Pending</p>
                    <h2>${metrics?.pending ?? 0}</h2>
                    <p className="nx-subtle">Invoices awaiting payment</p>
                  </div>
                  <div className="mini-card aurora">
                    <p className="nx-kicker">Coupons</p>
                    <h2>{metrics?.coupons ?? 0}</h2>
                    <p className="nx-subtle">Active discounts</p>
                  </div>
                </div>
                <div className="chart-card neon-frame">
                  <div className="chart-head">
                    <p className="nx-kicker">Revenue trend</p>
                  </div>
                  <ResponsiveContainer>
                    <LineChart data={metrics?.revenue_series || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="month" stroke="#9aa0b5" />
                      <YAxis stroke="#9aa0b5" />
                      <Tooltip />
                      <Line type="monotone" dataKey="value" stroke="#1F6BFF" strokeWidth={3} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </section>
            )}

            {activeSection === "demos" && (
              <section className="floating-card neon-card" id="demos">
                <div className="panel-head">
                  <h3>Demo & Lead Monitoring</h3>
                  <p className="nx-subtle">Track global "Show Demo" clicks</p>
                </div>
                <div className="analytics-grid">
                  <div className="mini-card aurora">
                    <p className="nx-kicker">Demo Clicks</p>
                    <h2>{metrics?.demo_clicks ?? 0}</h2>
                  </div>
                  <div className="mini-card aurora">
                    <p className="nx-kicker">Widget Uses</p>
                    <h2>{metrics?.widget_uses ?? 0}</h2>
                  </div>
                </div>
                {metrics?.demo_series && metrics?.widget_series && (
                  <div className="chart-card neon-frame">
                    <div className="chart-head">
                      <p className="nx-kicker">Last 7 days</p>
                    </div>
                    <ResponsiveContainer>
                      <BarChart
                        data={(metrics.demo_series || []).map((d, idx) => ({
                          date: d.date.slice(5),
                          demo: d.count,
                          widget: metrics.widget_series?.[idx]?.count || 0,
                        }))}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                        <XAxis dataKey="date" stroke="#9aa0b5" />
                        <YAxis stroke="#9aa0b5" />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="demo" fill="#1F6BFF" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="widget" fill="#22C55E" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
                {metrics?.top_tools && metrics.top_tools.length > 0 && (
                  <div className="chart-card neon-frame">
                    <div className="chart-head">
                      <p className="nx-kicker">Top Tools</p>
                    </div>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie data={metrics.top_tools} dataKey="count" nameKey="slug" cx="50%" cy="50%" outerRadius={80} label>
                          {metrics.top_tools.map((entry, index) => (
                            <Cell key={entry.slug} fill={chartColors[index % chartColors.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </section>
            )}

            {activeSection === "support" && (
              <section className="floating-card neon-card" id="support">
                <div className="panel-head">
                  <h3>Support / Tickets</h3>
                  <p className="nx-subtle">Bird's-eye view of issues</p>
                </div>
                <div className="leads-table glass-table">
                  <div className="leads-row head">
                    <span>ID</span>
                    <span>Tenant</span>
                    <span>Subject</span>
                    <span>Status</span>
                    <span>Updated</span>
                    <span>Actions</span>
                  </div>
                  {tickets.map((ticket) => (
                    <div key={ticket.id} className="leads-row">
                      <span>{ticket.id}</span>
                      <span>{ticket.tenant_name || ticket.tenant}</span>
                      <span>{ticket.subject}</span>
                      <span>{ticket.status}</span>
                      <span>{ticket.updated || ""}</span>
                      <span>
                        <select value={ticket.status} onChange={(e) => updateTicketStatus(ticket.id, e.target.value)}>
                          <option value="open">Open</option>
                          <option value="in_review">In Review</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Closed</option>
                        </select>
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {activeSection === "licenses" && (
              <section className="floating-card neon-card panel-wide" id="licenses">
                <div className="panel-head">
                  <h3>Licenses</h3>
                  <p className="nx-subtle">Activate or suspend tenant access</p>
                </div>
                <div className="leads-table glass-table">
                  <div className="leads-row head">
                    <span>Tenant</span>
                    <span>Tool</span>
                    <span>Status</span>
                    <span>Plan</span>
                    <span>Actions</span>
                  </div>
                  {licenses.map((lic) => (
                    <div key={lic.id} className="leads-row">
                      <span>{lic.tenant_name}</span>
                      <span>{lic.tool_name}</span>
                      <span>{lic.status}</span>
                      <span>{lic.plan}</span>
                      <span>
                        <select value={lic.status} onChange={(e) => updateLicenseStatus(lic.id, e.target.value)}>
                          <option value="active">Active</option>
                          <option value="trial">Trial</option>
                          <option value="pending">Pending</option>
                          <option value="canceled">Canceled</option>
                          <option value="expired">Expired</option>
                        </select>
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
