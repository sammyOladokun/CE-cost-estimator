import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../styles.css";

type Feature = { title?: string; copy?: string; icon?: string };

type Tool = {
  id: string;
  slug: string;
  name: string;
  summary: string;
  media_url?: string;
  price_monthly?: number;
  bento_features?: Feature[];
};

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

declare global {
  interface Window {
    nexWidget?: (config: { tenantId: string; apiBase?: string; toolSlug?: string; sandbox?: boolean }) => void;
  }
}

const ToolDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [tool, setTool] = useState<Tool | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const resp = await fetch(`${API_BASE}/api/marketplace/tools/${slug}`);
        if (!resp.ok) {
          throw new Error("Tool not found");
        }
        const data = await resp.json();
        setTool(data);
      } catch (err: any) {
        setError(err.message || "Unable to load tool");
      } finally {
        setLoading(false);
      }
    };
    if (slug) load();
  }, [slug]);

  const launchSandbox = () => {
    if (!tool) return;
    const tenantId = prompt("Enter tenant id for sandbox widget (or leave empty for preview):") || "";
    if (window.nexWidget) {
      window.nexWidget({
        tenantId,
        apiBase: API_BASE,
        toolSlug: tool.slug,
        sandbox: true,
      });
    } else {
      alert("Widget bundle not loaded");
    }
  };

  if (loading) return <p className="page-shell">Loading…</p>;
  if (error || !tool) return <p className="page-shell">Error: {error || "Not found"}</p>;

  return (
    <div className="page-shell">
      <button className="backlink" onClick={() => navigate(-1)}>
        ← Back to marketplace
      </button>
      <header className="tool-hero">
        <div>
          <p className="nx-kicker">Tool</p>
          <h1>{tool.name}</h1>
          <p className="nx-subtle">{tool.summary}</p>
          <div className="cta-row">
            <button className="nx-cta" onClick={launchSandbox}>
              Try it (sandbox)
            </button>
            <button className="nx-ghost">Get Started — ${tool.price_monthly ?? 99}/mo</button>
          </div>
        </div>
        <div className="hero-media">
          {tool.media_url ? (
            <video autoPlay loop muted playsInline src={tool.media_url} />
          ) : (
            <div className="store-icon">🛰</div>
          )}
        </div>
      </header>

      <section className="bento-grid">
        {(tool.bento_features || []).map((feat, idx) => (
          <div key={idx} className="bento-card">
            <p className="nx-kicker">{feat.icon || "◆"}</p>
            <h4>{feat.title}</h4>
            <p className="nx-subtle">{feat.copy}</p>
          </div>
        ))}
      </section>
    </div>
  );
};

export default ToolDetailPage;
