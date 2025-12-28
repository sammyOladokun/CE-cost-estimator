import React from "react";
import { createRoot } from "react-dom/client";
import { WidgetShell, type WidgetConfig } from "./widget";
import "./styles.css";

declare global {
  interface Window {
    RoofQuoteWidget?: (config: WidgetConfig) => void;
  }
}

const createShadowHost = () => {
  const existing = document.getElementById("roof-quote-widget-host");
  if (existing) return existing;
  const host = document.createElement("div");
  host.id = "roof-quote-widget-host";
  document.body.appendChild(host);
  return host;
};

export const mountWidget = (config: WidgetConfig) => {
  const host = createShadowHost();
  const shadowRoot = host.attachShadow({ mode: "open" });

  const container = document.createElement("div");
  shadowRoot.appendChild(container);

  const root = createRoot(container);
  root.render(<WidgetShell {...config} />);
};

// Expose global initializer for the single-line embed snippet.
window.RoofQuoteWidget = mountWidget;
