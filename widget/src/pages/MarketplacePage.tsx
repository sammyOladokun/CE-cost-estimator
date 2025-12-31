
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
  const featured = filtered.slice(0, 3);
  const more = filtered.slice(3);

  const heroStats = [
    { label: "Premium Tools", value: "25+" },
    { label: "Active Users", value: "10k+" },
    { label: "Uptime SLA", value: "99%" },
    { label: "Expert Support", value: "24/7" },
  ];

  return (
    <div className="page-shell dashboard">
      <div className="market-hero">
        <header className="market-top">
          <div className="market-brand">Synapse</div>
          <div className="market-nav">
            <span>Marketplace</span>
            <span>Pricing</span>
            <span>API</span>
            <span>Company</span>
          </div>
          <div className="market-auth">
            <button className="nx-ghost">Log in</button>
            <button className="nx-cta">Get Access</button>
          </div>
        </header>

        <div className="market-hero-body">
          <div className="pill">New Tool: AI Content Audit 2.0</div>
          <h1 className="market-title">
            SEO Tools that <span className="market-title-accent">Elevate Your Rankings</span>
          </h1>
          <p className="market-sub">
            A curated marketplace of powerful micro-SaaS utilities designed to boost search engine visibility, analyze competitors, and drive organic traffic with surgical precision.
          </p>
          <div className="market-ctas">
            <a className="market-btn primary" href="#curated">Browse Tools</a>
            <a className="market-btn ghost" href="#how">How it Works</a>
          </div>
          <div className="market-metrics">
            {heroStats.map((stat) => (
              <div key={stat.label} className="market-metric">
                <div className="market-metric-value">{stat.value}</div>
                <div className="market-metric-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="market-content">
        <section className="market-section" id="curated">
          <div className="section-head">
            <div>
              <p className="nx-kicker">Curated SEO Utilities</p>
              <h2>Discover specialized tools engineered for performance.</h2>
            </div>
            <div className="market-search">
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tools..." />
            </div>
          </div>

          {loading && <p className="nx-subtle">Loading tools?</p>}

          {!loading && (
            <>
              <div className="store-grid market-grid">
                {featured.map((tool) => (
                  <Link key={tool.id} to={`/marketplace/${tool.slug}`} className="store-card floating market-card">
                    <div className="store-meta">
                      <p className="nx-kicker">Featured</p>
                      <h3>{tool.name}</h3>
                      <p className="nx-subtle">{tool.summary}</p>
                    </div>
                    <div className="market-card-footer">
                      <div className="rating">? 4.9</div>
                      <button className="market-launch">Launch Tool ?</button>
                    </div>
                  </Link>
                ))}
              </div>

              <div className="store-grid market-grid">
                {more.map((tool) => (
                  <Link key={tool.id} to={`/marketplace/${tool.slug}`} className="store-card floating market-card">
                    <div className="store-meta">
                      <p className="nx-kicker">Utility</p>
                      <h3>{tool.name}</h3>
                      <p className="nx-subtle">{tool.summary}</p>
                    </div>
                    <div className="market-card-footer">
                      <div className="rating">? 4.8</div>
                      <button className="market-launch">Launch Tool ?</button>
                    </div>
                  </Link>
                ))}
                {filtered.length === 0 && <p className="nx-subtle">No tools match that search.</p>}
              </div>

              <div className="market-viewall">View all 25+ tools ?</div>
            </>
          )}
        </section>

        <section className="market-feature" id="how">
          <div className="feature-copy">
            <h3>Stop guessing. Start ranking.</h3>
            <p>
              Most SEO tools overwhelm you with data. Synapse gives you answers. Our curated suite focuses on actionable insights that move the needle.
            </p>
            <ul>
              <li>Real-time data processing</li>
              <li>Export white-label reports</li>
              <li>API access for enterprise plans</li>
            </ul>
          </div>
          <div className="feature-visual">Chart preview</div>
        </section>

        <footer className="market-footer">
          <div className="footer-brand">Synapse</div>
          <div className="footer-cols">
            <div>
              <p className="nx-kicker">Product</p>
              <p>All Tools</p>
              <p>Pricing</p>
              <p>Enterprise</p>
              <p>Changelog</p>
            </div>
            <div>
              <p className="nx-kicker">Resources</p>
              <p>Documentation</p>
              <p>API Reference</p>
              <p>Blog</p>
              <p>Community</p>
            </div>
            <div>
              <p className="nx-kicker">Legal</p>
              <p>Privacy Policy</p>
              <p>Terms of Service</p>
              <p>Cookie Policy</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default MarketplacePage;
