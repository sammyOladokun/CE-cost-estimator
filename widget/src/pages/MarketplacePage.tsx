
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Hexagon,
  Key,
  Radar,
  LinkSimple,
  FileText,
  Gauge,
  ArrowsLeftRight,
  MagnifyingGlass,
  SlidersHorizontal,
  Star,
  ArrowRight,
  Compass,
  PlayCircle,
  CheckCircle,
} from "@phosphor-icons/react";
import "../styles.css";

type Tool = {
  id: string;
  slug: string;
  name: string;
  summary: string;
  icon_url?: string;
  media_url?: string;
  price_monthly?: number;
  rating?: number;
  reviews?: number;
};

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

const icons = [Key, Radar, LinkSimple, FileText, Gauge, ArrowsLeftRight];

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
      <nav className="market-nav-bar">
        <div className="brand">
          <div className="brand-icon">
            <Hexagon size={18} weight="duotone" />
          </div>
          <span>Synapse</span>
        </div>
        <div className="nav-links">
          <span>Marketplace</span>
          <span>Pricing</span>
          <span>API</span>
          <span>Company</span>
        </div>
        <div className="nav-actions">
          <button className="nav-ghost">Log in</button>
          <button className="nav-primary">
            Get Access
            <ArrowRight size={14} weight="duotone" />
          </button>
        </div>
      </nav>

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
            <a className="market-btn primary" href="#tools">
              <Compass size={18} weight="duotone" />
              Browse Tools
            </a>
            <a className="market-btn ghost" href="#feature">
              <PlayCircle size={18} weight="duotone" />
              How it Works
            </a>
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
              <MagnifyingGlass size={16} weight="duotone" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tools..." />
            </div>
            <button className="filter-btn" aria-label="Filter tools">
              <SlidersHorizontal size={18} weight="duotone" />
            </button>
          </div>
        </div>

        {loading && <p className="nx-subtle">Loading tools?</p>}

        {!loading && (
          <div className="tools-grid">
            {filtered.map((tool, idx) => {
              const Icon = icons[idx % icons.length] || Hexagon;
              const rating = tool.rating ?? 4.8;
              const reviews = tool.reviews ?? 1200;
              return (
                <Link key={tool.id} to={`/marketplace/${tool.slug}`} className="tool-card glass-card">
                  <div className="tool-top">
                    <div className="tool-icon-chip">
                      <Icon size={22} weight="duotone" />
                    </div>
                    <div className="corner-launch">
                      <ArrowRight size={16} weight="duotone" />
                    </div>
                  </div>
                  <div className="tool-meta">
                    <h3>{tool.name}</h3>
                    <p className="nx-subtle">{tool.summary}</p>
                  </div>
                  <div className="tool-footer">
                    <div className="rating">
                      <Star size={14} weight="duotone" /> {rating.toFixed(1)} <span className="reviews">({reviews.toLocaleString()})</span>
                    </div>
                    <span className="launch-link">
                      LAUNCH TOOL <ArrowRight size={12} weight="duotone" />
                    </span>
                  </div>
                </Link>
              );
            })}
            {filtered.length === 0 && <p className="nx-subtle">No tools match that search.</p>}
          </div>
        )}
      </section>

      <section className="market-feature" id="feature">
        <div className="feature-copy">
          <h3>Stop guessing. Start ranking.</h3>
          <p>
            Most SEO tools overwhelm you with data. This curated suite focuses on actionable insights that move the needle so you can ship faster, rank higher, and defend your edge.
          </p>
          <ul>
            <li>
              <CheckCircle size={16} weight="duotone" /> Real-time crawl + on-page scoring
            </li>
            <li>
              <CheckCircle size={16} weight="duotone" /> Semantic keyword discovery and clustering
            </li>
            <li>
              <CheckCircle size={16} weight="duotone" /> Competitor gap analysis and link intelligence
            </li>
            <li>
              <CheckCircle size={16} weight="duotone" /> API and white-label exports
            </li>
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
