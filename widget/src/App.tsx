import React, { useMemo, useState } from "react";
import "./styles.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

type LeadPayload = {
  full_name: string;
  email: string;
  phone: string;
  address: string;
};

type Estimate = {
  ground_area: number;
  pitch: number;
  actual_area: number;
  estimate_amount: number;
};

const glassStyles = {
  background: "rgba(255, 255, 255, 0.08)",
  backdropFilter: "blur(20px)",
  border: "1px solid rgba(255,255,255,0.12)",
};

const priceFromArea = (actualArea: number, rate = 2.25) =>
  Math.round(actualArea * rate * 100) / 100;

const App: React.FC = () => {
  const [address, setAddress] = useState("");
  const [showGate, setShowGate] = useState(false);
  const [lead, setLead] = useState<LeadPayload>({
    full_name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [pitch, setPitch] = useState(6);
  const [groundArea, setGroundArea] = useState(1400);
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const heroPlaceholder = "Enter address to test the AI";

  const derivedEstimate = useMemo(() => {
    if (estimate) return estimate;
    const actual_area = Math.round(groundArea * Math.sqrt((pitch / 12) ** 2 + 1) * 100) / 100;
    return {
      ground_area: groundArea,
      pitch,
      actual_area,
      estimate_amount: priceFromArea(actual_area),
    };
  }, [estimate, groundArea, pitch]);

  const handleHeroSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowGate(true);
    setLead((prev) => ({ ...prev, address }));
  };

  const submitLead = async (evt: React.FormEvent) => {
    evt.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await fetch(`${API_BASE}/api/leads/marketplace`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...lead, address, source: "landing" }),
      });
      const resp = await fetch(`${API_BASE}/api/pricing/estimate?sandbox=true`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: "landmark",
          ground_area: groundArea,
          pitch,
          rate_per_sqft: 2.25,
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        setEstimate(data);
      }
      setShowGate(false);
    } catch (err: any) {
      setError(err.message || "Unable to submit lead");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="landing-shell">
      <header className="landing-hero">
        <div className="hero-copy">
          <p className="nx-kicker">neXdigitals.agency</p>
          <h1>See Your Roof from Space &amp; Price It in 60 Seconds</h1>
          <p className="nx-subtle">
            Gated demo flow: capture the lead before revealing the satellite view + estimate.
          </p>
        </div>
        <form className="hero-bar" onSubmit={handleHeroSubmit} style={glassStyles}>
          <input
            aria-label="address"
            placeholder={heroPlaceholder}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
          />
          <button type="submit">Test the AI</button>
        </form>
        {error && <p className="error">{error}</p>}
      </header>

      <section className="demo-preview" style={glassStyles}>
        <div>
          <p className="nx-kicker">Preview</p>
          <h3>Glassmorphic pop-up with satellite view + price</h3>
          <p className="nx-subtle">
            This preview uses sandbox mode until a license is active. Data reveals only after the form.
          </p>
          <div className="controls">
            <label>
              Pitch: {pitch}/12
              <input
                type="range"
                min={2}
                max={14}
                value={pitch}
                onChange={(e) => setPitch(Number(e.target.value))}
              />
            </label>
            <label>
              Ground Area (sqft)
              <input
                type="number"
                value={groundArea}
                onChange={(e) => setGroundArea(Number(e.target.value || 0))}
              />
            </label>
          </div>
        </div>
        <div className="estimate-card" style={glassStyles}>
          <div className="satellite" />
          <div className="estimate-meta">
            <p className="nx-kicker">Estimate</p>
            <h2>${derivedEstimate.estimate_amount.toLocaleString()}</h2>
            <p className="nx-subtle">
              Actual area: {derivedEstimate.actual_area} sqft • Pitch {derivedEstimate.pitch}/12
            </p>
          </div>
        </div>
      </section>

      {showGate && (
        <div className="gate-overlay">
          <div className="gate-panel" style={glassStyles}>
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
              <button type="submit" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit to View Estimate"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
