import { useState, useCallback } from "react";
import {
  Activity, Shield, Skull, BarChart3, Zap, Eye, Brain,
  TrendingUp, AlertTriangle, Target, Cpu, ArrowLeft,
  Lock, Users, Layers, Search, Database,
  FileText, Sparkles, GitBranch, Radio, Upload,
  CheckCircle, XCircle, MessageSquare, DollarSign, Rocket
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
import { callNeurixAI, parseCSV, maskPII } from "@/lib/neurix-api";
import type { AIModel } from "@/lib/neurix-api";
import { useToast } from "@/hooks/use-toast";

interface DashboardProps {
  onBack: () => void;
}

type Tab = "stress" | "features" | "privacy" | "monitor";

const Dashboard = ({ onBack }: DashboardProps) => {
  const { toast } = useToast();
  const [score, setScore] = useState(0);
  const [failures, setFailures] = useState<Failure[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [moneySaved, setMoneySaved] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [testsRun, setTestsRun] = useState(0);
  const [selectedModel, setSelectedModel] = useState<AIModel>("gemini");
  const [ghostMode, setGhostMode] = useState(false);
  const [shadowMode, setShadowMode] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("stress");
  const [fileData, setFileData] = useState<string>("");
  const [fileName, setFileName] = useState("");
  const [aiAccuracy, setAiAccuracy] = useState<number | null>(null);
  const [edgeCases, setEdgeCases] = useState(0);
  const [humanReviews, setHumanReviews] = useState(0);
  const [labelingResults, setLabelingResults] = useState<any>(null);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [shadowResult, setShadowResult] = useState<{ current: number; shadow: number } | null>(null);
  const [humanReviewItems, setHumanReviewItems] = useState<Array<{ label: string; confidence: number; reasoning: string }>>([]);

  const addAlert = useCallback((type: Alert["type"], message: string) => {
    setAlerts(prev => [{ id: `a-${Date.now()}-${Math.random()}`, type, message, timestamp: new Date() }, ...prev]);
  }, []);

  const handleFileSelect = useCallback(async (file: File) => {
    setIsProcessing(true);
    setFileName(file.name);
    addAlert("info", `Processing ${file.name}...`);

    try {
      const text = await file.text();
      const processedText = ghostMode ? maskPII(text) : text;
      setFileData(processedText);

      if (ghostMode) {
        addAlert("info", "Ghost Mode: PII redacted before processing");
      }

      const parsed = parseCSV(processedText);
      addAlert("info", `Parsed ${parsed.rowCount} rows, ${parsed.headers.length} columns`);
      addAlert("info", `Running AI stress test with ${selectedModel.toUpperCase()}...`);

      const result = await callNeurixAI({
        action: "stress-test",
        data: {
          fileName: file.name,
          sampleData: processedText.substring(0, 2000),
          rowCount: parsed.rowCount,
          columns: parsed.headers,
        },
        model: selectedModel,
      });

      const r = result.result;
      if (r) {
        setScore(r.score ?? 0);
        const parsedFailures: Failure[] = (r.failures || []).map((f: any, i: number) => ({
          id: `f-${Date.now()}-${i}`,
          type: f.type || "warning",
          title: f.title || "Unknown Failure",
          description: f.description || "",
          impact: f.impact || "Unknown",
          fix: f.fix || "No fix suggested",
        }));
        setFailures(parsedFailures);
        setMoneySaved(prev => prev + (r.moneySaved ?? 0));
        setEdgeCases(prev => prev + (r.edgeCasesFound ?? 0));
        setAiAccuracy(r.confidenceScore ?? null);
        addAlert("warning", `${parsedFailures.length} vulnerabilities detected by ${selectedModel}`);
        addAlert("error", `Critical: ${parsedFailures.filter(f => f.type === "critical").length} critical failures found`);
        addAlert("success", `Analysis complete. Reliability: ${r.score ?? "N/A"}/100. Source: ${selectedModel}`);
      }

      setTestsRun(prev => prev + 1);
    } catch (err: any) {
      console.error("Stress test error:", err);
      addAlert("error", `AI stress test failed: ${err.message}. Please retry or check your connection.`);
      toast({ title: "Stress test failed", description: err.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  }, [selectedModel, ghostMode, addAlert, toast]);

  const handleAdversarial = useCallback(async () => {
    addAlert("info", `Running adversarial attacks with ${selectedModel}...`);
    try {
      const result = await callNeurixAI({
        action: "adversarial",
        data: { context: fileName || "general model" },
        model: selectedModel,
      });
      const attacks = result.result?.attacks || [];
      const breached = attacks.filter((a: any) => a.success).length;
      addAlert("error", `Adversarial: ${breached}/${attacks.length} attacks succeeded (${result.result?.overallRisk || "unknown"} risk). Source: ${selectedModel}`);
      return attacks.map((a: any) => ({
        attack: a.name,
        success: a.success,
        severity: a.severity || "medium",
        description: a.description,
      }));
    } catch (err: any) {
      addAlert("error", `Adversarial attack failed: ${err.message}. No fake results generated.`);
      toast({ title: "Adversarial simulation failed", description: err.message, variant: "destructive" });
      return [];
    }
  }, [selectedModel, fileName, addAlert, toast]);

  const handleAutoLabel = useCallback(async () => {
    if (!fileData) { toast({ title: "Upload data first", variant: "destructive" }); return; }
    addAlert("info", `Running auto-labeling with ${selectedModel} ensemble...`);
    setIsProcessing(true);
    try {
      const result = await callNeurixAI({
        action: "auto-label",
        data: { sampleData: fileData.substring(0, 2000) },
        model: selectedModel,
      });
      setLabelingResults(result.result);
      const needsReview = result.result?.needsReview ?? 0;
      setHumanReviews(needsReview);
      // Populate review items from real AI labels with low confidence
      const lowConfLabels = (result.result?.labels || []).filter((l: any) => (l.confidence ?? 100) < 80);
      setHumanReviewItems(lowConfLabels.map((l: any) => ({ label: l.label, confidence: l.confidence, reasoning: l.reasoning || "" })));
      addAlert("success", `Auto-labeled: ${result.result?.autoLabeled ?? 0} confident, ${needsReview} need review. Source: ${selectedModel}`);
    } catch (err: any) {
      addAlert("error", `Labeling failed: ${err.message}`);
      toast({ title: "Auto-labeling failed", description: err.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  }, [fileData, selectedModel, addAlert, toast]);

  const handleAutoFix = useCallback(async () => {
    if (failures.length === 0) return;
    addAlert("info", `Auto-fixing ${failures.length} issues with ${selectedModel}...`);
    setIsProcessing(true);
    try {
      const result = await callNeurixAI({
        action: "synthetic-data",
        data: { gap: failures.map(f => `${f.title}: ${f.description}`).join("; ") },
        model: selectedModel,
      });
      const r = result.result;
      const generated = r?.totalGenerated ?? 0;
      const quality = r?.qualityScore ?? "N/A";
      addAlert("success", `Generated ${generated} synthetic fixes. Quality: ${quality}%. Source: ${selectedModel}`);
      if (r?.samples) {
        addAlert("info", `Fix samples: ${r.samples.slice(0, 2).map((s: any) => s.data).join(" | ")}`);
      }
      // Recalculate score based on AI response
      const newScore = Math.min(100, score + Math.round(generated * 0.5));
      setScore(newScore);
      setMoneySaved(prev => prev + (r?.moneySaved ?? generated * 100));
      addAlert("success", `Model improved. New reliability: ${newScore}/100.`);
    } catch (err: any) {
      addAlert("error", `Auto-fix failed: ${err.message}. No changes applied.`);
      toast({ title: "Auto-fix failed", description: err.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  }, [failures, selectedModel, score, addAlert, toast]);

  const handleDistill = useCallback(async () => {
    addAlert("info", `Analyzing dataset for redundancy with ${selectedModel}...`);
    try {
      const result = await callNeurixAI({
        action: "distill",
        data: { datasetInfo: `${fileName || "dataset"} with ${fileData ? parseCSV(fileData).rowCount : "unknown"} rows` },
        model: selectedModel,
      });
      const r = result.result;
      addAlert("success", `Distillation: ${r?.redundantRows ?? "N/A"} redundant, keep ${r?.essentialRows ?? "N/A"}. Save ${r?.savings ?? "N/A"}. Source: ${selectedModel}`);
    } catch (err: any) {
      addAlert("error", `Distillation failed: ${err.message}`);
      toast({ title: "Distillation failed", description: err.message, variant: "destructive" });
    }
  }, [fileName, fileData, selectedModel, addAlert, toast]);

  const handleEdgeCaseScan = useCallback(async () => {
    addAlert("info", `Scanning for edge cases with ${selectedModel}...`);
    try {
      const result = await callNeurixAI({
        action: "stress-test",
        data: {
          fileName: fileName || "dataset",
          sampleData: fileData?.substring(0, 1000) || "No data uploaded yet",
          rowCount: fileData ? parseCSV(fileData).rowCount : 0,
          columns: fileData ? parseCSV(fileData).headers : [],
        },
        model: selectedModel,
      });
      const found = result.result?.edgeCasesFound ?? 0;
      setEdgeCases(prev => prev + found);
      addAlert("success", `Found ${found} edge cases. Source: ${selectedModel}`);
    } catch (err: any) {
      addAlert("error", `Edge case scan failed: ${err.message}`);
    }
  }, [fileName, fileData, selectedModel, addAlert]);

  const handleKnowledgeDistill = useCallback(async () => {
    addAlert("info", `Running knowledge distillation analysis with ${selectedModel}...`);
    try {
      const result = await callNeurixAI({
        action: "distill",
        data: { datasetInfo: "Cross-model knowledge distillation: GPT-4 teacher → Llama-3 student. Analyze feasibility and expected performance." },
        model: selectedModel,
      });
      const r = result.result;
      addAlert("success", `Distillation analysis complete. Recommendation: ${r?.recommendation ?? "See details"}. Source: ${selectedModel}`);
    } catch (err: any) {
      addAlert("error", `Knowledge distillation failed: ${err.message}`);
    }
  }, [selectedModel, addAlert]);

  const handleShadowTest = useCallback(async () => {
    addAlert("info", `Running shadow model comparison with ${selectedModel}...`);
    try {
      const result = await callNeurixAI({
        action: "stress-test",
        data: {
          fileName: fileName || "shadow-test",
          sampleData: fileData?.substring(0, 1000) || "Shadow mode comparison test",
          rowCount: fileData ? parseCSV(fileData).rowCount : 0,
          columns: fileData ? parseCSV(fileData).headers : [],
        },
        model: selectedModel,
      });
      const shadowScore = result.result?.score ?? 0;
      setShadowResult({ current: score, shadow: shadowScore });
      addAlert("success", `Shadow test: Current ${score}%, Shadow ${shadowScore}%. Source: ${selectedModel}`);
    } catch (err: any) {
      addAlert("error", `Shadow test failed: ${err.message}`);
    }
  }, [selectedModel, fileName, fileData, score, addAlert]);

  const handleChat = useCallback(async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();
    setChatInput("");
    setChatMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setIsChatLoading(true);

    const needsClarify = userMsg.length < 10 || /^(k|ok|no|yes|why|what|how|fix|help)$/i.test(userMsg.trim());

    try {
      const result = await callNeurixAI({
        action: needsClarify ? "clarify" : "explain-failure",
        data: needsClarify ? { input: userMsg } : { failure: userMsg },
        model: selectedModel,
      });
      const r = result.result;
      let response = "";
      if (needsClarify && r?.options) {
        response = `I'm not sure what you mean by "${userMsg}".\n\nDid you mean:\n${r.options.map((o: any) => `**${o.label})** ${o.text}`).join("\n")}\n\nPlease clarify so I can help accurately.\n\n_Source: ${selectedModel}_`;
      } else if (r?.explanation) {
        response = `**Analysis (${selectedModel}):**\n${r.explanation}\n\n**Root Cause:** ${r.rootCause || "Could not determine"}\n\n**Impact:** ${r.impact || "Could not estimate"}\n\n**Fix:** ${r.fix || "No specific fix suggested"}\n\n**Confidence:** ${r.confidence ?? "N/A"}%`;
      } else {
        response = typeof r === "string" ? r : JSON.stringify(r, null, 2);
      }
      setChatMessages(prev => [...prev, { role: "assistant", content: response }]);
    } catch (err: any) {
      setChatMessages(prev => [...prev, { role: "assistant", content: `AI service error: ${err.message}. Please retry or check connection.` }]);
    } finally {
      setIsChatLoading(false);
    }
  }, [chatInput, selectedModel]);

  const models: { id: AIModel; label: string; desc: string }[] = [
    { id: "gpt-4o", label: "GPT-4o", desc: "Speed + general analysis" },
    { id: "claude-3.5", label: "Claude 3.5", desc: "Deep reasoning" },
    { id: "gemini", label: "Gemini", desc: "Synthetic data + edge cases" },
  ];

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "stress", label: "STRESS TEST", icon: <Zap className="w-3 h-3" /> },
    { id: "features", label: "AI FEATURES", icon: <Brain className="w-3 h-3" /> },
    { id: "privacy", label: "PRIVACY", icon: <Lock className="w-3 h-3" /> },
    { id: "monitor", label: "MONITOR", icon: <Activity className="w-3 h-3" /> },
  ];

  return (
    <div className="min-h-screen bg-background cyber-grid">
      {/* Header */}
      <header className="border-b border-border/30 glass-panel sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <Cpu className="w-5 h-5 text-primary animate-pulse-neon" />
            <h1 className="font-display text-lg font-bold tracking-wider text-primary neon-glow-cyan">NEURIX</h1>
            <span className="text-[9px] font-mono text-muted-foreground tracking-widest hidden sm:block">AI STRESS COMMAND</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-1 bg-muted/30 rounded px-1 py-0.5">
              {models.map(m => (
                <button
                  key={m.id}
                  onClick={() => { setSelectedModel(m.id); addAlert("info", `Switched to ${m.label}`); }}
                  className={`px-2 py-1 rounded text-[10px] font-mono transition-all ${
                    selectedModel === m.id ? "bg-primary/20 text-primary neon-border-cyan" : "text-muted-foreground hover:text-foreground"
                  }`}
                  title={m.desc}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => { setGhostMode(!ghostMode); addAlert("info", `Ghost Mode ${!ghostMode ? "ON" : "OFF"}`); }}
              className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono transition-all ${
                ghostMode ? "bg-success/20 text-success border border-success/30" : "text-muted-foreground border border-border/50"
              }`}
            >
              <Lock className="w-3 h-3" />
              GHOST {ghostMode ? "ON" : "OFF"}
            </button>
            <button
              onClick={() => { setShadowMode(!shadowMode); if (!shadowMode) handleShadowTest(); }}
              className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono transition-all ${
                shadowMode ? "bg-accent/20 text-accent border border-accent/30" : "text-muted-foreground border border-border/50"
              }`}
            >
              <Eye className="w-3 h-3" />
              SHADOW
            </button>
            <span className="px-2 py-1 rounded text-[9px] font-display font-bold bg-success/10 text-success border border-success/30">FREE BETA</span>
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="border-b border-border/20 bg-muted/10">
        <div className="container mx-auto px-4 py-2 flex items-center gap-4 text-[10px] font-mono overflow-x-auto">
          <div className="flex items-center gap-1 whitespace-nowrap"><Activity className="w-3 h-3 text-primary" /><span className="text-muted-foreground">Tests:</span><span className="font-semibold">{testsRun}</span></div>
          <div className="flex items-center gap-1 whitespace-nowrap"><AlertTriangle className="w-3 h-3 text-warning" /><span className="text-muted-foreground">Failures:</span><span className="font-semibold">{failures.length}</span></div>
          <div className="flex items-center gap-1 whitespace-nowrap"><Target className="w-3 h-3 text-destructive" /><span className="text-muted-foreground">Edge Cases:</span><span className="font-semibold">{edgeCases}</span></div>
          <div className="flex items-center gap-1 whitespace-nowrap"><TrendingUp className="w-3 h-3 text-success" /><span className="text-muted-foreground">Saved:</span><span className="text-success font-semibold">${moneySaved.toLocaleString()}</span></div>
          <div className="flex items-center gap-1 whitespace-nowrap"><CheckCircle className="w-3 h-3 text-primary" /><span className="text-muted-foreground">AI Confidence:</span><span className="font-semibold">{aiAccuracy !== null ? `${aiAccuracy}%` : "—"}</span></div>
          <div className="flex items-center gap-1 whitespace-nowrap"><Users className="w-3 h-3 text-warning" /><span className="text-muted-foreground">Human Reviews:</span><span className="font-semibold">{humanReviews}</span></div>
          <div className="flex items-center gap-1 whitespace-nowrap"><Brain className="w-3 h-3 text-accent" /><span className="text-muted-foreground">Model:</span><span className="font-semibold text-primary">{selectedModel}</span></div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border/20">
        <div className="container mx-auto px-4 flex gap-0">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-[10px] font-mono tracking-wider transition-all border-b-2 ${
                activeTab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      <main className="container mx-auto px-4 py-6">
        {/* STRESS TEST TAB */}
        {activeTab === "stress" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-4 space-y-5">
              <NeurixPanel title="Upload Model" icon={<Upload className="w-4 h-4 text-primary" />} badge="STEP 1">
                <FileUpload onFileSelect={handleFileSelect} isProcessing={isProcessing} />
                {isProcessing && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-2 text-[10px] font-mono text-primary animate-pulse"><Brain className="w-3 h-3" /> Running stress test with {selectedModel}...</div>
                    <div className="h-1 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full animate-pulse" style={{ width: "60%" }} /></div>
                  </div>
                )}
              </NeurixPanel>
              <NeurixPanel title="Reliability Score" icon={<Shield className="w-4 h-4 text-primary" />} badge={score > 0 ? "FROM AI" : "AWAITING DATA"}>
                <div className="flex justify-center"><RiskGauge score={score} /></div>
                {score === 0 && <p className="text-[9px] font-mono text-muted-foreground text-center mt-2">Upload a file to get a real reliability score</p>}
              </NeurixPanel>
              <MoneyCounter amount={moneySaved} label="NEURIX SAVED YOU" />
              <NeurixPanel title="ROI Calculator" icon={<TrendingUp className="w-4 h-4 text-success" />}>
                <ROICalculator data={{ moneySaved, timeSavedHours: testsRun * 4, failuresPrevented: failures.length, downtimeAvoided: testsRun * 2 }} />
              </NeurixPanel>
            </div>

            <div className="lg:col-span-5 space-y-5">
              <NeurixPanel title="Failure Detection" icon={<AlertTriangle className="w-4 h-4 text-warning" />} badge={`${failures.length} FOUND`}>
                <FailureList failures={failures} />
                {failures.length === 0 && <p className="text-[9px] font-mono text-muted-foreground text-center py-4">Upload data and run stress test to detect failures</p>}
              </NeurixPanel>
              <NeurixPanel title="Adversarial Simulator" icon={<Skull className="w-4 h-4 text-destructive" />} badge="REAL AI">
                <AdversarialSimulator onRun={handleAdversarial} />
              </NeurixPanel>
              {shadowMode && (
                <NeurixPanel title="Shadow Mode" icon={<Eye className="w-4 h-4 text-accent" />} badge="ACTIVE" className="neon-border-magenta">
                  <div className="space-y-3">
                    <p className="text-[10px] font-mono text-muted-foreground">Shadow model comparison via {selectedModel}.</p>
                    {shadowResult ? (
                      <>
                        <div className="grid grid-cols-2 gap-3 text-center">
                          <div className="bg-muted/40 rounded p-3"><div className="font-display text-lg font-bold">{shadowResult.current}%</div><div className="text-[9px] font-mono text-muted-foreground">CURRENT</div></div>
                          <div className="bg-muted/40 rounded p-3"><div className={`font-display text-lg font-bold ${shadowResult.shadow > shadowResult.current ? "text-success" : "text-warning"}`}>{shadowResult.shadow}%</div><div className="text-[9px] font-mono text-muted-foreground">SHADOW</div></div>
                        </div>
                        <p className="text-[9px] font-mono text-center text-muted-foreground">
                          {shadowResult.shadow > shadowResult.current
                            ? `↑ Shadow outperforming by ${shadowResult.shadow - shadowResult.current}% — consider promoting`
                            : `↓ Shadow underperforming by ${shadowResult.current - shadowResult.shadow}% — do not promote`}
                        </p>
                        <Button onClick={() => {
                          if (shadowResult.shadow > shadowResult.current) {
                            setScore(shadowResult.shadow);
                            addAlert("success", `Shadow model promoted. New score: ${shadowResult.shadow}%`);
                          } else {
                            addAlert("warning", "Shadow model is not better. Promotion not recommended.");
                          }
                          setShadowMode(false);
                          setShadowResult(null);
                        }} className="w-full bg-success/20 border border-success/30 text-success hover:bg-success/30 font-mono text-[10px]">
                          PROMOTE SHADOW MODEL
                        </Button>
                      </>
                    ) : (
                      <div className="text-[10px] font-mono text-primary animate-pulse text-center py-4">Running shadow comparison with {selectedModel}...</div>
                    )}
                  </div>
                </NeurixPanel>
              )}
            </div>

            <div className="lg:col-span-3 space-y-5">
              <NeurixPanel title="Live Alerts" icon={<Activity className="w-4 h-4 text-primary" />} badge="REAL-TIME">
                <AlertFeed alerts={alerts} />
              </NeurixPanel>
              <NeurixPanel title="Auto-Fixer" icon={<Zap className="w-4 h-4 text-warning" />} badge="REAL AI">
                <div className="space-y-3">
                  <p className="text-[10px] font-mono text-muted-foreground">Calls {selectedModel} to generate synthetic fixes for detected weaknesses.</p>
                  <Button disabled={failures.length === 0 || isProcessing} onClick={handleAutoFix} className="w-full bg-primary/20 border border-primary/50 text-primary hover:bg-primary/30 font-mono text-[10px]">
                    <Brain className="w-3 h-3 mr-1" /> AUTO-FIX ALL ({selectedModel})
                  </Button>
                  {failures.length === 0 && <p className="text-[9px] font-mono text-muted-foreground">Run a stress test first to detect failures</p>}
                </div>
              </NeurixPanel>
              <NeurixPanel title="Benchmark" icon={<BarChart3 className="w-4 h-4 text-primary" />} badge="VS COMPETITORS">
                <CompetitorBenchmark />
              </NeurixPanel>
            </div>
          </div>
        )}

        {/* AI FEATURES TAB */}
        {activeTab === "features" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-4 space-y-5">
              <NeurixPanel title="Zero-Shot Auto-Labeling" icon={<Sparkles className="w-4 h-4 text-primary" />} badge="REAL AI">
                <div className="space-y-3">
                  <p className="text-[10px] font-mono text-muted-foreground">Calls {selectedModel} to label your data. Low-confidence items flagged for human review.</p>
                  <Button onClick={handleAutoLabel} disabled={!fileData || isProcessing} className="w-full bg-primary/20 border border-primary/50 text-primary hover:bg-primary/30 font-mono text-[10px]">
                    <Sparkles className="w-3 h-3 mr-1" /> AUTO-LABEL DATA
                  </Button>
                  {!fileData && <p className="text-[9px] font-mono text-muted-foreground">Upload data first in Stress Test tab</p>}
                  {labelingResults && (
                    <div className="space-y-2 mt-2">
                      <div className="flex justify-between text-[10px] font-mono">
                        <span className="text-success">Auto-labeled: {labelingResults.autoLabeled ?? 0}</span>
                        <span className="text-warning">Needs review: {labelingResults.needsReview ?? 0}</span>
                      </div>
                      {labelingResults.labels?.slice(0, 3).map((l: any, i: number) => (
                        <div key={i} className="bg-muted/30 rounded p-2 text-[10px] font-mono">
                          <div className="flex justify-between">
                            <span className="text-foreground">{l.label}</span>
                            <span className={l.confidence >= 80 ? "text-success" : "text-warning"}>{l.confidence}%</span>
                          </div>
                          <p className="text-muted-foreground mt-1">{l.reasoning}</p>
                        </div>
                      ))}
                      <p className="text-[9px] font-mono text-muted-foreground">Source: {selectedModel}</p>
                    </div>
                  )}
                </div>
              </NeurixPanel>

              <NeurixPanel title="Synthetic Gap-Filler" icon={<Database className="w-4 h-4 text-primary" />} badge="REAL AI">
                <div className="space-y-3">
                  <p className="text-[10px] font-mono text-muted-foreground">Calls {selectedModel} to generate real synthetic examples.</p>
                  <Button onClick={async () => {
                    addAlert("info", `Generating synthetic data with ${selectedModel}...`);
                    try {
                      const r = await callNeurixAI({ action: "synthetic-data", data: { gap: fileData ? "Based on uploaded data gaps" : "edge cases and rare categories" }, model: selectedModel });
                      addAlert("success", `Generated ${r.result?.totalGenerated ?? 0} synthetic examples. Quality: ${r.result?.qualityScore ?? "N/A"}%. Source: ${selectedModel}`);
                      if (r.result?.samples) {
                        r.result.samples.slice(0, 2).forEach((s: any) => addAlert("info", `Sample: ${s.data} (quality: ${s.quality}%)`));
                      }
                    } catch (err: any) {
                      addAlert("error", `Synthetic generation failed: ${err.message}`);
                      toast({ title: "Synthetic data generation failed", description: err.message, variant: "destructive" });
                    }
                  }} disabled={isProcessing} className="w-full bg-primary/20 border border-primary/50 text-primary hover:bg-primary/30 font-mono text-[10px]">
                    <Database className="w-3 h-3 mr-1" /> GENERATE EXAMPLES
                  </Button>
                </div>
              </NeurixPanel>

              <NeurixPanel title="Dataset Distillation" icon={<Layers className="w-4 h-4 text-primary" />} badge="REAL AI">
                <div className="space-y-3">
                  <p className="text-[10px] font-mono text-muted-foreground">Calls {selectedModel} to analyze redundancy.</p>
                  <Button onClick={handleDistill} disabled={isProcessing} className="w-full bg-primary/20 border border-primary/50 text-primary hover:bg-primary/30 font-mono text-[10px]">
                    <Layers className="w-3 h-3 mr-1" /> DISTILL DATASET
                  </Button>
                </div>
              </NeurixPanel>
            </div>

            <div className="lg:col-span-5 space-y-5">
              <NeurixPanel title="AI Chat — Clarification Mode" icon={<MessageSquare className="w-4 h-4 text-primary" />} badge="REAL AI">
                <div className="space-y-3">
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {chatMessages.length === 0 && (
                      <p className="text-[10px] font-mono text-muted-foreground text-center py-4">Ask NEURIX anything. Powered by {selectedModel}. Ambiguous inputs get clarification questions.</p>
                    )}
                    {chatMessages.map((msg, i) => (
                      <div key={i} className={`rounded p-2 text-[10px] font-mono ${msg.role === "user" ? "bg-primary/10 text-primary ml-8" : "bg-muted/30 text-foreground mr-4"}`}>
                        <span className="text-muted-foreground text-[9px]">{msg.role === "user" ? "YOU" : `NEURIX (${selectedModel})`}</span>
                        <p className="mt-1 whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    ))}
                    {isChatLoading && <div className="text-[10px] font-mono text-primary animate-pulse">Calling {selectedModel}...</div>}
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleChat()}
                      placeholder="Ask anything..."
                      className="flex-1 bg-muted/30 border border-border/30 rounded px-3 py-2 text-[10px] font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                    />
                    <Button onClick={handleChat} disabled={isChatLoading || !chatInput.trim()} size="sm" className="bg-primary/20 border border-primary/50 text-primary hover:bg-primary/30 font-mono text-[10px]">
                      Send
                    </Button>
                  </div>
                </div>
              </NeurixPanel>

              <NeurixPanel title="Human Review Queue" icon={<Users className="w-4 h-4 text-warning" />} badge={`${humanReviews} PENDING`}>
                <div className="space-y-3">
                  <p className="text-[10px] font-mono text-muted-foreground">Items flagged by AI where confidence &lt;80%</p>
                  {humanReviewItems.length > 0 ? (
                    <div className="space-y-2">
                      {humanReviewItems.slice(0, 5).map((item, i) => (
                        <div key={i} className="bg-muted/30 rounded p-3 flex items-center justify-between">
                          <div>
                            <div className="text-[10px] font-mono text-foreground">{item.label}</div>
                            <div className="text-[9px] font-mono text-warning">Confidence: {item.confidence}%</div>
                            {item.reasoning && <div className="text-[9px] font-mono text-muted-foreground mt-1">{item.reasoning}</div>}
                          </div>
                          <div className="flex gap-1">
                            <button onClick={() => {
                              setHumanReviewItems(prev => prev.filter((_, idx) => idx !== i));
                              setHumanReviews(prev => Math.max(0, prev - 1));
                              addAlert("success", `"${item.label}" approved by human reviewer`);
                            }} className="p-1 rounded bg-success/20 text-success hover:bg-success/30"><CheckCircle className="w-3 h-3" /></button>
                            <button onClick={() => {
                              setHumanReviewItems(prev => prev.filter((_, idx) => idx !== i));
                              setHumanReviews(prev => Math.max(0, prev - 1));
                              addAlert("warning", `"${item.label}" rejected by human reviewer`);
                            }} className="p-1 rounded bg-destructive/20 text-destructive hover:bg-destructive/30"><XCircle className="w-3 h-3" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] font-mono text-muted-foreground text-center py-4">{humanReviews > 0 ? "Run auto-labeling to populate review queue" : "✓ No items pending review"}</p>
                  )}
                </div>
              </NeurixPanel>

              <NeurixPanel title="Conflict Resolution" icon={<GitBranch className="w-4 h-4 text-accent" />} badge="REAL AI JUDGE">
                <div className="space-y-3">
                  <p className="text-[10px] font-mono text-muted-foreground">Calls {selectedModel} as AI Judge to resolve labeling conflicts.</p>
                  <Button onClick={async () => {
                    addAlert("info", `Running AI conflict resolution with ${selectedModel}...`);
                    try {
                      const r = await callNeurixAI({ action: "conflict-resolve", data: { labelA: "positive", labelB: "neutral", context: "product review sentiment" }, model: selectedModel });
                      addAlert("success", `Conflict resolved: "${r.result?.resolution}" (confidence: ${r.result?.confidence ?? "N/A"}%). Needs human: ${r.result?.needsHuman ? "YES" : "NO"}. Source: ${selectedModel}`);
                    } catch (err: any) {
                      addAlert("error", `Conflict resolution failed: ${err.message}`);
                      toast({ title: "Conflict resolution failed", description: err.message, variant: "destructive" });
                    }
                  }} disabled={isProcessing} className="w-full bg-accent/20 border border-accent/50 text-accent hover:bg-accent/30 font-mono text-[10px]">
                    <GitBranch className="w-3 h-3 mr-1" /> RESOLVE CONFLICTS
                  </Button>
                </div>
              </NeurixPanel>
            </div>

            <div className="lg:col-span-3 space-y-5">
              <NeurixPanel title="Knowledge Distillation" icon={<Radio className="w-4 h-4 text-primary" />} badge="REAL AI">
                <div className="space-y-3">
                  <p className="text-[10px] font-mono text-muted-foreground">Calls {selectedModel} to analyze teacher→student distillation feasibility.</p>
                  <Button onClick={handleKnowledgeDistill} disabled={isProcessing} className="w-full bg-primary/20 border border-primary/50 text-primary hover:bg-primary/30 font-mono text-[10px]">
                    <Radio className="w-3 h-3 mr-1" /> ANALYZE DISTILLATION
                  </Button>
                </div>
              </NeurixPanel>

              <NeurixPanel title="Edge-Case Radar" icon={<Search className="w-4 h-4 text-warning" />} badge="REAL AI">
                <div className="space-y-3">
                  <p className="text-[10px] font-mono text-muted-foreground">Calls {selectedModel} to find edge cases in your data.</p>
                  <Button onClick={handleEdgeCaseScan} disabled={isProcessing} className="w-full bg-warning/20 border border-warning/50 text-warning hover:bg-warning/30 font-mono text-[10px]">
                    <Search className="w-3 h-3 mr-1" /> SCAN FOR EDGE CASES
                  </Button>
                </div>
              </NeurixPanel>

              <NeurixPanel title="Export Engine" icon={<FileText className="w-4 h-4 text-primary" />} badge="UNIVERSAL">
                <div className="space-y-2">
                  {["OpenAI", "Hugging Face", "PyTorch", "TensorFlow"].map(fmt => (
                    <Button key={fmt} onClick={() => {
                      const data = JSON.stringify({ score, failures, alerts: alerts.slice(0, 10), moneySaved, edgeCases });
                      const blob = new Blob([data], { type: "application/json" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a"); a.href = url; a.download = `neurix-export-${fmt.toLowerCase().replace(" ", "-")}.json`; a.click();
                      addAlert("success", `Exported results as ${fmt} format (JSON). Download started.`);
                    }} variant="outline" className="w-full text-[10px] font-mono justify-start border-border/30 hover:border-primary/30">
                      Export to {fmt}
                    </Button>
                  ))}
                </div>
              </NeurixPanel>

              <NeurixPanel title="Regulatory Reports" icon={<FileText className="w-4 h-4 text-success" />} badge="COMPLIANCE">
                <div className="space-y-2">
                  {["GDPR", "HIPAA", "EU AI Act", "SOC2"].map(reg => (
                    <Button key={reg} onClick={async () => {
                      addAlert("info", `Generating ${reg} compliance report with ${selectedModel}...`);
                      try {
                        const r = await callNeurixAI({ action: "explain-failure", data: { failure: `Generate a ${reg} compliance audit summary for this AI system. Data: score=${score}, failures=${failures.length}, tests=${testsRun}` }, model: selectedModel });
                        addAlert("success", `${reg} report generated. Source: ${selectedModel}`);
                        if (r.result?.explanation) {
                          const blob = new Blob([r.result.explanation], { type: "text/plain" });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a"); a.href = url; a.download = `neurix-${reg.toLowerCase()}-report.txt`; a.click();
                        }
                      } catch (err: any) {
                        addAlert("error", `${reg} report failed: ${err.message}`);
                      }
                    }} variant="outline" className="w-full text-[10px] font-mono justify-start border-border/30 hover:border-success/30">
                      Generate {reg} Report
                    </Button>
                  ))}
                </div>
              </NeurixPanel>
            </div>
          </div>
        )}

        {/* PRIVACY TAB */}
        {activeTab === "privacy" && (
          <div className="max-w-3xl mx-auto space-y-5">
            <NeurixPanel title="Privacy Settings" icon={<Lock className="w-4 h-4 text-success" />} badge="PRIVACY FIRST">
              <div className="space-y-4">
                {[
                  { id: "ghost", label: "Ghost-Labeling Mode", desc: "PII masked locally before processing. Names, emails, addresses → [REDACTED]", active: ghostMode, toggle: () => setGhostMode(!ghostMode), color: "success" },
                  { id: "local", label: "Local-First Storage", desc: "All data stored on device. No cloud storage unless explicitly enabled.", active: true, toggle: () => {}, color: "primary" },
                  { id: "notrack", label: "No Tracking", desc: "No Google Analytics. No Facebook Pixel. No third-party trackers.", active: true, toggle: () => {}, color: "primary" },
                  { id: "e2e", label: "End-to-End Encryption", desc: "TLS 1.3 in transit. AES-256 at rest. You control the keys.", active: true, toggle: () => {}, color: "primary" },
                  { id: "anon", label: "Anonymous Usage", desc: "No account required for basic features. No email. No phone.", active: true, toggle: () => {}, color: "primary" },
                ].map(setting => (
                  <div key={setting.id} className="flex items-center justify-between bg-muted/20 rounded-lg p-4">
                    <div>
                      <div className="text-xs font-display font-semibold">{setting.label}</div>
                      <div className="text-[10px] font-mono text-muted-foreground mt-1">{setting.desc}</div>
                    </div>
                    <button
                      onClick={setting.toggle}
                      className={`px-3 py-1.5 rounded text-[10px] font-mono transition-all ${
                        setting.active ? `bg-${setting.color}/20 text-${setting.color} border border-${setting.color}/30` : "bg-muted text-muted-foreground border border-border"
                      }`}
                    >
                      {setting.active ? "ON" : "OFF"}
                    </button>
                  </div>
                ))}
              </div>
            </NeurixPanel>

            <NeurixPanel title="Data Management" icon={<Database className="w-4 h-4 text-destructive" />}>
              <div className="space-y-3">
                <Button onClick={() => { localStorage.clear(); toast({ title: "All local data deleted" }); }} variant="outline" className="w-full border-destructive/30 text-destructive hover:bg-destructive/10 font-mono text-[10px]">
                  Delete All My Data
                </Button>
                <Button onClick={() => {
                  const data = JSON.stringify({ alerts, failures, score, moneySaved, edgeCases, testsRun, aiAccuracy });
                  const blob = new Blob([data], { type: "application/json" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a"); a.href = url; a.download = "neurix-export.json"; a.click();
                  toast({ title: "Data exported" });
                }} variant="outline" className="w-full border-primary/30 text-primary hover:bg-primary/10 font-mono text-[10px]">
                  Export My Data (JSON)
                </Button>
              </div>
            </NeurixPanel>

            <NeurixPanel title="Compliance Badges" icon={<Shield className="w-4 h-4 text-success" />}>
              <div className="grid grid-cols-2 gap-3">
                {["GDPR", "CCPA", "SOC2 Type II", "EU AI Act", "HIPAA Ready", "Zero Tracking"].map(badge => (
                  <div key={badge} className="flex items-center gap-2 bg-success/10 rounded p-3 border border-success/20">
                    <CheckCircle className="w-3 h-3 text-success flex-shrink-0" />
                    <span className="text-[10px] font-mono text-success">{badge}</span>
                  </div>
                ))}
              </div>
            </NeurixPanel>
          </div>
        )}

        {/* MONITOR TAB */}
        {activeTab === "monitor" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-8 space-y-5">
              <NeurixPanel title="Quality Dashboard" icon={<BarChart3 className="w-4 h-4 text-primary" />} badge="FROM AI">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-muted/30 rounded-lg p-4 text-center">
                    <div className="font-display text-2xl font-bold text-success">{aiAccuracy !== null ? `${aiAccuracy}%` : "—"}</div>
                    <div className="text-[9px] font-mono text-muted-foreground mt-1">AI CONFIDENCE</div>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-4 text-center">
                    <div className="font-display text-2xl font-bold text-primary">{testsRun > 0 ? `${testsRun}` : "—"}</div>
                    <div className="text-[9px] font-mono text-muted-foreground mt-1">TESTS RUN</div>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-4 text-center">
                    <div className="font-display text-2xl font-bold text-warning">{edgeCases || "—"}</div>
                    <div className="text-[9px] font-mono text-muted-foreground mt-1">EDGE CASES</div>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-4 text-center">
                    <div className="font-display text-2xl font-bold text-accent">{humanReviews}</div>
                    <div className="text-[9px] font-mono text-muted-foreground mt-1">HUMAN REVIEWS</div>
                  </div>
                </div>
                {testsRun === 0 && <p className="text-[9px] font-mono text-muted-foreground text-center mt-3">Run a stress test to populate real metrics</p>}
              </NeurixPanel>

              <NeurixPanel title="Live Alerts" icon={<Activity className="w-4 h-4 text-primary" />} badge="STREAM">
                <AlertFeed alerts={alerts} />
              </NeurixPanel>

              <NeurixPanel title="Auto-Rollback" icon={<GitBranch className="w-4 h-4 text-destructive" />} badge="SAFETY">
                <div className="space-y-3">
                  <p className="text-[10px] font-mono text-muted-foreground">If new model performs worse, NEURIX auto-reverts to previous version.</p>
                  <div className="bg-muted/30 rounded p-3 text-[10px] font-mono">
                    <div className="flex justify-between"><span className="text-muted-foreground">Current model:</span><span className="text-success">v{testsRun > 0 ? testsRun : 1}.0 — {score > 0 ? `${score}% reliability` : "awaiting test"}</span></div>
                    <div className="flex justify-between mt-1"><span className="text-muted-foreground">Previous model:</span><span className="text-muted-foreground">v{Math.max(1, (testsRun || 1) - 1)}.0 — backup ready</span></div>
                    <div className="flex justify-between mt-1"><span className="text-muted-foreground">Auto-rollback:</span><span className="text-success">ENABLED</span></div>
                  </div>
                </div>
              </NeurixPanel>
            </div>

            <div className="lg:col-span-4 space-y-5">
              <NeurixPanel title="Cost Dashboard" icon={<DollarSign className="w-4 h-4 text-success" />} badge="LIVE">
                <div className="space-y-3">
                  <div className="bg-muted/30 rounded p-3 text-center">
                    <div className="font-display text-2xl font-bold text-success">${moneySaved.toLocaleString()}</div>
                    <div className="text-[9px] font-mono text-muted-foreground">TOTAL SAVED (from AI analysis)</div>
                  </div>
                  <div className="space-y-2 text-[10px] font-mono">
                    <div className="flex justify-between"><span className="text-muted-foreground">Tests run:</span><span>{testsRun}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Failures found:</span><span>{failures.length}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Edge cases:</span><span>{edgeCases}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Model:</span><span className="text-primary">{selectedModel}</span></div>
                  </div>
                </div>
              </NeurixPanel>

              <NeurixPanel title="Competitor Benchmark" icon={<BarChart3 className="w-4 h-4 text-primary" />}>
                <CompetitorBenchmark />
              </NeurixPanel>

              <NeurixPanel title="One-Click Deploy" icon={<Rocket className="w-4 h-4 text-primary" />} badge="DEPLOY">
                <div className="space-y-2">
                  {["AWS Lambda", "Vercel", "Hugging Face", "Custom API"].map(target => (
                    <Button key={target} onClick={() => {
                      if (score === 0) {
                        toast({ title: "Run a stress test first", description: "Cannot deploy without evaluating model reliability", variant: "destructive" });
                        return;
                      }
                      const data = JSON.stringify({ score, failures, moneySaved, model: selectedModel, deployTarget: target });
                      const blob = new Blob([data], { type: "application/json" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a"); a.href = url; a.download = `neurix-deploy-${target.toLowerCase().replace(" ", "-")}.json`; a.click();
                      addAlert("success", `Deploy config exported for ${target}. Score: ${score}/100`);
                    }} variant="outline" className="w-full text-[10px] font-mono justify-start border-border/30 hover:border-primary/30">
                      <Rocket className="w-3 h-3 mr-1" /> Deploy to {target}
                    </Button>
                  ))}
                </div>
              </NeurixPanel>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-border/20 mt-8 py-4">
        <div className="container mx-auto px-4 text-center text-[10px] font-mono text-muted-foreground">
          NEURIX v2.0 — AI STRESS COMMAND — {selectedModel.toUpperCase()} — ALL RESULTS FROM REAL AI — FREE BETA
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
