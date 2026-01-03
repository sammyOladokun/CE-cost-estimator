import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, CreditCardSlash, MapPinLine, ShieldCheck } from "@phosphor-icons/react";

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
  const [projectType, setProjectType] = useState<"full" | "repair">("full");
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
      className="nx-widget nx-neo-shell"
      style={{
        ["--accent" as string]: theme.secondary_color || defaultTheme.secondary_color,
        ["--secondary" as string]: theme.primary_color || defaultTheme.primary_color,
      }}
    >
      <div className="nx-ambient">
        <div className="nx-blob blob-one" />
        <div className="nx-blob blob-two" />
        <div className="nx-grid-overlay" />
      </div>

      <div className="nx-neo-card">
        <div className="nx-neo-gradient" />
        <div className="nx-neo-body">
          <div className="nx-neo-heading">
            <h1>How much will your new roof cost?</h1>
            <p>{hook || "Enter your address to generate a smart satellite estimate instantly."}</p>
          </div>

          <form className="nx-neo-form" onSubmit={handleAddressSubmit}>
            <label className="nx-neo-label">Property Address</label>
            <div className="nx-neo-input">
              <input
                value={address}
                placeholder="Enter your street address..."
                onChange={(e) => setAddress(e.target.value)}
                required
              />
              <MapPinLine size={22} weight="duotone" className="nx-neo-icon" />
            </div>

            <label className="nx-neo-label">Project Type</label>
            <div className="nx-neo-segmented">
              {[
                { key: "full" as const, label: "Full Replacement" },
                { key: "repair" as const, label: "Partial Repair" },
              ].map((option) => (
                <button
                  key={option.key}
                  type="button"
                  className={`nx-neo-segment ${projectType === option.key ? "active" : ""}`}
                  onClick={() => setProjectType(option.key)}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="nx-neo-spec-grid">
              <div className="nx-neo-spec">
                <span className="nx-neo-spec-label">Pitch</span>
                <div className="nx-neo-pills">
                  {[4, 6, 8, 10, 12].map((p) => (
                    <button
                      key={p}
                      type="button"
                      className={`nx-neo-pill ${p === pitch ? "active" : ""}`}
                      onClick={() => setPitch(p)}
                    >
                      {p}/12
                    </button>
                  ))}
                </div>
              </div>
              <div className="nx-neo-spec">
                <span className="nx-neo-spec-label">Ground Area (sqft)</span>
                <input
                  className="nx-neo-spec-input"
                  type="number"
                  value={groundArea}
                  onChange={(e) => setGroundArea(Number(e.target.value || 0))}
                  min={0}
                />
              </div>
              <div className="nx-neo-spec">
                <span className="nx-neo-spec-label">Material</span>
                <select
                  className="nx-neo-spec-input"
                  value={materialChoice || ""}
                  onChange={(e) => setMaterialChoice(e.target.value || null)}
                >
                  <option value="">Auto</option>
                  {materials.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button className="nx-neo-cta" type="submit">
              <span>Get My Free Estimate</span>
              <ArrowRight size={18} weight="duotone" />
            </button>
          </form>

          <div className="nx-neo-meta">
            <div className="nx-neo-meta-item">
              <ShieldCheck size={18} weight="duotone" className="nx-neo-meta-icon" />
              <span>SSL Secure</span>
            </div>
            <span className="nx-neo-dot" />
            <div className="nx-neo-meta-item">
              <CreditCardSlash size={18} weight="duotone" className="nx-neo-meta-icon" />
              <span>No credit card required</span>
            </div>
          </div>
          <p className="nx-neo-trust">Trusted by 5,000+ Homeowners across the country</p>
        </div>
      </div>

      <div className="nx-neo-summary">
        <div className="nx-summary-head">
          <div>
            <p className="nx-kicker">Estimate preview</p>
            <h4>Personalize and capture the lead to unlock live pricing.</h4>
          </div>
          <span className={`nx-pill ${sandbox ? "freemium" : "live"}`}>{sandbox ? "Sandbox mode" : "Live mode"}</span>
        </div>
        <div className="nx-summary-grid">
          <div className="nx-summary-card">
            <p className="nx-subtle">Project estimate</p>
            <div className="nx-summary-value">
              ${derived.estimate_amount.toLocaleString()}
              <small>/project</small>
            </div>
            <p className="nx-subtle small">Auto-calculated from pitch and area.</p>
          </div>
          <div className="nx-summary-card">
            <p className="nx-subtle">Actual area</p>
            <div className="nx-summary-value">{derived.actual_area} sqft</div>
            <p className="nx-subtle small">Pitch {derived.pitch}/12 - Ground {groundArea} sqft</p>
          </div>
          <div className="nx-summary-card">
            <p className="nx-subtle">Material</p>
            <div className="nx-summary-value">{estimate?.material_used || materialChoice || "Auto"}</div>
            {estimate?.rate_per_sqft && (
              <p className="nx-subtle small">@ ${estimate.rate_per_sqft.toFixed(2)} / sqft</p>
            )}
          </div>
        </div>
      </div>
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
