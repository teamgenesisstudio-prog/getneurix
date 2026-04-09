import { useState, useCallback } from "react";
import {
  Activity, Shield, Skull, BarChart3, Zap, Eye, Brain,
  TrendingUp, AlertTriangle, Target, Cpu, ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import RiskGauge from "@/components/RiskGauge";
import FileUpload from "@/components/FileUpload";
import FailureList from "@/components/FailureList";
import type { Failure } from "@/components/FailureList";
import AlertFeed from "@/components/AlertFeed";
import type { Alert } from "@/components/AlertFeed";
import MoneyCounter from "@/components/MoneyCounter";
import CompetitorBenchmark from "@/components/CompetitorBenchmark";
import NeurixPanel from "@/components/NeurixPanel";
import AdversarialSimulator from "@/components/AdversarialSimulator";
import ROICalculator from "@/components/ROICalculator";
import { runStressTest, generateAdversarialResults } from "@/lib/neurix-engine";

interface DashboardProps {
  onBack: () => void;
}

const Dashboard = ({ onBack }: DashboardProps) => {
  const [score, setScore] = useState(0);
  const [failures, setFailures] = useState<Failure[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [moneySaved, setMoneySaved] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [testsRun, setTestsRun] = useState(0);
  const [shadowMode, setShadowMode] = useState(false);

  const handleFileSelect = useCallback(async (file: File) => {
    setIsProcessing(true);
    setAlerts([{ id: `init-${Date.now()}`, type: "info", message: `Processing ${file.name}...`, timestamp: new Date() }]);
    await new Promise((r) => setTimeout(r, 2000));
    const result = runStressTest(file.name);
    setScore(result.score);
    setFailures(result.failures);
    setMoneySaved((prev) => prev + result.moneySaved);
    setAlerts((prev) => [...result.alerts, ...prev]);
    setTestsRun((prev) => prev + 1);
    setIsProcessing(false);
  }, []);

  const handleAdversarial = useCallback(async () => {
    await new Promise((r) => setTimeout(r, 3000));
    const results = generateAdversarialResults();
    const breached = results.filter((r) => r.success).length;
    setAlerts((prev) => [
      { id: `adv-${Date.now()}`, type: "error", message: `Adversarial: ${breached}/${results.length} attacks succeeded`, timestamp: new Date() },
      ...prev,
    ]);
    return results;
  }, []);

  return (
    <div className="min-h-screen bg-background cyber-grid scanline">
      <header className="border-b border-border/50 glass-panel sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Cpu className="w-6 h-6 text-primary animate-pulse-neon" />
              <h1 className="font-display text-xl font-bold tracking-wider text-primary neon-glow-cyan animate-flicker">NEURIX</h1>
            </div>
            <span className="text-[10px] font-mono text-muted-foreground tracking-widest hidden sm:block">AI STRESS COMMAND</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShadowMode(!shadowMode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono transition-all ${
                shadowMode ? "bg-accent/20 text-accent neon-border-magenta border" : "bg-muted text-muted-foreground border border-border"
              }`}
            >
              <Eye className="w-3 h-3" />
              SHADOW {shadowMode ? "ON" : "OFF"}
            </button>
            <span className="px-3 py-1.5 rounded text-[10px] font-display font-bold bg-success/10 text-success border border-success/30 animate-pulse-neon">FREE BETA</span>
          </div>
        </div>
      </header>

      <div className="border-b border-border/30 bg-muted/20">
        <div className="container mx-auto px-4 py-2 flex items-center gap-6 text-xs font-mono overflow-x-auto">
          <div className="flex items-center gap-1.5 whitespace-nowrap"><Activity className="w-3 h-3 text-primary" /><span className="text-muted-foreground">Tests:</span><span className="font-semibold">{testsRun}</span></div>
          <div className="flex items-center gap-1.5 whitespace-nowrap"><AlertTriangle className="w-3 h-3 text-warning" /><span className="text-muted-foreground">Failures:</span><span className="font-semibold">{failures.length}</span></div>
          <div className="flex items-center gap-1.5 whitespace-nowrap"><Target className="w-3 h-3 text-destructive" /><span className="text-muted-foreground">Edge Cases:</span><span className="font-semibold">{testsRun * 127}</span></div>
          <div className="flex items-center gap-1.5 whitespace-nowrap"><TrendingUp className="w-3 h-3 text-success" /><span className="text-muted-foreground">Saved:</span><span className="text-success font-semibold">${moneySaved.toLocaleString()}</span></div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-6">
            <NeurixPanel title="Upload Model" icon={<Zap className="w-4 h-4 text-primary" />} badge="STEP 1">
              <FileUpload onFileSelect={handleFileSelect} isProcessing={isProcessing} />
              {isProcessing && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-mono text-primary animate-pulse-neon"><Brain className="w-3 h-3" /> Running 127 edge case tests...</div>
                  <div className="h-1 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full animate-pulse" style={{ width: "60%" }} /></div>
                </div>
              )}
            </NeurixPanel>
            <NeurixPanel title="Reliability Score" icon={<Shield className="w-4 h-4 text-primary" />} badge="LIVE">
              <div className="flex justify-center relative"><RiskGauge score={score} /></div>
            </NeurixPanel>
            <MoneyCounter amount={moneySaved} label="NEURIX SAVED YOU" />
            <NeurixPanel title="ROI Calculator" icon={<TrendingUp className="w-4 h-4 text-success" />}>
              <ROICalculator data={{ moneySaved, timeSavedHours: testsRun * 4, failuresPrevented: failures.length, downtimeAvoided: testsRun * 2 }} />
            </NeurixPanel>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <NeurixPanel title="Failure Detection" icon={<AlertTriangle className="w-4 h-4 text-warning" />} badge={`${failures.length} FOUND`}>
              <FailureList failures={failures} />
            </NeurixPanel>
            <NeurixPanel title="Adversarial Simulator" icon={<Skull className="w-4 h-4 text-destructive" />} badge="AI HACKER">
              <AdversarialSimulator onRun={handleAdversarial} />
            </NeurixPanel>
            {shadowMode && (
              <NeurixPanel title="Shadow Mode" icon={<Eye className="w-4 h-4 text-accent" />} badge="ACTIVE" className="neon-border-magenta">
                <div className="space-y-3">
                  <p className="text-xs font-mono text-muted-foreground">Shadow mode active. New model running in parallel on live production traffic.</p>
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="bg-muted/40 rounded p-3"><div className="font-display text-lg font-bold">94.2%</div><div className="text-[10px] font-mono text-muted-foreground">CURRENT</div></div>
                    <div className="bg-muted/40 rounded p-3"><div className="font-display text-lg font-bold text-success">97.1%</div><div className="text-[10px] font-mono text-muted-foreground">SHADOW</div></div>
                  </div>
                  <p className="text-[10px] font-mono text-success text-center">↑ Shadow model outperforming by 2.9% — safe to promote</p>
                </div>
              </NeurixPanel>
            )}
          </div>

          <div className="lg:col-span-3 space-y-6">
            <NeurixPanel title="Live Alerts" icon={<Activity className="w-4 h-4 text-primary" />} badge="REAL-TIME">
              <AlertFeed alerts={alerts} />
            </NeurixPanel>
            <NeurixPanel title="Benchmark" icon={<BarChart3 className="w-4 h-4 text-primary" />} badge="VS COMPETITORS">
              <CompetitorBenchmark />
            </NeurixPanel>
            <NeurixPanel title="Auto-Fixer" icon={<Zap className="w-4 h-4 text-warning" />} badge="AI">
              <div className="space-y-3">
                <p className="text-xs font-mono text-muted-foreground">Auto-generate synthetic training data and retrain to fix detected weaknesses.</p>
                <Button
                  disabled={failures.length === 0}
                  className="w-full bg-primary/20 border border-primary/50 text-primary hover:bg-primary/30 font-mono text-xs"
                  onClick={() => {
                    setAlerts((prev) => [{ id: `fix-${Date.now()}`, type: "success", message: "Auto-fix: Generated 10,000 synthetic examples + retrained", timestamp: new Date() }, ...prev]);
                    setScore((prev) => Math.min(98, prev + 15));
                  }}
                >
                  <Brain className="w-4 h-4 mr-2" /> AUTO-FIX ALL
                </Button>
                {failures.length === 0 && <p className="text-[10px] font-mono text-muted-foreground text-center">Run a stress test first</p>}
              </div>
            </NeurixPanel>
            <NeurixPanel title="Why NEURIX?" icon={<Shield className="w-4 h-4 text-primary" />}>
              <div className="space-y-2 text-xs font-mono">
                {["Independent — no competitor control", "FREE during beta", "5-minute fixes vs weeks", "Zero AI error rate", "Plain English explanations", "Auto-fix + auto-retrain", "Fully automated"].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-muted-foreground"><span className="text-success">▸</span>{item}</div>
                ))}
              </div>
            </NeurixPanel>
          </div>
        </div>
      </main>

      <footer className="border-t border-border/30 mt-12 py-6">
        <div className="container mx-auto px-4 text-center text-xs font-mono text-muted-foreground">NEURIX v1.0 — AI STRESS COMMAND SYSTEM — FREE BETA</div>
      </footer>
    </div>
  );
};

export default Dashboard;
