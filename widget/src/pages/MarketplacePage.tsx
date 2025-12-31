
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
    { label: "Premium SEO Tools", value: "25+" },
    { label: "Active Users", value: "10k+" },
    { label: "Uptime SLA", value: "99%" },
    { label: "Expert Support", value: "24/7" },
  ];

  return (
    <div className="page-shell dashboard market-shell">
      <section className="market-hero2">
        <header className="market-top">
          <div className="market-brand">Synapse</div>
          <nav className="market-nav">
            <span>Marketplace</span>
            <span>Pricing</span>
            <span>API</span>
            <span>Company</span>
          </nav>
          <div className="market-auth">
            <button className="market-btn ghost sm">Log in</button>
            <button className="market-btn primary sm">Get Access</button>
          </div>
        </header>

        <div className="market-hero-body">
          <div className="pill">New: AI Content Audit 2.0</div>
          <h1 className="market-title">
            Micro-SaaS SEO tools that <span className="market-title-accent">elevate your rankings</span>
          </h1>
          <p className="market-sub">
            A curated marketplace of powerful SEO micro-utilities designed to boost visibility, dissect competitors, and drive sustainable organic growth with surgical precision.
          </p>
          <div className="market-ctas">
            <a className="market-btn primary" href="#tools">Browse Tools</a>
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
      </section>

      <section className="market-section" id="how">
        <div className="feature-copy">
          <h3>Stop guessing. Start ranking.</h3>
          <p>
            Our micro-SaaS SEO stack focuses on actionable insights instead of noise. Deploy specialized tools for audits, competitive intel, and on-page lift?all with glassy fast UI.
          </p>
          <ul>
            <li>Real-time crawl + on-page scoring</li>
            <li>Semantic keyword discovery and clustering</li>
            <li>Competitor gap analysis and link intelligence</li>
            <li>White-label exports and API access</li>
          </ul>
        </div>
        <div className="feature-visual">Live insights, purple-cyan energy.</div>
      </section>

      <section className="market-section" id="tools">
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
            <div className="market-grid">
              {featured.map((tool) => (
                <Link key={tool.id} to={`/marketplace/${tool.slug}`} className="store-card floating market-card">
                  <div className="market-icon-chip">{tool.name?.[0]?.toUpperCase() || "?"}</div>
                  <div className="store-meta">
                    <p className="nx-kicker">Featured</p>
                    <h3>{tool.name}</h3>
                    <p className="nx-subtle">{tool.summary}</p>
                  </div>
                  <div className="market-card-footer">
                    <div className="rating">? 4.9</div>
                    <span className="market-launch">Launch Tool ?</span>
                  </div>
                </Link>
              ))}
              {featured.length === 0 && <p className="nx-subtle">No featured tools yet.</p>}
            </div>

            <div className="market-grid">
              {more.map((tool) => (
                <Link key={tool.id} to={`/marketplace/${tool.slug}`} className="store-card floating market-card">
                  <div className="market-icon-chip">{tool.name?.[0]?.toUpperCase() || "?"}</div>
                  <div className="store-meta">
                    <p className="nx-kicker">SEO Utility</p>
                    <h3>{tool.name}</h3>
                    <p className="nx-subtle">{tool.summary}</p>
                  </div>
                  <div className="market-card-footer">
                    <div className="rating">? 4.8</div>
                    <span className="market-launch">Launch Tool ?</span>
                  </div>
                </Link>
              ))}
              {filtered.length === 0 && <p className="nx-subtle">No tools match that search.</p>}
            </div>
          </>
        )}
      </section>

      <section className="market-cta-band">
        <div>
          <h3>Elevate your SEO stack.</h3>
          <p className="nx-subtle">Plug in micro-tools, ship faster insights, and keep rankings electric.</p>
        </div>
        <a className="market-btn primary" href="#tools">
          Browse all tools
        </a>
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
  );
};

export default MarketplacePage;
