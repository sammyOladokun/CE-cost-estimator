import React, { useMemo, useState } from "react";

export type WidgetConfig = {
  contractorId: string;
  apiBase?: string;
  accent?: string;
  secondary?: string;
  subscriptionStatus?: "freemium" | "standard" | "pro";
};

type RoofType = "gable" | "hip" | "flat";

const roofTypeLabels: Record<RoofType, string> = {
  gable: "Gable",
  hip: "Hip",
  flat: "Flat",
};

const tiers = [
  { key: "good", label: "Good" },
  { key: "better", label: "Better" },
  { key: "best", label: "Best" },
] as const;

export const WidgetShell: React.FC<WidgetConfig> = ({
  contractorId,
  accent = "#4a1f1f",
  secondary = "#13071f",
  subscriptionStatus = "freemium",
}) => {
  const [address, setAddress] = useState("");
  const [zip, setZip] = useState("");
  const [roofType, setRoofType] = useState<RoofType>("gable");
  const [pitch, setPitch] = useState<number>(6);
  const [baseArea, setBaseArea] = useState<number>(1200);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [locked, setLocked] = useState(true);

  const rollingPrices = useMemo(() => {
    const factor = 1 + pitch / 12;
    return tiers.map(({ key }) => ({
      key,
      value: Math.round((baseArea * factor * 1.15) / 100) * 100,
    }));
  }, [baseArea, pitch]);

  const handleLeadSubmit = (evt: React.FormEvent) => {
    evt.preventDefault();
    setLocked(false);
  };

  return (
    <div className="nx-widget" style={{ ["--accent" as string]: accent, ["--secondary" as string]: secondary }}>
      <header className="nx-header">
        <div>
          <p className="nx-kicker">Instant Roof Quote • Manual Fallback</p>
          <h3>Powered by your contractor #{contractorId}</h3>
        </div>
        <div className={`nx-pill ${subscriptionStatus}`}>
          {subscriptionStatus === "freemium" ? "Freemium preview" : "Live"}
        </div>
      </header>

      <section className="nx-block">
        <div className="nx-field">
          <label>Address</label>
          <input
            value={address}
            placeholder="123 Market St"
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>
        <div className="nx-grid-3">
          <div className="nx-field">
            <label>ZIP</label>
            <input value={zip} onChange={(e) => setZip(e.target.value)} placeholder="94107" />
          </div>
          <div className="nx-field">
            <label>Pitch</label>
            <div className="nx-toggle">
              {[4, 6, 8, 10, 12].map((p) => (
                <button
                  key={p}
                  className={p === pitch ? "active" : ""}
                  onClick={() => setPitch(p)}
                  type="button"
                >
                  {p}/12
                </button>
              ))}
            </div>
          </div>
          <div className="nx-field">
            <label>Base Area (sqft)</label>
            <input
              type="number"
              value={baseArea}
              onChange={(e) => setBaseArea(Number(e.target.value || 0))}
            />
          </div>
        </div>
        <div className="nx-roof-types">
          {(["gable", "hip", "flat"] as RoofType[]).map((type) => (
            <button
              key={type}
              type="button"
              className={type === roofType ? "active" : ""}
              onClick={() => setRoofType(type)}
            >
              <span className="nx-icon" aria-hidden>
                {type === "flat" ? "▭" : type === "hip" ? "⟁" : "⧉"}
              </span>
              {roofTypeLabels[type]}
            </button>
          ))}
        </div>
      </section>

      <section className="nx-block">
        <div className="nx-grid-3">
          {rollingPrices.map(({ key, value }) => (
            <div key={key} className="nx-card">
              <p className="nx-kicker">{key === "good" ? "Good" : key === "better" ? "Better" : "Best"}</p>
              <div className="nx-price">
                <span className="nx-digit-roller">${value.toLocaleString()}</span>
                <small>/project est.</small>
              </div>
              <p className="nx-subtle">Includes materials + labor estimate in manual mode.</p>
              <button className="nx-cta" type="button" disabled={locked}>
                Save &amp; Send
              </button>
            </div>
          ))}
        </div>
        {locked && <p className="nx-lock">Submit details to unlock your quote.</p>}
      </section>

      <section className="nx-block">
        <form className="nx-grid-3" onSubmit={handleLeadSubmit}>
          <div className="nx-field">
            <label>Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="nx-field">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="nx-field">
            <label>Phone</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} required />
          </div>
          <div className="nx-field nx-full">
            <button className="nx-cta" type="submit">
              Unlock &amp; Request Callback
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};
