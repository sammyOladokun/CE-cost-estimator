import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowRight,
  Brain,
  Calculator,
  ChartLine,
  ChartLineUp,
  Code,
  CurrencyCircleDollar,
  DeviceMobile,
  GitBranch,
  HandPointing,
  HouseLine,
  Lightning,
  MagnifyingGlass,
  MapPinLine,
  Planet,
  ShieldCheck,
  SlidersHorizontal,
  SquaresFour,
  Waves,
  CaretLeft,
  TrendUp,
} from "@phosphor-icons/react";
import "../styles.css";
import { useAuth } from "../context/AuthContext";

type Feature = { title?: string; copy?: string; icon?: string };
type Tool = { id: string; slug: string; name: string; summary: string; media_url?: string; price_monthly?: number; bento_features?: Feature[] };

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";
const DEMO_TENANT_ID = import.meta.env.VITE_DEMO_TENANT_ID || "";

declare global {
  interface Window {
    nexWidget?: (config: { tenantId: string; apiBase?: string; toolSlug?: string; sandbox?: boolean }) => void;
  }
}

const avatarUrls = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDNmfMvwlc2HsrmqO8dc4dTBCcnU-i_VnPWjs8V-gRk7HLNHRGvFaJsFaG69YFW2p41-5ItWsPLQxNgAyp2RtDaGatL8J8bjxO0i3qIA5eVnj87CvOuRUjhaNpJyFYrbv2qxKiDGyYJ4E-gmxEb2JFS2bfWOVtSRaGRbvmjZ21SeEYZf4VSRoiQhfX0v9v1yYuS8DA8ijjatoMQAEVufDvnE4raSeq39b_G7kq7-63HNJIyY6zeU22rmzu1UeNOQK3GkvJATuVxaVWw",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuC4oBxte5y2o7gUhjsAvtvj2wSnzhROIibVVcAtqJlsklUVsK0t24zVTN1jcnYxEoJY6V-1CwBraCfhFxc7lUNsiuML35g0l5dckldRjNeV7GjHpizp1V1ru_XDADW6-Qz9lgmVFwqQesuyQb6cbGm0ZNrVvn06D_Z85JEO4EcuShdPIbsr4c3BxpD89OWzVI_6Ej7PJ9X_SX14Azi0mkdre9yfAQ4TSw69UrAsgvrT7IF7pnQcPXFbn8caVTOCHcFAHqyVthE3110W",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuC5bJVmwgHI0c5aFRMoZhLpEJhJP4PS-nqVFBv2ZZ5gCO4rj7eJp5V0W7Zh7ntWuNIrK89ssJOBOEXnJ6N1NgaxGYYJW8JBlR8e-mIZKYU-eoPJ9NgWc8XgPiENFSPRDbCNSEkkU7OSgkq7Nj1ktiNXE_QEIoMJCzq7u3GWWfxTftew0iTG_SYmPMP4CBeXwOXU5dTQuQ7Z2Ype4gl3GmgFYzC30nsqsz4HD6j-Rg85_rYFkfT92nB_WJTWrUQ_IIuIX1Rc2E5Wbe9Z",
];

const glassStyle = { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(24px) saturate(1.8)" } as const;

const ToolDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, openAuth } = useAuth();
  const [tool, setTool] = useState<Tool | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOnboard, setShowOnboard] = useState(false);
  const [existing, setExisting] = useState(false);
  const [tenantName, setTenantName] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tenantId, setTenantId] = useState(DEMO_TENANT_ID);
  const [saving, setSaving] = useState(false);
  const [onboardError, setOnboardError] = useState<string | null>(null);

  const features: Feature[] = useMemo(
    () =>
      tool?.bento_features?.length
        ? tool.bento_features
        : [
            { title: "AI Roof Detection", copy: "Auto-calculate surface area from satellite imagery with high accuracy." },
            { title: "Material Customization", copy: "Price asphalt, metal, or tile instantly with live updates." },
            { title: "CRM Integration", copy: "Push captured leads to HubSpot, Salesforce, or Jobber automatically." },
            { title: "Responsive Widget", copy: "Works perfectly on mobile, tablet, and desktop." },
            { title: "Analytics Dashboard", copy: "Track estimates, conversion, and popular materials." },
            { title: "Custom Branding", copy: "Match the calculator to your site for a white-label experience." },
          ],
    [tool?.bento_features],
  );

  useEffect(() => {
    const load = async () => {
      try {
        const resp = await fetch(`${API_BASE}/api/marketplace/tools/${slug}`);
        if (!resp.ok) throw new Error("Tool not found");
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

  const ensureWidget = async () => {
    if (typeof window !== "undefined" && !window.nexWidget) {
      await import("../index");
    }
  };

  const launchSandbox = async () => {
    if (!tool) return;
    if (!user) {
      openAuth();
      return;
    }
    await ensureWidget();
    const tenantPrompt = user.tenant_id || DEMO_TENANT_ID || prompt("Enter tenant id for sandbox widget:") || "";
    window.nexWidget?.({ tenantId: tenantPrompt, apiBase: API_BASE, toolSlug: tool.slug, sandbox: true }) ?? alert("Widget bundle not loaded");
  };

  const startOnboarding = async () => {
    if (!tool) return;
    if (!user && !existing) {
      openAuth();
      return;
    }
    setSaving(true);
    setOnboardError(null);
    try {
      const payload: Record<string, any> = { tool: tool.slug, email: user?.email || email };
      if (user && user.tenant_id) payload.existing_tenant_id = user.tenant_id;
      else if (existing) payload.existing_tenant_id = tenantId;
      else {
        payload.tenant_name = tenantName;
        payload.full_name = fullName || user?.full_name;
        payload.password = password;
      }
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (user?.token) headers["Authorization"] = `Token ${user.token}`;
      const resp = await fetch(`${API_BASE}/api/onboarding/start`, { method: "POST", headers, body: JSON.stringify(payload) });
      if (!resp.ok) throw new Error((await resp.json()).detail || "Unable to start onboarding");
      const data = await resp.json();
      const pay = data.payment_url as string;
      if (pay) window.location.href = pay;
      else alert("Onboarding started. License created.");
    } catch (err: any) {
      setOnboardError(err.message || "Unable to start onboarding");
    } finally {
      setSaving(false);
    }
  };

  const handleEmbed = async () => {
    if (!user) {
      openAuth();
      return;
    }
    navigate(`/tenant/tools/${slug}`);
  };

  if (loading) return <p className="page-shell">Loading...</p>;
  if (error || !tool) return <p className="page-shell">Error: {error || "Not found"}</p>;

  const stats = [
    { label: "Lead Capture Increase", value: "30%", tag: "+15% vs industry avg", icon: <TrendUp size={24} weight="duotone" className="text-green-400" />, tagClass: "text-green-400 bg-green-400/10" },
    { label: "Quote Generation Speed", value: "Instant", tag: "Real-time calculation", icon: <Lightning size={24} weight="duotone" className="text-cyan-300" />, tagClass: "text-slate-400 bg-white/5" },
    { label: "Contractor Trust", value: "500+", tag: "Active Installations", icon: <ShieldCheck size={24} weight="duotone" className="text-purple-400" />, tagClass: "text-purple-300 bg-purple-500/10" },
  ];

  const workflow = [
    { title: "Visitor Input", copy: "Enters address & info", icon: HandPointing, ring: "border-white/10 bg-white/5", glow: "shadow-[0_0_30px_rgba(255,255,255,0.15)]" },
    { title: "Smart Calculation", copy: "AI measures & prices", icon: Brain, ring: "border-purple-400/40 bg-purple-500/10", glow: "shadow-[0_0_30px_rgba(124,58,237,0.35)]" },
    { title: "CRM Sync", copy: "Data sent to your tools", icon: GitBranch, ring: "border-cyan-300/40 bg-cyan-400/10", glow: "shadow-[0_0_30px_rgba(6,182,212,0.35)]" },
    { title: "Lead Closed", copy: "Sales team follows up", icon: CurrencyCircleDollar, ring: "border-green-400/40 bg-green-400/10", glow: "shadow-[0_0_30px_rgba(74,222,128,0.35)]" },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0B0B0F] text-white">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full bg-purple-600/15 blur-[140px]" />
        <div className="absolute -right-60 bottom-0 h-[460px] w-[460px] rounded-full bg-cyan-400/15 blur-[140px]" />
        <div className="absolute left-1/2 top-1/2 h-[780px] w-[780px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-500/10 blur-[180px]" />
      </div>

      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0B0B0F]/70 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-8">
            <button onClick={() => navigate("/")} className="flex items-center gap-3 rounded-full px-2 py-1 text-white transition hover:opacity-90">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-cyan-400 text-white shadow-[0_0_18px_rgba(124,58,237,0.45)]">
                <HouseLine size={18} weight="duotone" />
              </div>
              <span className="text-lg font-semibold tracking-tight">SaaS Market</span>
            </button>
            <nav className="hidden items-center gap-6 text-sm font-semibold text-slate-300 md:flex">
              <button onClick={() => navigate("/marketplace")} className="transition hover:text-white">
                Marketplace
              </button>
              <button className="text-white">Tools</button>
              <button className="transition hover:text-white">Integrations</button>
              <button className="transition hover:text-white">Pricing</button>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative hidden sm:block">
              <MagnifyingGlass size={18} weight="duotone" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                placeholder="search tools.."
                className="h-10 w-64 rounded-full border border-white/10 bg-white/5 px-4 pl-10 text-sm text-white placeholder:text-slate-500 backdrop-blur-md transition focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
              />
            </div>
            {user ? (
              <div title={user.email} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-sm font-semibold uppercase">
                {user.full_name?.[0] || user.email?.[0]}
              </div>
            ) : (
              <button onClick={openAuth} className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-slate-200">
                Log In
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10">
        <section className="pt-6 pb-16 lg:pt-10 lg:pb-24">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
                  <ShieldCheck size={16} weight="duotone" />
                  Top Rated Tool
                </div>
                <h1 className="text-4xl font-black leading-[1.05] text-white sm:text-5xl lg:text-6xl">
                  Capture Leads 24/7 with the{" "}
                  <span className="bg-gradient-to-r from-purple-500 to-cyan-400 bg-clip-text text-transparent">Smart Estimator</span>
                </h1>
                <p className="max-w-xl text-lg text-slate-400">
                  {tool.summary ||
                    "Embed the industry's most accurate estimator on your site. Turn traffic into qualified appointments instantly with AI-powered estimates and seamless CRM integration."}
                </p>
                <div className="flex flex-wrap items-center gap-4">
                  <button
                    onClick={launchSandbox}
                    className="group inline-flex h-12 items-center gap-2 rounded-lg bg-gradient-to-r from-purple-500 to-cyan-400 px-6 text-base font-bold text-white shadow-[0_0_30px_rgba(124,58,237,0.45)] transition hover:shadow-[0_0_40px_rgba(124,58,237,0.6)]"
                  >
                    Request Demo
                    <ArrowRight size={18} weight="duotone" />
                  </button>
                  <button
                    onClick={handleEmbed}
                    className="inline-flex h-12 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-6 text-base font-semibold text-white backdrop-blur-xl transition hover:border-white/30 hover:bg-white/10"
                  >
                    <Code size={18} weight="duotone" />
                    Get Embed Code
                  </button>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-400">
                  <div className="flex -space-x-2">
                    {avatarUrls.map((src, idx) => (
                      <div
                        key={src}
                        className="h-10 w-10 rounded-full border-2 border-[#0B0B0F] bg-slate-700"
                        style={{ zIndex: 10 - idx, backgroundImage: `url(${src})`, backgroundSize: "cover", backgroundPosition: "center" }}
                      />
                    ))}
                  </div>
                  <p>Used by 500+ Contractors</p>
                </div>
              </div>

              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-tr from-purple-500/20 to-cyan-400/20 blur-3xl opacity-40" />
                <div className="relative w-full max-w-[560px] rounded-2xl border border-white/10 bg-[#0F0F12]/90 shadow-[0_30px_120px_rgba(0,0,0,0.7)] backdrop-blur-2xl">
                  <div className="absolute left-4 top-3 z-20 inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-200 backdrop-blur-xl">
                    Mockup
                  </div>
                  <div className="flex items-center gap-3 border-b border-white/10 bg-[#13131A]/90 px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="h-3 w-3 rounded-full bg-red-500/90" />
                      <span className="h-3 w-3 rounded-full bg-yellow-400/90" />
                      <span className="h-3 w-3 rounded-full bg-green-500/90" />
                    </div>
                    <div className="mx-auto flex-1">
                      <div className="mx-auto flex max-w-sm items-center justify-center rounded-full bg-black/60 px-4 py-1 text-[11px] font-semibold text-slate-400">
                        https://www.google.com/search?q=apexroofing-solutions.com
                      </div>
                    </div>
                  </div>

                  <div className="relative overflow-hidden rounded-b-2xl border-t border-white/5 bg-[#0E0E12]">
                    <div className="absolute inset-0 opacity-25" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, rgba(124,58,237,0.25), transparent 32%)" }} />
                    <div className="relative">
                      <div className="flex items-center justify-between border-b border-orange-500/20 bg-[#14141B]/90 px-5 py-3">
                        <div className="flex items-center gap-2 text-lg font-bold tracking-tight">
                          <HouseLine size={22} weight="duotone" className="text-orange-400" />
                          <div>
                            <span>APEX</span>
                            <span className="font-light text-slate-400">ROOFING</span>
                          </div>
                        </div>
                        <div className="hidden gap-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-300 sm:flex">
                          <span>Services</span>
                          <span>Projects</span>
                          <span className="text-orange-400">Estimator</span>
                        </div>
                      </div>

                      <div className="space-y-8 px-6 py-10">
                        <div className="text-center">
                          <h3 className="text-2xl font-bold">Quality Roofing Solutions</h3>
                          <p className="mt-2 text-sm text-slate-400">Get a free, instant estimate for your property using our advanced satellite tool.</p>
                        </div>

                        <div className="mx-auto w-full max-w-sm overflow-hidden rounded-xl border border-orange-500/30 bg-[#15151C] shadow-2xl">
                          <div className="flex items-center justify-between border-b border-orange-500/20 bg-orange-500/15 px-4 py-3 text-orange-400">
                            <div className="flex items-center gap-2 text-sm font-bold">
                              <Calculator size={18} weight="duotone" />
                              Instant Estimate
                            </div>
                            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-orange-200/90">Step 1 of 3</span>
                          </div>
                          <div className="space-y-5 p-5">
                            <div className="space-y-2">
                              <label className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Property Address</label>
                              <div className="relative">
                                <input
                                  type="text"
                                  placeholder="123 Main St..."
                                  className="w-full rounded-md border border-white/10 bg-[#0E0E12] py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                                />
                                <MapPinLine size={16} weight="duotone" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <label className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Project Type</label>
                              <div className="flex rounded-md border border-white/10 bg-[#0E0E12] p-1">
                                <button className="flex-1 rounded bg-orange-500 px-3 py-2 text-xs font-bold text-white shadow-md transition">Full Replacement</button>
                                <button className="flex-1 rounded px-3 py-2 text-xs font-semibold text-slate-400 transition hover:text-white">Partial Repair</button>
                              </div>
                            </div>
                            <button className="flex w-full items-center justify-center gap-2 rounded-md bg-orange-500 px-4 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-orange-600">
                              Get My Free Estimate
                              <ArrowRight size={16} weight="duotone" />
                            </button>
                            <div className="flex items-center justify-center gap-2 text-[10px] text-slate-500">
                              <ShieldCheck size={12} weight="duotone" />
                              Your data is secure and private
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="absolute -right-6 top-6 flex items-center gap-3 rounded-xl px-3 py-2 text-sm shadow-[0_12px_40px_rgba(0,0,0,0.6)]" style={{ ...glassStyle, border: "1px solid rgba(124,58,237,0.3)" }}>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/20 text-purple-300">
                      <ChartLineUp size={22} weight="duotone" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-300">Conversion Rate</p>
                      <p className="text-sm font-bold text-white">+24% Increase</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-white/10 bg-black/20 py-10">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-2xl px-6 py-5" style={glassStyle}>
                  <div className="flex items-center justify-between text-sm text-slate-400">
                    <p>{stat.label}</p>
                    {stat.icon}
                  </div>
                  <p className="mt-2 text-4xl font-bold text-white">{stat.value}</p>
                  <p className={`mt-2 inline-flex rounded px-2 py-1 text-xs font-semibold ${stat.tagClass}`}>{stat.tag}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden py-16">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="max-w-2xl space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-300">Powerful Features</p>
              <h3 className="text-3xl font-black text-white sm:text-4xl">Why choose Smart Estimator?</h3>
              <p className="text-lg text-slate-400">
                Our tool combines precision technology with seamless UX to boost your roofing business without manual legwork.
              </p>
            </div>
            <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feat, idx) => {
                const icons = [Planet, SquaresFour, GitBranch, DeviceMobile, ChartLine, SlidersHorizontal];
                const colors = ["rgba(6,182,212,0.45)", "rgba(124,58,237,0.45)", "rgba(6,182,212,0.45)", "rgba(124,58,237,0.45)", "rgba(6,182,212,0.45)", "rgba(124,58,237,0.45)"];
                const Icon = icons[idx % icons.length];
                const glow = colors[idx % colors.length];
                return (
                  <div key={`${feat.title}-${idx}`} className="group relative overflow-hidden rounded-2xl px-6 py-6 transition duration-300" style={glassStyle}>
                    <div
                      className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition duration-300 group-hover:opacity-100"
                      style={{ background: `radial-gradient(circle at 30% 30%, ${glow}, transparent 55%)`, border: `1px solid ${glow}` }}
                    />
                    <div className="relative mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 text-purple-300">
                      <Icon size={26} weight="duotone" />
                    </div>
                    <h4 className="relative text-xl font-bold text-white">{feat.title}</h4>
                    <p className="relative mt-2 text-slate-400">{feat.copy}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="border-y border-white/10 bg-black/30 py-14">
          <div className="mx-auto max-w-7xl px-4 text-center lg:px-8">
            <div className="mb-12 space-y-3">
              <h3 className="text-3xl font-black text-white">Seamless Workflow</h3>
              <p className="text-slate-400">From visitor to closed deal, automated at every step.</p>
            </div>
            <div className="relative flex flex-col items-center gap-8 lg:flex-row lg:justify-between">
              <div className="pointer-events-none absolute left-0 top-1/2 hidden h-px w-full -translate-y-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent lg:block" />
              {workflow.map((step) => {
                const Icon = step.icon;
                return (
                  <div key={step.title} className="relative z-10 flex flex-col items-center gap-3">
                    <div className={`flex h-20 w-20 items-center justify-center rounded-full border ${step.ring} ${step.glow}`}>
                      <Icon size={30} weight="fill" />
                    </div>
                    <div className="space-y-1 text-center">
                      <h5 className="text-lg font-semibold text-white">{step.title}</h5>
                      <p className="text-sm text-slate-500">{step.copy}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden py-16">
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[620px] w-[620px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/5" />
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[820px] w-[820px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/5" />
          <div className="relative mx-auto max-w-4xl px-4 text-center lg:px-8">
            <h3 className="text-4xl font-black text-white sm:text-5xl">Ready to transform your roofing website?</h3>
            <p className="mt-4 text-lg text-slate-400">Join hundreds of top-tier contractors using the Smart Estimator to generate leads while they sleep.</p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <button onClick={() => setShowOnboard(true)} className="w-full rounded-lg bg-white px-8 py-3 text-center text-lg font-bold text-black transition hover:bg-slate-200 sm:w-auto">
                Start Free Trial
              </button>
              <button
                onClick={handleEmbed}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-8 py-3 text-center text-lg font-bold text-white backdrop-blur-xl transition hover:border-white/30 hover:bg-white/10 sm:w-auto"
              >
                Contact Sales
              </button>
            </div>
          </div>
        </section>
      </main>

      {showOnboard && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 backdrop-blur-lg px-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#111118]/95 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.7)]">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-purple-300">Get Started</p>
            <h3 className="mt-2 text-2xl font-black text-white">{existing ? "Existing member" : "Create your profile"}</h3>
            <div className="mt-4 inline-flex rounded-lg border border-white/10 bg-white/5 p-1">
              <button
                type="button"
                onClick={() => setExisting(false)}
                className={`rounded-md px-3 py-1 text-sm font-semibold transition ${
                  !existing ? "bg-gradient-to-r from-purple-500 to-cyan-400 text-white" : "text-slate-300"
                }`}
              >
                I'm new
              </button>
              <button
                type="button"
                onClick={() => setExisting(true)}
                className={`rounded-md px-3 py-1 text-sm font-semibold transition ${
                  existing ? "bg-gradient-to-r from-purple-500 to-cyan-400 text-white" : "text-slate-300"
                }`}
              >
                I'm a member
              </button>
            </div>

            <div className="mt-4 grid gap-3">
              {!existing && (
                <>
                  <input
                    placeholder="Company / Tenant Name"
                    value={tenantName}
                    onChange={(e) => setTenantName(e.target.value)}
                    className="rounded-lg border border-white/10 bg-[#0F0F14] px-3 py-2 text-white placeholder:text-slate-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500/40"
                  />
                  <input
                    placeholder="Full Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="rounded-lg border border-white/10 bg-[#0F0F14] px-3 py-2 text-white placeholder:text-slate-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500/40"
                  />
                  <input
                    type="password"
                    placeholder="Set Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="rounded-lg border border-white/10 bg-[#0F0F14] px-3 py-2 text-white placeholder:text-slate-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500/40"
                  />
                </>
              )}
              {existing && (
                <input
                  placeholder="Tenant ID"
                  value={tenantId}
                  onChange={(e) => setTenantId(e.target.value)}
                  title="Provide your tenant id"
                  className="rounded-lg border border-white/10 bg-[#0F0F14] px-3 py-2 text-white placeholder:text-slate-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500/40"
                />
              )}
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-lg border border-white/10 bg-[#0F0F14] px-3 py-2 text-white placeholder:text-slate-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500/40"
              />
            </div>

            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowOnboard(false)}
                className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={startOnboarding}
                disabled={saving}
                className="rounded-lg bg-gradient-to-r from-purple-500 to-cyan-400 px-5 py-2 text-sm font-bold text-white shadow-[0_0_20px_rgba(124,58,237,0.35)] transition hover:shadow-[0_0_28px_rgba(124,58,237,0.45)] disabled:opacity-60"
              >
                {saving ? "Working..." : "Continue to payment"}
              </button>
            </div>
            {onboardError && <p className="mt-2 text-sm text-rose-400">{onboardError}</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default ToolDetailPage;
