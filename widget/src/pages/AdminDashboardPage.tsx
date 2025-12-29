import React, { useEffect, useState } from "react";
import "../styles.css";
import { useAuth } from "../context/AuthContext";

type Tool = {
  id: string;
  slug: string;
  name: string;
  summary: string;
  price_monthly?: number;
  icon_url?: string;
};

type TenantRow = {
  id: string;
  name: string;
  slug: string;
  plan: string;
  tool_count?: number;
};

type Metrics = {
  mrr: number;
  pending: number;
  coupons: number;
  demo_clicks: number;
  widget_uses: number;
};

type Ticket = { id: string; tenant: string; subject: string; status: string; updated: string };

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

const AdminDashboardPage: React.FC = () => {
  const [tools, setTools] = useState<Tool[]>([]);
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [newTool, setNewTool] = useState({ name: "", slug: "", summary: "", price_monthly: 99 });
  const { user, openAuth } = useAuth();

  useEffect(() => {
    const load = async () => {
      const headers: HeadersInit = {};
      if (user?.token) headers["Authorization"] = `Token ${user.token}`;
      const [tResp, tnResp, mResp, tiResp] = await Promise.all([
        fetch(`${API_BASE}/api/admin/tools/`, { headers }),
        fetch(`${API_BASE}/api/admin/tenants/`, { headers }),
        fetch(`${API_BASE}/api/admin/metrics/`, { headers }),
        fetch(`${API_BASE}/api/admin/tickets/`, { headers }),
      ]);
      if (tResp.ok) setTools(await tResp.json());
      if (tnResp.ok) setTenants(await tnResp.json());
      if (mResp.ok) setMetrics(await mResp.json());
      if (tiResp.ok) setTickets(await tiResp.json());
    };
    load();
  }, [user?.token]);

  const createTool = async () => {
    if (!user?.token) {
      openAuth();
      return;
    }
    const resp = await fetch(`${API_BASE}/api/admin/tools/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${user.token}`,
      },
      body: JSON.stringify(newTool),
    });
    if (resp.ok) {
      const saved = await resp.json();
      setTools((prev) => [saved, ...prev]);
      setNewTool({ name: "", slug: "", summary: "", price_monthly: 99 });
    }
  };

  return (
    <div className="page-shell dashboard">
      <header className="page-header">
        <p className="nx-kicker">Platform Admin</p>
        <h1>Command Center</h1>
        <p className="nx-subtle">Manage tools, tenants, billing, demos, and support.</p>
      </header>

      <section className="panel">
        <div className="panel-head">
          <h3>Marketplace Management</h3>
          <button className="nx-cta" type="button" onClick={createTool}>
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
        </div>
        <div className="store-grid">
          {tools.map((tool) => (
            <div key={tool.id} className="store-card">
              <div className="store-meta">
                <p className="nx-kicker">Tool</p>
                <h3>{tool.name}</h3>
                <p className="nx-subtle">{tool.summary}</p>
              </div>
              <p className="price-tag">${tool.price_monthly ?? 99}/mo</p>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h3>Tenant Oversight</h3>
          <p className="nx-subtle">Active, trialing, cancelled companies</p>
        </div>
        <div className="leads-table">
          <div className="leads-row head">
            <span>Company</span>
            <span>Plan</span>
            <span>Tools</span>
          </div>
          {tenants.map((t) => (
            <div key={t.id} className="leads-row">
              <span>{t.name}</span>
              <span>{t.plan}</span>
              <span>{t.tool_count ?? "—"}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h3>Subscription & Billing</h3>
          <p className="nx-subtle">Revenue, pending payments, coupons</p>
        </div>
        <div className="analytics-grid">
          <div className="mini-card">
            <p className="nx-kicker">MRR</p>
            <h2>${metrics?.mrr ?? 0}</h2>
            <p className="nx-subtle">Live from licenses</p>
          </div>
          <div className="mini-card">
            <p className="nx-kicker">Pending</p>
            <h2>${metrics?.pending ?? 0}</h2>
            <p className="nx-subtle">Invoices awaiting payment</p>
          </div>
          <div className="mini-card">
            <p className="nx-kicker">Coupons</p>
            <h2>{metrics?.coupons ?? 0}</h2>
            <p className="nx-subtle">Active discounts</p>
          </div>
        </div>
        <div className="chart-placeholder">[Revenue Chart]</div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h3>Demo & Lead Monitoring</h3>
          <p className="nx-subtle">Track global "Show Demo" clicks</p>
        </div>
        <div className="analytics-grid">
          <div className="mini-card">
            <p className="nx-kicker">Demo Clicks</p>
            <h2>{metrics?.demo_clicks ?? 0}</h2>
          </div>
          <div className="mini-card">
            <p className="nx-kicker">Widget Uses</p>
            <h2>{metrics?.widget_uses ?? 0}</h2>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h3>Support / Tickets</h3>
          <p className="nx-subtle">Bird's-eye view of issues</p>
        </div>
        <div className="leads-table">
          <div className="leads-row head">
            <span>ID</span>
            <span>Tenant</span>
            <span>Subject</span>
            <span>Status</span>
            <span>Updated</span>
          </div>
          {tickets.map((ticket) => (
            <div key={ticket.id} className="leads-row">
              <span>{ticket.id}</span>
              <span>{ticket.tenant}</span>
              <span>{ticket.subject}</span>
              <span>{ticket.status}</span>
              <span>{ticket.updated}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default AdminDashboardPage;
