
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "../styles.css";

type Tool = {
  id: string;
  slug: string;
  name: string;
  summary: string;
  icon_url?: string;
  media_url?: string;
  price_monthly?: number;
};

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

const MarketplacePage: React.FC = () => {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const resp = await fetch(`${API_BASE}/api/marketplace/tools`);
        const data = await resp.json();
        setTools(data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(
    () => tools.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()) || t.summary.toLowerCase().includes(search.toLowerCase())),
    [tools, search],
  );

  const heroStats = [
    { label: "Premium Tools", value: "25+" },
    { label: "Active Users", value: "10k+" },
    { label: "Uptime SLA", value: "99%" },
    { label: "Expert Support", value: "24/7" },
  ];

  return (
    <div className="market-shell">
      <section className="market-hero2">
        <div className="market-hero-body">
          <div className="pill">New Tool: AI Content Audit 2.0</div>
          <h1 className="market-title">
            SEO Tools that <span className="market-title-accent">Elevate Your Rankings</span>
          </h1>
          <p className="market-sub">
            A curated marketplace of powerful micro-SaaS utilities designed to boost search engine visibility, analyze competitors, and drive organic traffic with surgical precision.
          </p>
          <div className="market-ctas">
            <a className="market-btn primary" href="#tools">Browse Tools</a>
            <a className="market-btn ghost" href="#feature">How it Works</a>
          </div>
          <div className="market-metrics">
            {heroStats.map((stat, idx) => (
              <React.Fragment key={stat.label}>
                {idx > 0 && <div className="metric-divider" />}
                <div className="market-metric">
                  <div className="market-metric-value">{stat.value}</div>
                  <div className="market-metric-label">{stat.label}</div>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      <section className="market-section" id="tools">
        <div className="section-head tools-head">
          <div>
            <p className="nx-kicker">Curated SEO Utilities</p>
            <h2>Discover specialized tools engineered for performance.</h2>
          </div>
          <div className="tools-actions">
            <div className="search-bar">
              <span className="search-icon">??</span>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tools..." />
            </div>
            <button className="filter-btn" aria-label="Filter tools">?</button>
          </div>
        </div>

        {loading && <p className="nx-subtle">Loading tools?</p>}

        {!loading && (
          <div className="tools-grid">
            {filtered.map((tool) => (
              <Link key={tool.id} to={`/marketplace/${tool.slug}`} className="tool-card">
                <div className="tool-icon-chip">{tool.name?.[0]?.toUpperCase() || "?"}</div>
                <div className="tool-meta">
                  <h3>{tool.name}</h3>
                  <p className="nx-subtle">{tool.summary}</p>
                </div>
                <div className="tool-footer">
                  <div className="rating">? 4.8</div>
                  <span className="launch-link">LAUNCH TOOL ?</span>
                </div>
              </Link>
            ))}
            {filtered.length === 0 && <p className="nx-subtle">No tools match that search.</p>}
          </div>
        )}
      </section>

      <section className="market-feature" id="feature">
        <div className="feature-copy">
          <h3>Stop guessing. Start ranking.</h3>
          <p>
            Most SEO tools overwhelm you with data. This curated suite focuses on actionable insights that move the needle?so you can ship faster, rank higher, and defend your edge.
          </p>
          <ul>
            <li>Real-time crawl + on-page scoring</li>
            <li>Semantic keyword discovery and clustering</li>
            <li>Competitor gap analysis and link intelligence</li>
            <li>API and white-label exports</li>
          </ul>
        </div>
        <div className="feature-chart">
          <div className="bar" style={{ height: 80 }} />
          <div className="bar" style={{ height: 120 }} />
          <div className="bar" style={{ height: 60 }} />
          <div className="bar" style={{ height: 140 }} />
          <div className="bar" style={{ height: 100 }} />
        </div>
      </section>
    </div>
  );
};

export default MarketplacePage;
