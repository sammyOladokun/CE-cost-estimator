import React, { useEffect, useState } from "react";
import "../styles.css";

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

  useEffect(() => {
    const load = async () => {
      const [tResp, tnResp, mResp, tiResp] = await Promise.all([
        fetch(`${API_BASE}/api/admin/tools/`),
        fetch(`${API_BASE}/api/admin/tenants/`),
        fetch(`${API_BASE}/api/admin/metrics/`),
        fetch(`${API_BASE}/api/admin/tickets/`),
      ]);
      if (tResp.ok) setTools(await tResp.json());
      if (tnResp.ok) setTenants(await tnResp.json());
      if (mResp.ok) setMetrics(await mResp.json());
      if (tiResp.ok) setTickets(await tiResp.json());
    };
    load();
  }, []);

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
          <button className="nx-cta" type="button">
            + Add Tool
          </button>
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
