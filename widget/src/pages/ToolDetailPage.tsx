import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import "../styles.css";
import { useAuth } from "../context/AuthContext";
import { API_BASE } from "../utils/api";

type Tool = {
  id: string;
  slug: string;
  name: string;
  summary: string;
  icon_url?: string;
  media_url?: string;
  price_monthly?: number;
  bento_features?: string[] | null;
  coupon_code?: string;
  coupon_percent_off?: number;
  coupon_start?: string;
  coupon_end?: string;
  coupon_usage_limit?: number;
  coupon_usage_count?: number;
};

type OnboardingResponse = {
  tenant_id: string;
  license_id: string;
  status: string;
  payment_url: string;
};

const DEMO_TENANT_ID = import.meta.env.VITE_DEMO_TENANT_ID || "";

declare global {
  interface Window {
    nexWidget?: (config: { tenantId: string; apiBase?: string; sandbox?: boolean }) => void;
  }
}

const ToolDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user, openAuth, withAuthHeaders, handleAuthError } = useAuth();
  const [tool, setTool] = useState<Tool | null>(null);
  const [loading, setLoading] = useState(true);
  const [licenseStatus, setLicenseStatus] = useState<"unknown" | "none" | "pending" | "active">("unknown");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [tenantName, setTenantName] = useState("");
  const [fullName, setFullName] = useState("");
  const [couponCode, setCouponCode] = useState("");

  useEffect(() => {
    const load = async () => {
      if (!slug) return;
      setLoading(true);
      try {
        const resp = await fetch(`${API_BASE}/api/marketplace/tools/${slug}`);
        if (!resp.ok) throw new Error("Unable to load tool");
        const data = await resp.json();
        setTool(data);
        if (data.coupon_code) setCouponCode(data.coupon_code);
      } catch (err: any) {
        setStatusMessage(err.message || "Failed to load tool");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug]);

  const checkLicense = useCallback(async () => {
    if (!user || !slug) return;
    try {
      const resp = await fetch(`${API_BASE}/api/license/check?tool=${slug}`, {
        headers: withAuthHeaders(),
        credentials: "include",
      });
      if (resp.status === 401) {
        handleAuthError({ code: 401 });
        return;
      }
      const data = await resp.json();
      setLicenseStatus(data.licensed ? "active" : "none");
    } catch (err) {
      setLicenseStatus("none");
    }
  }, [handleAuthError, slug, user, withAuthHeaders]);

  useEffect(() => {
    if (user) checkLicense();
  }, [user, checkLicense]);

  useEffect(() => {
    if (licenseStatus !== "pending") return;
    const id = setInterval(() => {
      checkLicense();
    }, 5000);
    return () => clearInterval(id);
  }, [licenseStatus, checkLicense]);

  const discount = useMemo(() => {
    if (!tool || !tool.coupon_code || !tool.coupon_percent_off) return null;
    const today = new Date();
    if (tool.coupon_start && new Date(tool.coupon_start) > today) return null;
    if (tool.coupon_end && new Date(tool.coupon_end) < today) return null;
    if (tool.coupon_usage_limit && (tool.coupon_usage_count || 0) >= tool.coupon_usage_limit) return null;
    const discounted = (tool.price_monthly || 0) * (1 - tool.coupon_percent_off / 100);
    return { code: tool.coupon_code, percent: tool.coupon_percent_off, amount: discounted };
  }, [tool]);

  const launchWidget = () => {
    if (!tool) return;
    if (!user) {
      openAuth();
      return;
    }
    const tenantId = user.tenant_id || DEMO_TENANT_ID;
    if (!tenantId) {
      setStatusMessage("Tenant ID missing for widget preview.");
      return;
    }
    if (typeof window !== "undefined" && window.nexWidget) {
      window.nexWidget({
        tenantId,
        apiBase: API_BASE,
        sandbox: licenseStatus !== "active",
      });
    } else {
      setStatusMessage("Widget bundle not loaded. Build the widget or include the bundle script.");
    }
  };

  const startOnboarding = async () => {
    if (!tool || !slug) return;
    if (!user) {
      openAuth();
      return;
    }
    setStarting(true);
    setStatusMessage(null);
    try {
      const body: Record<string, any> = {
        tool: slug,
        email: user.email,
        coupon_code: couponCode || undefined,
      };
      if (user.tenant_id) {
        body.existing_tenant_id = user.tenant_id;
      } else {
        body.tenant_name = tenantName || `${user.email.split("@")[0]}-contractor`;
        body.full_name = fullName || user.full_name || user.email;
      }
      const resp = await fetch(`${API_BASE}/api/onboarding/start`, {
        method: "POST",
        headers: withAuthHeaders({ "Content-Type": "application/json" }),
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (resp.status === 401) {
        handleAuthError({ code: 401 });
        return;
      }
      const data: OnboardingResponse | any = await resp.json();
      if (!resp.ok) throw new Error(data.detail || "Unable to start checkout");
      setPaymentUrl(data.payment_url);
      setLicenseStatus(data.status || "pending");
      setStatusMessage("Checkout link created. Complete payment to activate your license.");
      if (data.payment_url) window.open(data.payment_url, "_blank");
    } catch (err: any) {
      setStatusMessage(err.message || "Unable to start onboarding");
    } finally {
      setStarting(false);
    }
  };

  const bentoItems = useMemo(() => {
    if (!tool?.bento_features) return [];
    if (Array.isArray(tool.bento_features)) return tool.bento_features;
    return [];
  }, [tool]);

  if (loading) {
    return (
      <div className="page-shell">
        <p>Loading tool…</p>
      </div>
    );
  }

  if (!tool) {
    return (
      <div className="page-shell">
        <p className="error">Tool not found.</p>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <header className="page-header">
        <div>
          <p className="nx-kicker">Tool</p>
          <h1>{tool.name}</h1>
          <p className="nx-subtle">{tool.summary}</p>
          {discount ? (
            <p className="price-tag">
              ${discount.amount.toFixed(2)} /mo <span className="nx-subtle">({tool.price_monthly ?? 99} before discount)</span>
            </p>
          ) : (
            <p className="price-tag">${tool.price_monthly ?? 99}/mo</p>
          )}
          {discount && (
            <p className="nx-subtle">
              Coupon {discount.code} — {discount.percent}% off (while active)
            </p>
          )}
        </div>
        <div className="hero-media">
          {tool.media_url ? (
            <video autoPlay loop muted playsInline src={tool.media_url} />
          ) : tool.icon_url ? (
            <img src={tool.icon_url} alt={tool.name} />
          ) : (
            <div className="store-icon">Tool</div>
          )}
        </div>
      </header>

      <div className="cta-row">
        <button className="nx-cta" onClick={startOnboarding} disabled={starting || licenseStatus === "active"}>
          {licenseStatus === "active" ? "License Active" : starting ? "Starting…" : "Get Started"}
        </button>
        <button className="nx-ghost" onClick={launchWidget}>
          {licenseStatus === "active" ? "Launch Tool" : "Try it (sandbox)"}
        </button>
      </div>

      <div className="card-grid">
        <div className="card">
          <h3>Checkout</h3>
          <p className="nx-subtle">Apply a coupon and kick off payment.</p>
          <label className="nx-label">Coupon code</label>
          <input value={couponCode} onChange={(e) => setCouponCode(e.target.value)} placeholder="Optional" />
          {!user?.tenant_id && (
            <>
              <label className="nx-label">Tenant / Company</label>
              <input value={tenantName} onChange={(e) => setTenantName(e.target.value)} placeholder="Your company name" />
              <label className="nx-label">Full name</label>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" />
            </>
          )}
          {paymentUrl && (
            <div className="nx-subtle" style={{ marginTop: 8 }}>
              Payment link ready. <a href={paymentUrl} target="_blank" rel="noreferrer">Open checkout</a>
            </div>
          )}
          {statusMessage && <p className="info">{statusMessage}</p>}
          {licenseStatus === "pending" && <p className="nx-subtle">Waiting for payment confirmation…</p>}
          {licenseStatus === "active" && <p className="nx-success">License active for this tool.</p>}
        </div>

        <div className="card">
          <h3>Bento Features</h3>
          <div className="bento-grid">
            {bentoItems.length === 0 && <p className="nx-subtle">No features listed.</p>}
            {bentoItems.map((item, idx) => (
              <div key={idx} className="bento-tile">
                <p>{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ToolDetailPage;
