import { Link } from "react-router-dom";
import { Shield, Zap, FlaskConical, Bot, Activity, Lock, GitBranch, Database, ArrowRight } from "lucide-react";

const v1Features = [
  { icon: Zap, title: "Auto-Labeling Engine", desc: "Ensemble pre-labels 90% of data; humans audit 10%." },
  { icon: Shield, title: "Auto-Fixer", desc: "Detects weaknesses, generates synthetic fixes, retrains." },
  { icon: Database, title: "Synthetic Gap-Filler", desc: "10,000 synthetic edge-case examples in one click." },
  { icon: GitBranch, title: "Self-Healing Loop", desc: "Model fails → relabel → retrain → deploy." },
  { icon: Activity, title: "Live Attack Feed", desc: "Real-time stream of adversarial scenarios." },
  { icon: Lock, title: "Trust Layer", desc: "On-device audit logs, API keys, rate limiting." },
];

const v2Features = [
  { icon: Shield, title: "Compute Guard", desc: "Budget cap, token throttle, automatic model downgrade." },
  { icon: Activity, title: "Liability Mapper", desc: "PII / Bias / Injection mapped to GDPR Art.32 + EU AI Act Art.10." },
  { icon: FlaskConical, title: "Shadow Engine", desc: "Production vs Sentinel-Hardened with auto-rollback." },
  { icon: Bot, title: "Nexus AI Sandbox", desc: "Real GPT-4o + Gemini side-by-side under NEURIX guard." },
  { icon: Database, title: "Forensic Logs", desc: "Every block + violation streamed to encrypted store." },
  { icon: Lock, title: "VPC-Ready", desc: "Self-contained components, exportable to private repo." },
];

export default function HowItWorks() {
  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <header className="max-w-6xl mx-auto px-6 py-8 flex items-center justify-between">
        <Link to="/" className="font-mono text-lg tracking-widest">NEURIX</Link>
        <Link to="/" className="text-sm font-mono text-neutral-600 hover:text-black flex items-center gap-1">Enter Security Terminal <ArrowRight className="w-4 h-4" /></Link>
      </header>

      <section className="max-w-4xl mx-auto px-6 py-16 text-center">
        <div className="text-xs font-mono uppercase tracking-widest text-neutral-500 mb-4">Infrastructure for AI Engineers</div>
        <h1 className="font-display text-5xl md:text-6xl mb-6">How NEURIX works</h1>
        <p className="text-lg text-neutral-600 max-w-2xl mx-auto font-body">
          NEURIX is not a wrapper. It is the security perimeter, compliance engine, and regression dashboard
          that sits between your application and any LLM you call.
        </p>
      </section>

      {/* Three pillars */}
      <section className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-3 gap-12">
        {[
          { n: "01", title: "Adversarial Analysis", sub: "The Breaker", body: "Continuously probes your model with prompt injections, jailbreaks, and edge-case inputs to find weaknesses before attackers do." },
          { n: "02", title: "Deterministic Enforcement", sub: "The Firewall", body: "Hard-coded rules block PII leakage, bias, and budget overruns at the proxy layer. Every event maps to a regulatory clause." },
          { n: "03", title: "Synthetic Immunity", sub: "The Autonomous Trainer", body: "Failures generate synthetic training data; the shadow engine evaluates retrained models and gates promotion on safety." },
        ].map(p => (
          <div key={p.n}>
            <div className="text-xs font-mono text-neutral-400 mb-3">{p.n}</div>
            <div className="text-xs font-mono uppercase tracking-wider text-neutral-500">{p.sub}</div>
            <h3 className="font-display text-2xl mt-1 mb-3">{p.title}</h3>
            <p className="text-neutral-600 font-body text-sm leading-relaxed">{p.body}</p>
          </div>
        ))}
      </section>

      {/* SVG diagram */}
      <section className="max-w-5xl mx-auto px-6 py-12">
        <div className="border border-neutral-200 rounded-lg p-8">
          <svg viewBox="0 0 800 200" className="w-full h-auto">
            {[
              { x: 40, label: "Your App" },
              { x: 220, label: "NEURIX Guard" },
              { x: 400, label: "Liability Mapper" },
              { x: 580, label: "LLM (GPT/Gemini)" },
              { x: 760, label: "" },
            ].slice(0, 4).map((n, i) => (
              <g key={i}>
                <rect x={n.x} y="80" width="140" height="40" rx="4" fill="white" stroke="#0a0a0a" strokeWidth="1" />
                <text x={n.x + 70} y="105" textAnchor="middle" fontFamily="monospace" fontSize="11" fill="#0a0a0a">{n.label}</text>
                {i < 3 && <line x1={n.x + 140} y1="100" x2={n.x + 180} y2="100" stroke="#0a0a0a" strokeWidth="1" markerEnd="url(#arr)" />}
              </g>
            ))}
            <defs>
              <marker id="arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6" fill="#0a0a0a" />
              </marker>
            </defs>
          </svg>
        </div>
      </section>

      {/* V1 + V2 feature inventory */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-neutral-500 mb-2">Version 1.0 · Shipped</div>
            <h2 className="font-display text-3xl mb-6">The Evaluation Layer</h2>
            <div className="space-y-4">
              {v1Features.map((f, i) => (
                <div key={i} className="flex gap-4 border-b border-neutral-200 pb-4">
                  <f.icon className="w-5 h-5 mt-0.5 text-neutral-700 flex-shrink-0" />
                  <div>
                    <div className="font-mono text-sm">{f.title}</div>
                    <div className="text-sm text-neutral-600 font-body">{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-neutral-500 mb-2">Version 2.0 · Shipped</div>
            <h2 className="font-display text-3xl mb-6">The Security Terminal</h2>
            <div className="space-y-4">
              {v2Features.map((f, i) => (
                <div key={i} className="flex gap-4 border-b border-neutral-200 pb-4">
                  <f.icon className="w-5 h-5 mt-0.5 text-neutral-700 flex-shrink-0" />
                  <div>
                    <div className="font-mono text-sm">{f.title}</div>
                    <div className="text-sm text-neutral-600 font-body">{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 py-20 text-center">
        <h2 className="font-display text-4xl mb-6">Ready to enter the terminal?</h2>
        <Link to="/" className="inline-flex items-center gap-2 bg-black text-white px-8 py-4 rounded font-mono text-sm hover:bg-neutral-800">
          ENTER SECURITY TERMINAL <ArrowRight className="w-4 h-4" />
        </Link>
      </section>

      <footer className="border-t border-neutral-200 py-8 text-center text-xs font-mono text-neutral-500">
        NEURIX · Infrastructure layer for AI engineers
      </footer>
    </div>
  );
}
