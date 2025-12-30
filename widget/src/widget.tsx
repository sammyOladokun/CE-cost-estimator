import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

export type WidgetConfig = {
  tenantId: string;
  apiBase?: string;
  toolSlug?: string;
  sandbox?: boolean;
  target?: HTMLElement | string;
};

type WidgetTheme = {
  primary_color: string;
  secondary_color: string;
  theme: "frosted" | "smoked";
  logo_url?: string;
  mark_text?: string;
  marketing_hook?: string;
};

type Estimate = {
  ground_area: number;
  pitch: number;
  actual_area: number;
  estimate_amount: number;
  material_used?: string;
  rate_per_sqft?: number;
};

const defaultTheme: WidgetTheme = {
  primary_color: "#0A0F1A",
  secondary_color: "#1F6BFF",
  theme: "frosted",
  logo_url: "",
  mark_text: "neX",
  marketing_hook: "See Your Roof from Space & Get a Technical Estimate in 60 Seconds.",
};

const glassStyle: React.CSSProperties = {
  backdropFilter: "blur(20px)",
  background: "rgba(255, 255, 255, 0.16)",
  border: "1px solid rgba(255, 255, 255, 0.18)",
};

const calcActualArea = (ground: number, pitch: number) =>
  Math.round(ground * Math.sqrt((pitch / 12) ** 2 + 1) * 100) / 100;

const fetchJSON = async <T,>(url: string, options?: RequestInit): Promise<T> => {
  const resp = await fetch(url, options);
  if (!resp.ok) {
    throw new Error(`Request failed: ${resp.status}`);
  }
  return resp.json() as Promise<T>;
};

export const WidgetShell: React.FC<WidgetConfig> = ({
  tenantId,
  apiBase = "",
  toolSlug = "landmark",
  sandbox = false,
}) => {
  const base = apiBase || window.location.origin;
  const [theme, setTheme] = useState<WidgetTheme>(defaultTheme);
  const [address, setAddress] = useState("");
  const [pitch, setPitch] = useState(6);
  const [groundArea, setGroundArea] = useState(1400);
  const [showGate, setShowGate] = useState(false);
  const [lead, setLead] = useState({ full_name: "", email: "", phone: "" });
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hook, setHook] = useState(defaultTheme.marketing_hook || "");
  const [materials] = useState<string[]>(["Asphalt Shingle", "Metal Roof", "Tile"]);
  const [materialChoice, setMaterialChoice] = useState<string | null>(null);

  const derived = useMemo(() => {
    if (estimate) return estimate;
    const actual_area = calcActualArea(groundArea, pitch);
    return {
      ground_area: groundArea,
      pitch,
      actual_area,
      estimate_amount: Math.round(actual_area * 2.25 * 100) / 100,
    };
  }, [estimate, groundArea, pitch]);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const data = await fetchJSON<WidgetTheme>(`${base}/api/widget/config`, {
          headers: {
            "X-Tenant-ID": tenantId,
          },
        });
        setTheme(data);
        if (data.marketing_hook) {
          setHook(data.marketing_hook);
        } else {
          setHook(defaultTheme.marketing_hook || "");
        }
        document.documentElement.style.setProperty("--accent", data.secondary_color || defaultTheme.secondary_color);
        document.documentElement.style.setProperty("--secondary", data.primary_color || defaultTheme.primary_color);
      } catch {
        setTheme(defaultTheme);
        setHook(defaultTheme.marketing_hook || "");
      }
    };
    loadConfig();
  }, [base, tenantId]);

  const handleAddressSubmit = (evt: React.FormEvent) => {
    evt.preventDefault();
    setShowGate(true);
  };

  const submitLead = async (evt: React.FormEvent) => {
    evt.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await fetch(`${base}/api/leads/widget`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Tenant-ID": tenantId,
        },
        body: JSON.stringify({
          tool: toolSlug,
          full_name: lead.full_name,
          email: lead.email,
          phone: lead.phone,
          address,
          ground_area: groundArea,
          pitch,
          actual_area: calcActualArea(groundArea, pitch),
          source_url: window.location.href,
        }),
      });

      const pricing = await fetchJSON<Estimate>(
        `${base}/api/pricing/estimate?tool=${toolSlug}${sandbox ? "&sandbox=true" : ""}${materialChoice ? `&material=${encodeURIComponent(materialChoice)}` : ""}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Tenant-ID": tenantId,
          },
          body: JSON.stringify({
            ground_area: groundArea,
            pitch,
            rate_per_sqft: 2.25,
          }),
        },
      );
      setEstimate(pricing);
      setShowGate(false);
    } catch (err: any) {
      setError(err.message || "Unable to process request");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="nx-widget"
      style={{
        ["--accent" as string]: theme.secondary_color || defaultTheme.secondary_color,
        ["--secondary" as string]: theme.primary_color || defaultTheme.primary_color,
      }}
    >
      <header className="nx-header">
        <div>
          <p className="nx-kicker">neX Landmark Widget</p>
          <h3>{hook || "See Your Roof from Space & Get a Technical Estimate in 60 Seconds."}</h3>
        </div>
        <div className={`nx-pill ${sandbox ? "freemium" : "live"}`}>{sandbox ? "Sandbox mode" : "Live"}</div>
      </header>

      <section className="nx-block">
        <form className="nx-field" onSubmit={handleAddressSubmit}>
          <label>Enter Address</label>
          <input
            value={address}
            placeholder="123 Market St, San Francisco"
            onChange={(e) => setAddress(e.target.value)}
            required
          />
          <button className="nx-cta" type="submit">
            Explore
          </button>
        </form>
        <div className="nx-grid-3">
          <div className="nx-field">
            <label>Pitch</label>
            <div className="nx-toggle">
              {[4, 6, 8, 10, 12].map((p) => (
                <button key={p} className={p === pitch ? "active" : ""} onClick={() => setPitch(p)} type="button">
                  {p}/12
                </button>
              ))}
            </div>
          </div>
          <div className="nx-field">
            <label>Ground Area (sqft)</label>
            <input type="number" value={groundArea} onChange={(e) => setGroundArea(Number(e.target.value || 0))} />
          </div>
          <div className="nx-field">
            <label>Actual Area (calc)</label>
            <input value={derived.actual_area} readOnly />
          </div>
          <div className="nx-field">
            <label>Material</label>
            <select value={materialChoice || ""} onChange={(e) => setMaterialChoice(e.target.value || null)}>
              <option value="">Auto</option>
              {materials.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="nx-block">
        <div className="nx-grid-3">
          <div className="nx-card">
            <p className="nx-kicker">Estimate</p>
            <div className="nx-price">
              <span className="nx-digit-roller">${derived.estimate_amount.toLocaleString()}</span>
              <small>/project</small>
            </div>
            <p className="nx-subtle">
              Actual area {derived.actual_area} sqft • Pitch {derived.pitch}/12
            </p>
            {estimate?.material_used && (
              <p className="nx-subtle small">
                Material: {estimate.material_used} @ ${estimate.rate_per_sqft?.toFixed(2) || "—"}/sqft
              </p>
            )}
          </div>
          <div className="nx-card">
            <p className="nx-kicker">Status</p>
            <p className="nx-subtle">{sandbox ? "Sandbox preview" : "Licensed access check"}</p>
          </div>
        </div>
        <p className="nx-lock">Lead capture is required before showing results.</p>
      </section>

      {showGate &&
        createPortal(
          <div className="gate-overlay">
            <div className="gate-panel" style={glassStyle}>
              <p className="nx-kicker">Verify to view estimate</p>
              <h3>Enter your details to unlock the calculator</h3>
              <form className="gate-form" onSubmit={submitLead}>
                <input
                  placeholder="Full Name"
                  value={lead.full_name}
                  onChange={(e) => setLead((prev) => ({ ...prev, full_name: e.target.value }))}
                  required
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={lead.email}
                  onChange={(e) => setLead((prev) => ({ ...prev, email: e.target.value }))}
                  required
                />
                <input
                  placeholder="Phone Number"
                  value={lead.phone}
                  onChange={(e) => setLead((prev) => ({ ...prev, phone: e.target.value }))}
                  required
                />
                <button type="submit" disabled={busy}>
                  {busy ? "Submitting..." : "Submit to View Estimate"}
                </button>
                {error && <p className="error">{error}</p>}
              </form>
              <p className="watermark">{theme.mark_text || "neX"}</p>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};
