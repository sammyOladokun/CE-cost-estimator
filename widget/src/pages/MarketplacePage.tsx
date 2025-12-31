
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

  return (
    <div className="page-shell dashboard command-surface">
      <div className="command-layout">
        <aside className="command-sidebar neon-rail">
          <div className="sidebar-brand">
            <p className="nx-kicker">Marketplace</p>
            <h3>Storefront</h3>
            <p className="nx-subtle">Curated tools</p>
          </div>
          <div className="sidebar-links">
            <div className="sidebar-link neon-link active">
              <span className="sidebar-icon">[ALL]</span>
              <span className="sidebar-label">All</span>
            </div>
            <div className="sidebar-link neon-link">
              <span className="sidebar-icon">[AI]</span>
              <span className="sidebar-label">AI/ML</span>
            </div>
            <div className="sidebar-link neon-link">
              <span className="sidebar-icon">[SAAS]</span>
              <span className="sidebar-label">SaaS Ops</span>
            </div>
            <div className="sidebar-link neon-link">
              <span className="sidebar-icon">[ANL]</span>
              <span className="sidebar-label">Analytics</span>
            </div>
          </div>
          <div className="sidebar-glow" />
        </aside>

        <main className="command-main">
          <header className="command-hero holo-hero">
            <div>
              <p className="nx-kicker">neX Multi-Tool Store</p>
              <h1>Discover & deploy</h1>
              <p className="nx-subtle">Hover to preview, click to explore. Glassmorphic shelves, neon vibes.</p>
              <div className="hero-badges">
                <span className="glass-chip">Live updates</span>
                <span className="glass-chip">Secure</span>
                <span className="glass-chip">Fast install</span>
              </div>
            </div>
            <div className="hero-stats">
              <div className="mini-card pulse">
                <p className="nx-kicker">Catalog</p>
                <h2>{tools.length}</h2>
                <p className="nx-subtle">Tools listed</p>
              </div>
              <div className="mini-card pulse">
                <p className="nx-kicker">Featured</p>
                <h2>{featured.length}</h2>
                <p className="nx-subtle">Top picks</p>
              </div>
            </div>
          </header>

          <div className="floating-grid">
            <section className="floating-card neon-card panel-wide">
              <div className="panel-head">
                <h3>Search & Filter</h3>
                <span className="nx-subtle">Find the right tool fast</span>
              </div>
              <div className="vibe-grid">
                <label className="nx-field">
                  <span>Search</span>
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name or summary" />
                </label>
              </div>
            </section>

            {loading && <section className="floating-card neon-card panel-wide">Loading tools?</section>}

            {!loading && (
              <>
                <section className="floating-card neon-card panel-wide">
                  <div className="panel-head">
                    <h3>Featured</h3>
                    <span className="nx-subtle">Curated highlights</span>
                  </div>
                  <div className="store-grid">
                    {featured.map((tool) => (
                      <Link key={tool.id} to={`/marketplace/${tool.slug}`} className="store-card floating">
                        <div className="store-media">
                          {tool.media_url ? (
                            <video autoPlay loop muted playsInline src={tool.media_url} />
                          ) : (
                            <div className="store-icon">{tool.icon_url ? <img src={tool.icon_url} alt="" /> : "?"}</div>
                          )}
                        </div>
                        <div className="store-meta">
                          <h3>{tool.name}</h3>
                          <p className="nx-subtle">{tool.summary}</p>
                          <p className="price-tag">${tool.price_monthly ?? 99}/mo</p>
                        </div>
                      </Link>
                    ))}
                    {featured.length === 0 && <p className="nx-subtle">No matches yet.</p>}
                  </div>
                </section>

                <section className="floating-card neon-card panel-wide">
                  <div className="panel-head">
                    <h3>All Tools</h3>
                    <span className="nx-subtle">Everything in the catalog</span>
                  </div>
                  <div className="store-grid">
                    {more.map((tool) => (
                      <Link key={tool.id} to={`/marketplace/${tool.slug}`} className="store-card floating">
                        <div className="store-media">
                          {tool.media_url ? (
                            <video autoPlay loop muted playsInline src={tool.media_url} />
                          ) : (
                            <div className="store-icon">{tool.icon_url ? <img src={tool.icon_url} alt="" /> : "?"}</div>
                          )}
                        </div>
                        <div className="store-meta">
                          <h3>{tool.name}</h3>
                          <p className="nx-subtle">{tool.summary}</p>
                          <p className="price-tag">${tool.price_monthly ?? 99}/mo</p>
                        </div>
                      </Link>
                    ))}
                    {more.length === 0 && featured.length > 0 && <p className="nx-subtle">No more tools in this search.</p>}
                    {filtered.length === 0 && <p className="nx-subtle">No tools match that search.</p>}
                  </div>
                </section>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MarketplacePage;
