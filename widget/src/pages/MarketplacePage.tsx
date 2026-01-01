
import React, { useEffect, useMemo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Hexagon,
  Key,
  Radar,
  Link as LinkIcon,
  FileText,
  Gauge,
  ArrowsLeftRight,
  MagnifyingGlass,
  SlidersHorizontal,
  Star,
  ArrowRight,
  ArrowUpRight,
  Compass,
  PlayCircle,
  CheckCircle,
} from "@phosphor-icons/react";
import "../styles.css";
import { useAuth } from "../context/AuthContext";

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

const iconCycle = [Key, Radar, LinkIcon, FileText, Gauge, ArrowsLeftRight];

export default function MarketplacePage() {
  const { openAuth, setAuthMode } = useAuth();
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

  const handleAuth = (mode: "login" | "register") => {
    setAuthMode(mode);
    openAuth();
  };

  return (
    <div className="syn-shell">
      <nav className="syn-nav glass-panel">
        <div className="syn-container syn-nav-inner">
          <div className="syn-brand">
            <div className="syn-brand-mark">
              <Hexagon size={18} weight="duotone" />
            </div>
            <span>Synapse</span>
          </div>
          <div className="syn-nav-links">
            <span>Marketplace</span>
            <span>Pricing</span>
            <span>API</span>
            <span>Company</span>
          </div>
          <div className="syn-nav-actions">
            <button className="syn-link" onClick={() => handleAuth("login")}>
              Log in
            </button>
            <button className="syn-btn" onClick={() => handleAuth("register")}>
              <span>Get Started</span>
              <ArrowRight size={14} weight="duotone" />
            </button>
          </div>
        </div>
      </nav>

      <main className="syn-main">
        <section className="syn-hero">
          <div className="syn-hero-overlay" aria-hidden />
          <div className="syn-container syn-hero-content">
            <div className="syn-pill">
              <span className="syn-pill-dot" />
              New Tool: AI Content Audit 2.0
            </div>
            <h1 className="syn-hero-title">
              SEO Tools that <br />
              <span className="text-gradient-primary">Elevate Your Rankings</span>
            </h1>
            <p className="syn-hero-sub">
              A curated marketplace of powerful micro-SaaS utilities designed to boost search engine visibility, analyze competitors, and drive organic traffic with surgical precision.
            </p>
            <div className="syn-cta-row">
              <a className="syn-btn primary" href="#tools">
                <Compass size={18} weight="duotone" />
                Browse Tools
              </a>
              <a className="syn-btn ghost" href="#feature">
                <PlayCircle size={18} weight="duotone" />
                How it Works
              </a>
            </div>
            <div className="syn-stats">
              {heroStats.map((stat) => (
                <div className="syn-stat" key={stat.label}>
                  <span className="syn-stat-value">{stat.value}</span>
                  <span className="syn-stat-label">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="syn-market" id="tools">
          <div className="syn-container">
            <div className="syn-market-head">
              <div>
                <p className="syn-kicker">Curated SEO Utilities</p>
                <h2 className="syn-section-title">Discover specialized tools engineered for performance.</h2>
              </div>
              <div className="syn-filter-row">
                <div className="syn-search">
                  <MagnifyingGlass size={16} weight="duotone" />
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tools..." />
                </div>
                <button className="syn-icon-btn" aria-label="Filter tools">
                  <SlidersHorizontal size={18} weight="duotone" />
                </button>
              </div>
            </div>

            {loading && <p className="syn-subtle">Loading tools…</p>}

            {!loading && (
              <>
                <div className="syn-grid">
                  {filtered.map((tool, idx) => {
                    const Icon = iconCycle[idx % iconCycle.length] || Hexagon;
                    const accent = idx % 2 === 0 ? "primary" : "secondary";
                    const rating = tool.rating ?? 4.8;
                    const reviews = tool.reviews ?? 1200;
                    return (
                      <RouterLink key={tool.id} to={`/marketplace/${tool.slug}`} className="syn-card glass-card">
                        <div className="syn-card-corner">
                          <ArrowUpRight size={18} weight="duotone" />
                        </div>
                        <div className={`syn-card-icon accent-${accent}`}>
                          <Icon size={22} weight="duotone" />
                        </div>
                        <div className="syn-card-body">
                          <h3>{tool.name}</h3>
                          <p className="syn-subtle">{tool.summary}</p>
                        </div>
                        <div className="syn-card-footer">
                          <div className="syn-rating">
                            <Star size={14} weight="duotone" /> {rating.toFixed(1)} <span className="syn-reviews">({reviews.toLocaleString()})</span>
                          </div>
                          <span className="syn-launch">
                            Launch Tool <ArrowRight size={12} weight="duotone" />
                          </span>
                        </div>
                      </RouterLink>
                    );
                  })}
                  {filtered.length === 0 && <p className="syn-subtle">No tools match that search.</p>}
                </div>
                <div className="syn-view-all">
                  <button className="syn-link muted">
                    View all 25+ tools
                    <ArrowRight size={14} weight="duotone" />
                  </button>
                </div>
              </>
            )}
          </div>
        </section>

        <section className="syn-feature" id="feature">
          <div className="syn-container syn-feature-inner glass-panel">
            <div className="syn-feature-copy">
              <h3>Stop guessing. Start ranking.</h3>
              <p>
                Most SEO tools overwhelm you with data. Synapse gives you answers. Our curated suite focuses on actionable insights that move the needle.
              </p>
              <ul>
                <li>
                  <span className="syn-bullet">
                    <CheckCircle size={16} weight="duotone" />
                  </span>
                  Real-time data processing
                </li>
                <li>
                  <span className="syn-bullet">
                    <CheckCircle size={16} weight="duotone" />
                  </span>
                  Export white-label reports
                </li>
                <li>
                  <span className="syn-bullet">
                    <CheckCircle size={16} weight="duotone" />
                  </span>
                  API access for enterprise plans
                </li>
              </ul>
            </div>
            <div className="syn-feature-visual" aria-label="Analytics preview">
              <div className="syn-chart">
                <div className="syn-chart-bar h40" />
                <div className="syn-chart-bar h60" />
                <div className="syn-chart-bar h30" />
                <div className="syn-chart-bar h80" />
                <div className="syn-chart-bar h50" />
                <div className="syn-chart-bar h70" />
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="syn-footer">
        <div className="syn-container syn-footer-grid">
          <div className="syn-footer-brand">
            <div className="syn-brand-mark sm">
              <Hexagon size={14} weight="duotone" />
            </div>
            <span>Synapse</span>
          </div>
          <div>
            <h4>Product</h4>
            <ul>
              <li>All Tools</li>
              <li>Pricing</li>
              <li>Enterprise</li>
              <li>Changelog</li>
            </ul>
          </div>
          <div>
            <h4>Resources</h4>
            <ul>
              <li>Documentation</li>
              <li>API Reference</li>
              <li>Blog</li>
              <li>Community</li>
            </ul>
          </div>
          <div>
            <h4>Legal</h4>
            <ul>
              <li>Privacy Policy</li>
              <li>Terms of Service</li>
              <li>Cookie Policy</li>
            </ul>
          </div>
        </div>
        <div className="syn-container syn-footer-meta">
          <p className="syn-subtle">© 2023 Synapse SEO Tools. All rights reserved.</p>
          <div className="syn-socials">
            <span />
            <span />
            <span />
          </div>
        </div>
      </footer>
    </div>
  );
}
