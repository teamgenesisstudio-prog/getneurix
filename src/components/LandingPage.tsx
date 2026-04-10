import { useState, useEffect, useRef } from "react";
import {
  Cpu, Zap, Shield, Brain, Eye, Skull, TrendingUp, BarChart3,
  ArrowRight, CheckCircle, X, Activity, DollarSign, Clock, Bug,
  Upload, Rocket, Lock, Globe, FileText, Users, Layers, Search,
  Radio, Sparkles, GitBranch, Database, ChevronDown, Play, Menu, XIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface LandingPageProps {
  onEnter: () => void;
}

const features = [
  { icon: <Zap className="w-5 h-5" />, title: "Zero-Shot Auto-Labeling", desc: "Ensemble of 3 AI models pre-labels 90% of data instantly. Humans audit only 10%." },
  { icon: <Shield className="w-5 h-5" />, title: "Auto-Fixer", desc: "Detects weaknesses, generates synthetic fixes, and retrains automatically." },
  { icon: <Eye className="w-5 h-5" />, title: "Ghost Privacy Mode", desc: "PII masked locally before anything leaves your device. Built for healthcare & defense." },
  { icon: <DollarSign className="w-5 h-5" />, title: "Cost Transparency", desc: "Real-time dashboard: cost per row, per model, per label. No hidden fees." },
  { icon: <GitBranch className="w-5 h-5" />, title: "Self-Healing Loop", desc: "Model fails → data auto-relabeled → model auto-retrained → deployed." },
  { icon: <Database className="w-5 h-5" />, title: "Synthetic Gap-Filler", desc: "Missing data? One click generates 10,000 synthetic examples." },
  { icon: <Users className="w-5 h-5" />, title: "Labeler Reputation", desc: "Leaderboard with accuracy stats. Hire the best labelers for your project." },
  { icon: <Sparkles className="w-5 h-5" />, title: "RLHF Sandboxes", desc: "Test LLM in playground. Humans rank responses. Reward model updates live." },
  { icon: <Layers className="w-5 h-5" />, title: "Dataset Distillation", desc: "1M rows → 100K that matter. One click to remove redundancy." },
  { icon: <Brain className="w-5 h-5" />, title: "Chain of Thought", desc: "Labelers write reasoning. Reasoning data trains next-gen models." },
  { icon: <Skull className="w-5 h-5" />, title: "Adversarial Simulator", desc: "AI hacker tries prompt injection, data poisoning, evasion attacks." },
  { icon: <Search className="w-5 h-5" />, title: "Edge-Case Radar", desc: "Scans datasets, surfaces the weirdest data your model hasn't seen." },
  { icon: <FileText className="w-5 h-5" />, title: "Regulatory Reports", desc: "One-click PDF audit trails. SEC, EU AI Act, HIPAA, GDPR compliant." },
  { icon: <Globe className="w-5 h-5" />, title: "Multi-Cloud Support", desc: "AWS, Azure, GCP, Snowflake. Data never leaves your cloud." },
  { icon: <Radio className="w-5 h-5" />, title: "Knowledge Distillation", desc: "Take GPT-4 → teach small Llama model. Reduce AI bill by 90%." },
  { icon: <TrendingUp className="w-5 h-5" />, title: "Active Learning", desc: "AI tells you exactly which 452 images to label for 99% accuracy." },
];

const comparison = [
  { feature: "Speed", neurix: "Minutes", scale: "Weeks" },
  { feature: "Accuracy", neurix: ">99%", scale: "~90%" },
  { feature: "Auto-fix", neurix: true, scale: false },
  { feature: "Explains failures", neurix: true, scale: false },
  { feature: "Shadow mode", neurix: true, scale: false },
  { feature: "Privacy mode", neurix: true, scale: false },
  { feature: "Human error rate", neurix: "0%", scale: "~10%" },
  { feature: "Pricing (beta)", neurix: "FREE", scale: "$$$$$" },
  { feature: "Independence", neurix: "100%", scale: "49% Meta" },
  { feature: "AI models", neurix: "3 (ensemble)", scale: "Human only" },
];

const stats = [
  { value: "127+", label: "Edge Cases Tested" },
  { value: "<5min", label: "Time to Fix" },
  { value: "$0", label: "Beta Price" },
  { value: "99.2%", label: "AI Accuracy" },
  { value: "3", label: "AI Models" },
  { value: "20+", label: "Features" },
];

const howItWorks = [
  { icon: <Upload className="w-8 h-8" />, step: "01", title: "Upload Model", desc: "CSV, JSON, or Python pickle. Any model, any format." },
  { icon: <Cpu className="w-8 h-8" />, step: "02", title: "NEURIX Stress-Tests", desc: "3 AI models run 127+ edge cases, adversarial attacks, and drift detection." },
  { icon: <Rocket className="w-8 h-8" />, step: "03", title: "Auto-Fix & Deploy", desc: "Synthetic data generated, model retrained, deployed in minutes." },
];

const AnimatedCounter = ({ target, suffix = "" }: { target: string; suffix?: string }) => {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setVisible(true);
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
      <div className="font-display text-3xl sm:text-4xl font-bold text-primary neon-glow-cyan">{target}{suffix}</div>
    </div>
  );
};

const LandingPage = ({ onEnter }: LandingPageProps) => {
  const [hovered, setHovered] = useState<number | null>(null);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileMenu(false);
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] cyber-grid">
      {/* Nav */}
      <nav className="border-b border-border/20 glass-panel sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Cpu className="w-7 h-7 text-primary" />
              <div className="absolute inset-0 w-7 h-7 bg-primary/20 rounded-full blur-md" />
            </div>
            <span className="font-display text-xl font-bold tracking-wider text-primary neon-glow-cyan">NEURIX</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-xs font-mono">
            <button onClick={() => scrollTo("features")} className="text-muted-foreground hover:text-primary transition-colors">Features</button>
            <button onClick={() => scrollTo("how-it-works")} className="text-muted-foreground hover:text-primary transition-colors">How It Works</button>
            <button onClick={() => scrollTo("comparison")} className="text-muted-foreground hover:text-primary transition-colors">Compare</button>
            <button onClick={() => scrollTo("pricing")} className="text-muted-foreground hover:text-primary transition-colors">Pricing</button>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex px-2 py-1 rounded text-[10px] font-display font-bold bg-success/10 text-success border border-success/30 animate-pulse-neon">
              FREE BETA
            </span>
            <Button onClick={onEnter} size="sm" className="bg-primary text-primary-foreground font-mono text-xs hover:bg-primary/90 shadow-[0_0_15px_hsl(var(--primary)/0.3)]">
              Launch App <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
            <button className="md:hidden text-muted-foreground" onClick={() => setMobileMenu(!mobileMenu)}>
              {mobileMenu ? <XIcon className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
        {mobileMenu && (
          <div className="md:hidden border-t border-border/20 px-4 py-3 space-y-2 text-xs font-mono">
            <button onClick={() => scrollTo("features")} className="block w-full text-left py-2 text-muted-foreground hover:text-primary">Features</button>
            <button onClick={() => scrollTo("how-it-works")} className="block w-full text-left py-2 text-muted-foreground hover:text-primary">How It Works</button>
            <button onClick={() => scrollTo("comparison")} className="block w-full text-left py-2 text-muted-foreground hover:text-primary">Compare</button>
            <button onClick={() => scrollTo("pricing")} className="block w-full text-left py-2 text-muted-foreground hover:text-primary">Pricing</button>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="container mx-auto px-4 py-24 md:py-36 text-center relative z-10">
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-mono text-primary">NOW IN FREE BETA — NO CREDIT CARD REQUIRED</span>
            </div>

            <div className="flex items-center justify-center gap-2 mb-4">
              <Lock className="w-4 h-4 text-success" />
              <span className="text-xs font-mono text-success">PRIVACY FIRST</span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
              <span className="text-primary neon-glow-cyan">Break Your AI.</span>
              <br />
              <span className="text-foreground">Fix It. Deploy Better.</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground font-body max-w-2xl mx-auto mb-12 leading-relaxed">
              NEURIX stress-tests your models, finds every failure, auto-generates fixes, and retrains — all in minutes. Not weeks. Powered by GPT-4o, Claude 3.5 & Gemini.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
              <Button
                onClick={onEnter}
                size="lg"
                className="bg-primary text-primary-foreground font-display text-sm tracking-wider hover:bg-primary/90 px-10 py-7 shadow-[0_0_30px_hsl(var(--primary)/0.4)] hover:shadow-[0_0_50px_hsl(var(--primary)/0.5)] transition-all duration-300"
              >
                Launch NEURIX — Free Beta <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                onClick={() => setShowDemo(true)}
                variant="outline"
                size="lg"
                className="border-secondary/50 text-secondary hover:bg-secondary/10 font-display text-sm tracking-wider px-8 py-7"
              >
                <Play className="w-4 h-4 mr-2" /> Watch Demo
              </Button>
            </div>
            <p className="text-xs font-mono text-muted-foreground">No signup · No credit card · No tracking · Instant access</p>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-y border-border/20 bg-muted/10">
        <div className="container mx-auto px-4 py-10 grid grid-cols-3 md:grid-cols-6 gap-6">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <AnimatedCounter target={s.value} />
              <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="container mx-auto px-4 py-24">
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-center mb-4 tracking-wider">
          <span className="text-primary">HOW IT WORKS</span>
        </h2>
        <p className="text-sm text-muted-foreground text-center mb-16 font-mono max-w-lg mx-auto">Three steps. Five minutes. Bulletproof AI.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {howItWorks.map((step, i) => (
            <div key={step.step} className="relative text-center group">
              <div className="glass-panel rounded-2xl p-8 hover:neon-border-cyan transition-all duration-300 h-full">
                <div className="text-[10px] font-display text-primary/40 tracking-widest mb-4">STEP {step.step}</div>
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-primary/10 border border-primary/20 mb-4 text-primary group-hover:scale-110 transition-transform">
                  {step.icon}
                </div>
                <h3 className="font-display text-sm font-semibold mb-2">{step.title}</h3>
                <p className="text-xs text-muted-foreground font-mono">{step.desc}</p>
              </div>
              {i < 2 && <ArrowRight className="hidden md:block w-5 h-5 text-primary/30 absolute top-1/2 -right-6 -translate-y-1/2" />}
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="container mx-auto px-4 py-24">
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-center mb-4 tracking-wider">
          <span className="text-primary">20 FEATURES.</span>{" "}
          <span className="text-foreground">ZERO COMPROMISE.</span>
        </h2>
        <p className="text-sm text-muted-foreground text-center mb-16 font-mono max-w-lg mx-auto">
          Everything you need to bulletproof your AI. Powered by 3 AI models working in ensemble.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f, i) => (
            <div
              key={f.title}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              className={`glass-panel rounded-xl p-6 transition-all duration-300 cursor-default ${
                hovered === i ? "neon-border-cyan scale-[1.03] -translate-y-1" : "border border-border/30 hover:border-border/50"
              }`}
            >
              <div className={`mb-3 transition-colors duration-300 ${hovered === i ? "text-primary" : "text-muted-foreground"}`}>
                {f.icon}
              </div>
              <h3 className="font-display text-[11px] font-semibold tracking-wide mb-2">{f.title}</h3>
              <p className="text-[11px] text-muted-foreground font-mono leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 3 Highlight Cards */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <div className="glass-panel rounded-2xl p-8 neon-border-cyan">
            <Shield className="w-8 h-8 text-primary mb-4" />
            <h3 className="font-display text-sm font-bold mb-2">Auto-Fixer</h3>
            <p className="text-xs text-muted-foreground font-mono">NEURIX detects weaknesses and fixes them automatically. No manual work. Synthetic data generated, model retrained.</p>
          </div>
          <div className="glass-panel rounded-2xl p-8 neon-border-magenta">
            <Eye className="w-8 h-8 text-accent mb-4" />
            <h3 className="font-display text-sm font-bold mb-2">Ghost Privacy</h3>
            <p className="text-xs text-muted-foreground font-mono">Your data never leaves your device. PII masked locally. No tracking. No analytics. Built for healthcare and defense.</p>
          </div>
          <div className="glass-panel rounded-2xl p-8" style={{ boxShadow: "0 0 5px hsl(150 80% 45% / 0.3)", borderColor: "hsl(150 80% 45% / 0.5)" }}>
            <BarChart3 className="w-8 h-8 text-success mb-4" />
            <h3 className="font-display text-sm font-bold mb-2">Cost Transparency</h3>
            <p className="text-xs text-muted-foreground font-mono">Real-time dashboard shows exactly what you spend per label, per model. No hidden fees ever.</p>
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section id="comparison" className="container mx-auto px-4 py-24">
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-center mb-4 tracking-wider">
          <span className="text-primary">NEURIX</span>{" "}
          <span className="text-muted-foreground">VS</span>{" "}
          <span className="text-muted-foreground/60">SCALE AI</span>
        </h2>
        <p className="text-sm text-muted-foreground text-center mb-12 font-mono">See why teams are switching.</p>
        <div className="max-w-2xl mx-auto glass-panel rounded-xl overflow-hidden neon-border-cyan">
          <div className="grid grid-cols-3 text-xs font-display tracking-wider bg-muted/30 px-6 py-4 border-b border-border/30">
            <span className="text-muted-foreground">FEATURE</span>
            <span className="text-primary text-center">NEURIX</span>
            <span className="text-muted-foreground text-center">SCALE AI</span>
          </div>
          {comparison.map((row, i) => (
            <div key={row.feature} className={`grid grid-cols-3 px-6 py-3.5 text-xs font-mono items-center ${i < comparison.length - 1 ? "border-b border-border/10" : ""} hover:bg-muted/10 transition-colors`}>
              <span className="text-muted-foreground">{row.feature}</span>
              <span className="text-center">
                {typeof row.neurix === "boolean" ? <CheckCircle className="w-4 h-4 text-success mx-auto" /> : <span className="text-success font-semibold">{row.neurix}</span>}
              </span>
              <span className="text-center">
                {typeof row.scale === "boolean" ? <X className="w-4 h-4 text-destructive/60 mx-auto" /> : <span className="text-muted-foreground">{row.scale}</span>}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="container mx-auto px-4 py-24 text-center">
        <div className="glass-panel rounded-2xl p-12 md:p-20 neon-border-cyan max-w-2xl mx-auto relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-primary/5 rounded-full blur-[80px] pointer-events-none" />
          <div className="relative z-10">
            <div className="font-display text-5xl font-bold text-primary neon-glow-cyan mb-4">$0</div>
            <h2 className="font-display text-2xl font-bold mb-4 tracking-wide">Free Beta</h2>
            <p className="text-sm text-muted-foreground font-mono mb-3">No credit card. No payment. No limits during beta.</p>
            <p className="text-xs text-muted-foreground font-mono mb-10">All 20 features included. All 3 AI models. Unlimited usage.</p>
            <Button
              onClick={onEnter}
              size="lg"
              className="bg-primary text-primary-foreground font-display text-sm tracking-wider hover:bg-primary/90 px-12 py-7 shadow-[0_0_30px_hsl(var(--primary)/0.4)] hover:shadow-[0_0_50px_hsl(var(--primary)/0.5)] transition-all"
            >
              LAUNCH NEURIX <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/20 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-primary" />
              <span className="font-display text-xs text-primary">NEURIX</span>
            </div>
            <div className="flex items-center gap-6 text-[10px] font-mono text-muted-foreground">
              <button onClick={() => scrollTo("features")} className="hover:text-primary transition-colors">Features</button>
              <span className="hover:text-primary transition-colors cursor-default">Privacy</span>
              <span className="hover:text-primary transition-colors cursor-default">Terms</span>
              <span className="hover:text-primary transition-colors cursor-default">Docs</span>
              <span className="hover:text-primary transition-colors cursor-default">Discord</span>
            </div>
            <div className="text-[10px] font-mono text-muted-foreground">NEURIX — AI Infrastructure · {new Date().getFullYear()}</div>
          </div>
        </div>
      </footer>

      {/* Demo Modal */}
      {showDemo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={() => setShowDemo(false)}>
          <div className="glass-panel rounded-2xl p-8 max-w-2xl w-full mx-4 neon-border-cyan" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display text-sm font-bold text-primary">NEURIX Demo</h3>
              <button onClick={() => setShowDemo(false)} className="text-muted-foreground hover:text-foreground"><XIcon className="w-5 h-5" /></button>
            </div>
            <div className="aspect-video bg-muted/30 rounded-lg flex items-center justify-center border border-border/30">
              <div className="text-center">
                <Play className="w-12 h-12 text-primary mx-auto mb-3" />
                <p className="text-sm font-mono text-muted-foreground mb-4">Demo video coming soon</p>
                <Button onClick={() => { setShowDemo(false); onEnter(); }} className="bg-primary text-primary-foreground font-mono text-xs">
                  Try It Now — Free <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
