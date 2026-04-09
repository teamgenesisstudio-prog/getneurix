import { useState } from "react";
import { 
  Cpu, Zap, Shield, Brain, Eye, Skull, TrendingUp, BarChart3,
  ArrowRight, CheckCircle, X, Activity, DollarSign, Clock, Bug
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface LandingPageProps {
  onEnter: () => void;
}

const features = [
  { icon: <Zap className="w-5 h-5" />, title: "100+ Edge Case Tests", desc: "Stress-test with noise, outliers, adversarial inputs in seconds" },
  { icon: <Shield className="w-5 h-5" />, title: "Risk Scoring 0–100", desc: "Instant reliability score with plain English explanations" },
  { icon: <Brain className="w-5 h-5" />, title: "Auto-Fix & Retrain", desc: "Generate synthetic data and retrain automatically" },
  { icon: <DollarSign className="w-5 h-5" />, title: "Financial Guardrails", desc: "See exact dollar cost of every failure" },
  { icon: <Eye className="w-5 h-5" />, title: "Shadow Mode", desc: "Test new models on live production data secretly" },
  { icon: <Skull className="w-5 h-5" />, title: "Adversarial Simulator", desc: "AI hacker tries to break your model before attackers do" },
  { icon: <TrendingUp className="w-5 h-5" />, title: "ROI Calculator", desc: "Track exactly how much NEURIX saves you" },
  { icon: <BarChart3 className="w-5 h-5" />, title: "Competitor Benchmark", desc: "Compare your model against top industry models" },
];

const comparison = [
  { feature: "Time to results", neurix: "5 minutes", scale: "2–6 weeks" },
  { feature: "Explains WHY model fails", neurix: true, scale: false },
  { feature: "Auto-fix + retrain", neurix: true, scale: false },
  { feature: "Adversarial testing", neurix: true, scale: false },
  { feature: "Shadow mode", neurix: true, scale: false },
  { feature: "Human error rate", neurix: "0%", scale: "~10%" },
  { feature: "Pricing (beta)", neurix: "FREE", scale: "$$$$$" },
  { feature: "Independence", neurix: "100% independent", scale: "49% Meta-owned" },
  { feature: "Fully automated", neurix: true, scale: false },
];

const stats = [
  { value: "127+", label: "Edge Cases Tested", icon: <Bug className="w-4 h-4" /> },
  { value: "<5min", label: "Time to Fix", icon: <Clock className="w-4 h-4" /> },
  { value: "$0", label: "Beta Price", icon: <DollarSign className="w-4 h-4" /> },
  { value: "0%", label: "AI Error Rate", icon: <Activity className="w-4 h-4" /> },
];

const LandingPage = ({ onEnter }: LandingPageProps) => {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background cyber-grid scanline">
      {/* Nav */}
      <nav className="border-b border-border/30 glass-panel sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Cpu className="w-6 h-6 text-primary animate-pulse-neon" />
            <span className="font-display text-lg font-bold tracking-wider text-primary neon-glow-cyan">NEURIX</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-2 py-1 rounded text-[10px] font-display font-bold bg-success/10 text-success border border-success/30 animate-pulse-neon">
              FREE BETA
            </span>
            <Button onClick={onEnter} size="sm" className="bg-primary text-primary-foreground font-mono text-xs hover:bg-primary/90">
              Launch App <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="container mx-auto px-4 py-20 md:py-32 text-center relative">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse-neon" />
            <span className="text-xs font-mono text-primary">NOW IN FREE BETA</span>
          </div>
          <h1 className="font-display text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-tight mb-6">
            <span className="text-primary neon-glow-cyan animate-flicker">BREAK</span>{" "}
            <span className="text-foreground">YOUR AI MODEL</span>
            <br />
            <span className="text-muted-foreground text-2xl sm:text-3xl md:text-4xl">BEFORE PRODUCTION DOES</span>
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground font-body max-w-xl mx-auto mb-10">
            NEURIX stress-tests AI models, finds every failure, explains why in plain English, auto-generates fixes, and retrains — all in under 5 minutes.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              onClick={onEnter}
              size="lg"
              className="bg-primary text-primary-foreground font-display text-sm tracking-wider hover:bg-primary/90 px-8 py-6 shadow-[0_0_20px_hsl(var(--primary)/0.3)]"
            >
              ENTER STRESS COMMAND <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <span className="text-xs font-mono text-muted-foreground">No signup · No credit card · Instant access</span>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border/30 bg-muted/10">
        <div className="container mx-auto px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="flex justify-center mb-2 text-primary">{s.icon}</div>
              <div className="font-display text-2xl font-bold text-foreground">{s.value}</div>
              <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-center mb-4 tracking-wider">
          <span className="text-primary">14 FEATURES.</span> <span className="text-foreground">ZERO COMPROMISE.</span>
        </h2>
        <p className="text-sm text-muted-foreground text-center mb-12 font-mono max-w-lg mx-auto">
          Everything you need to bulletproof your AI — fully automated, no humans in the loop.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f, i) => (
            <div
              key={f.title}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              className={`glass-panel rounded-lg p-5 transition-all duration-300 ${
                hovered === i ? "neon-border-cyan scale-[1.02]" : "border border-border/50"
              }`}
            >
              <div className={`mb-3 transition-colors ${hovered === i ? "text-primary" : "text-muted-foreground"}`}>
                {f.icon}
              </div>
              <h3 className="font-display text-xs font-semibold tracking-wide mb-1">{f.title}</h3>
              <p className="text-xs text-muted-foreground font-mono">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison Table */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-center mb-4 tracking-wider">
          <span className="text-foreground">NEURIX</span> <span className="text-muted-foreground">VS</span>{" "}
          <span className="text-muted-foreground/60">SCALE AI</span>
        </h2>
        <p className="text-sm text-muted-foreground text-center mb-10 font-mono">
          See why teams are switching.
        </p>
        <div className="max-w-2xl mx-auto glass-panel rounded-lg overflow-hidden neon-border-cyan">
          <div className="grid grid-cols-3 text-xs font-display tracking-wider bg-muted/30 px-4 py-3 border-b border-border/50">
            <span className="text-muted-foreground">FEATURE</span>
            <span className="text-primary text-center">NEURIX</span>
            <span className="text-muted-foreground text-center">SCALE AI</span>
          </div>
          {comparison.map((row, i) => (
            <div
              key={row.feature}
              className={`grid grid-cols-3 px-4 py-3 text-xs font-mono items-center ${
                i < comparison.length - 1 ? "border-b border-border/20" : ""
              }`}
            >
              <span className="text-muted-foreground">{row.feature}</span>
              <span className="text-center">
                {typeof row.neurix === "boolean" ? (
                  <CheckCircle className="w-4 h-4 text-success mx-auto" />
                ) : (
                  <span className="text-success font-semibold">{row.neurix}</span>
                )}
              </span>
              <span className="text-center">
                {typeof row.scale === "boolean" ? (
                  <X className="w-4 h-4 text-destructive/60 mx-auto" />
                ) : (
                  <span className="text-muted-foreground">{row.scale}</span>
                )}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="glass-panel rounded-xl p-10 md:p-16 neon-border-cyan max-w-2xl mx-auto">
          <h2 className="font-display text-2xl sm:text-3xl font-bold mb-4 tracking-wide">
            <span className="text-primary neon-glow-cyan">READY TO BREAK</span>{" "}
            <span className="text-foreground">YOUR MODEL?</span>
          </h2>
          <p className="text-sm text-muted-foreground font-mono mb-8 max-w-md mx-auto">
            Upload your model, get a full reliability report in 5 minutes. Free during beta — no strings attached.
          </p>
          <Button
            onClick={onEnter}
            size="lg"
            className="bg-primary text-primary-foreground font-display text-sm tracking-wider hover:bg-primary/90 px-10 py-6 shadow-[0_0_30px_hsl(var(--primary)/0.4)]"
          >
            LAUNCH NEURIX <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30 py-6">
        <div className="container mx-auto px-4 text-center text-xs font-mono text-muted-foreground">
          NEURIX v1.0 — AI STRESS COMMAND SYSTEM — FREE BETA — NO COMPETITOR CONTROL
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
