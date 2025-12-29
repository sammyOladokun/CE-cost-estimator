import React, { useEffect, useState } from "react";
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
  coupon_code?: string;
  coupon_percent_off?: number;
  coupon_start?: string;
  coupon_end?: string;
  coupon_usage_limit?: number;
  coupon_usage_count?: number;
};

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

const MarketplacePage: React.FC = () => {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);

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

  const discountInfo = (tool: Tool) => {
    if (!tool.coupon_code || !tool.coupon_percent_off) return null;
    const today = new Date();
    if (tool.coupon_start && new Date(tool.coupon_start) > today) return null;
    if (tool.coupon_end && new Date(tool.coupon_end) < today) return null;
    if (tool.coupon_usage_limit && (tool.coupon_usage_count || 0) >= tool.coupon_usage_limit) return null;
    const discounted = (tool.price_monthly || 0) * (1 - tool.coupon_percent_off / 100);
    return { code: tool.coupon_code, percent: tool.coupon_percent_off, discounted };
  };

  return (
    <div className="page-shell">
      <header className="page-header">
        <div>
          <p className="nx-kicker">Marketplace</p>
          <h1>neX Multi-Tool Store</h1>
          <p className="nx-subtle">Browse installable tools. Hover for motion; click for Bento details.</p>
        </div>
      </header>

      {loading ? (
        <p>Loading tools...</p>
      ) : (
        <div className="store-grid">
          {tools.map((tool) => {
            const discount = discountInfo(tool);
            return (
              <Link key={tool.id} to={`/marketplace/${tool.slug}`} className="store-card">
                <div className="store-media">
                  {tool.media_url ? (
                    <video autoPlay loop muted playsInline src={tool.media_url} />
                  ) : (
                    <div className="store-icon">{tool.icon_url ? <img src={tool.icon_url} alt="" /> : "◎"}</div>
                  )}
                </div>
                <div className="store-meta">
                  <h3>{tool.name}</h3>
                  <p className="nx-subtle">{tool.summary}</p>
                  {discount ? (
                    <p className="price-tag">
                      ${discount.discounted.toFixed(2)} /mo{" "}
                      <span className="nx-subtle">
                        ({tool.price_monthly ?? 99} before {discount.percent}% off)
                      </span>
                    </p>
                  ) : (
                    <p className="price-tag">${tool.price_monthly ?? 99}/mo</p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MarketplacePage;
