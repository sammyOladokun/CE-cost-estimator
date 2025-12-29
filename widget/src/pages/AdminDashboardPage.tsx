import React from "react";
import "../styles.css";

const AdminDashboardPage: React.FC = () => {
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
          {["Solar", "HVAC", "Fencing"].map((name) => (
            <div key={name} className="store-card">
              <div className="store-meta">
                <p className="nx-kicker">Tool</p>
                <h3>{name}</h3>
                <p className="nx-subtle">Upload icon, set monthly price.</p>
              </div>
              <p className="price-tag">$99/mo</p>
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
            <span>Status</span>
            <span>Plan</span>
            <span>MRR</span>
            <span>Tools</span>
          </div>
          {["Sky Roofing", "Bright Solar", "FenceCo"].map((c, idx) => (
            <div key={c} className="leads-row">
              <span>{c}</span>
              <span>{idx === 0 ? "Active" : idx === 1 ? "Trial" : "Canceled"}</span>
              <span>{idx === 2 ? "Standard" : "Pro"}</span>
              <span>${idx === 2 ? 0 : 299}</span>
              <span>3</span>
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
            <h2>$42,300</h2>
            <p className="nx-subtle">+8% vs last month</p>
          </div>
          <div className="mini-card">
            <p className="nx-kicker">Pending</p>
            <h2>$3,200</h2>
            <p className="nx-subtle">Invoices awaiting payment</p>
          </div>
          <div className="mini-card">
            <p className="nx-kicker">Coupons</p>
            <h2>5</h2>
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
        <div className="chart-placeholder">[Demo click analytics]</div>
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
          {["#1042", "#1043", "#1044"].map((id, idx) => (
            <div key={id} className="leads-row">
              <span>{id}</span>
              <span>{["Sky Roofing", "Bright Solar", "FenceCo"][idx]}</span>
              <span>Issue {idx + 1}</span>
              <span>{idx === 0 ? "Open" : "In Review"}</span>
              <span>Today</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default AdminDashboardPage;
