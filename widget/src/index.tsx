import React from "react";
import { createRoot } from "react-dom/client";
import { WidgetShell, type WidgetConfig } from "./widget";
import "./styles.css";

declare global {
  interface Window {
    nexWidget?: (config: WidgetConfig) => void;
  }
}

const createShadowHost = (hostId = "nex-widget-host") => {
  const existing = document.getElementById(hostId);
  if (existing) return existing;
  const host = document.createElement("div");
  host.id = hostId;
  document.body.appendChild(host);
  return host;
};

const resolveTarget = (target?: HTMLElement | string) => {
  if (!target) return null;
  if (typeof target === "string") {
    return document.querySelector(target) as HTMLElement | null;
  }
  return target;
};

export const mountWidget = (config: WidgetConfig) => {
  const targetEl = resolveTarget(config.target);
  const host = targetEl ?? createShadowHost();
  const shadowRoot = host.attachShadow({ mode: "open" });

  const container = document.createElement("div");
  shadowRoot.appendChild(container);

  const root = createRoot(container);
  root.render(<WidgetShell {...config} />);
};

// Expose global initializer for the single-line embed snippet.
window.nexWidget = mountWidget;
