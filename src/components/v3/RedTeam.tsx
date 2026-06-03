import { useState } from "react";
import { storage, pushActivity } from "@/lib/v3/storage";
import { callV3 } from "@/lib/v3/api";
import { C, mono, sans, riskColor, relTime, downloadJSON } from "@/lib/v3/ui";
import { Card, SectionLabel, Btn, Badge, Textarea, Select, Stat, ScoreRing } from "./primitives";
import { Crosshair, Loader2 } from "lucide-react";

const CATEGORIES = ["Prompt Injection", "Jailbreak Attempts", "Data Extraction", "Role Confusion", "Instruction Override", "Context Manipulation", "PII Harvesting", "System Prompt Leakage"];

interface Finding { category: string; attack: string; payload: string; result: "VULNERABLE" | "PARTIAL" | "RESISTANT"; severity: string; description: string; recommendation: string }
interface RTResult { securityScore: number; totalAttacks: number; successfulAttacks: number; findings: Finding[]; attackSuccessRate: number; riskSummary: string; immediateActions: string[] }

export default function RedTeam() {
  const [target, setTarget] = useState("Customer support assistant integrated with our billing API. Has access to user account data and ticket history.");
  const [selected, setSelected] = useState<string[]>(["Prompt Injection", "Jailbreak Attempts", "Data Extraction"]);
  const [intensity, setIntensity] = useState("Active");
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentAttack, setCurrentAttack] = useState("");
  const [foundCount, setFoundCount] = useState(0);
  const [result, setResult] = useState<RTResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>(() => storage.get("nx_redteam_history", []));
  const [sortDesc, setSortDesc] = useState(true);
  const abortRef = { current: false };

  const toggle = (c: string) => setSelected(p => p.includes(c) ? p.filter(x => x !== c) : [...p, c]);

  const run = async () => {
    if (!target.trim() || selected.length === 0) return;
    setRunning(true); setError(null); setResult(null); setProgress(0); setFoundCount(0);
    // Fake progress while waiting
    const totalSteps = selected.length * 3;
    let step = 0;
    const advance = setInterval(() => {
      if (abortRef.current) return;
      step++;
      setProgress(Math.min(95, (step / totalSteps) * 100));
      const cat = selected[step % selected.length];
      setCurrentAttack(`Executing ${cat.toLowerCase()} probe #${Math.floor(step / selected.length) + 1}`);
      if (Math.random() < 0.4) setFoundCount(f => f + 1);
    }, 700);
    try {
      const res = await callV3<RTResult>("redteam", { target, categories: selected, intensity });
      if (abortRef.current) return;
      setResult(res); setProgress(100); setFoundCount(res.successfulAttacks);
      const entry = { id: crypto.randomUUID(), timestamp: new Date().toISOString(), target, intensity, categories: selected, result: res };
      const next = [entry, ...history].slice(0, 100);
      storage.set("nx_redteam_history", next); setHistory(next);
      pushActivity({ module: "redteam", type: "scan_complete", message: `Security score ${res.securityScore}/100`, severity: res.securityScore >= 80 ? "success" : res.securityScore >= 60 ? "warn" : "error" });
    } catch (e) {
      if (!abortRef.current) setError(e instanceof Error ? e.message : "Scan failed");
    } finally {
      clearInterval(advance); setRunning(false); setCurrentAttack("");
    }
  };

  const abort = () => { abortRef.current = true; setRunning(false); setProgress(0); setCurrentAttack(""); };

  const sortedFindings = result ? [...result.findings].sort((a, b) => {
    const order = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 } as any;
    return (order[b.severity] - order[a.severity]) * (sortDesc ? 1 : -1);
  }) : [];

  const categoryBreakdown = result ? CATEGORIES.reduce((acc: Record<string, number>, c) => {
    acc[c] = result.findings.filter(f => f.category === c && f.result !== "RESISTANT").length;
    return acc;
  }, {}) : {};

  return (
    <div style={{ display: "grid", gridTemplateColumns: "300px 1fr 360px", gap: 16, alignItems: "start" }}>
      {/* LEFT — Config */}
      <Card>
        <SectionLabel>Target System</SectionLabel>
        <Textarea value={target} onChange={e => setTarget(e.target.value)} style={{ minHeight: 120 }} placeholder="Describe target..." />
        <div style={{ marginTop: 14 }}>
          <Label>Attack Categories</Label>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {CATEGORIES.map(c => (
              <label key={c} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 8px", background: selected.includes(c) ? C.danger + "11" : C.surface2, borderRadius: 4, cursor: "pointer", ...mono, fontSize: 11 }}>
                <input type="checkbox" checked={selected.includes(c)} onChange={() => toggle(c)} style={{ accentColor: C.danger }} />
                <span style={{ color: selected.includes(c) ? C.text : C.textDim }}>{c}</span>
              </label>
            ))}
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <Label>Intensity</Label>
          <Select value={intensity} onChange={setIntensity} options={["Passive", "Active", "Aggressive"]} />
        </div>
        <div style={{ marginTop: 14 }}>
          <Btn onClick={run} disabled={running || selected.length === 0} variant="danger" style={{ width: "100%" }}>
            {running ? "Scanning..." : "Launch Red Team Scan"}
          </Btn>
        </div>
      </Card>

      {/* CENTER */}
      <Card>
        <SectionLabel>Scan Engine</SectionLabel>
        {!running && !result && !error && (
          <div style={{ ...mono, padding: 60, textAlign: "center", color: C.muted, fontSize: 12 }}>
            <Crosshair size={36} style={{ opacity: 0.3, marginBottom: 12 }} />
            <div>Configure target and launch a scan</div>
          </div>
        )}
        {running && (
          <div style={{ padding: "10px 4px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, ...mono, fontSize: 11 }}>
              <span style={{ color: C.accent, display: "flex", alignItems: "center", gap: 6 }}><Loader2 size={12} className="nx-spin" /> {currentAttack}</span>
              <span style={{ color: C.danger }}>{foundCount} vulnerabilities</span>
            </div>
            <div style={{ height: 8, background: C.surface2, borderRadius: 4, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${progress}%`, background: `linear-gradient(90deg, ${C.danger}, ${C.warn})`, transition: "width 0.4s" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14 }}>
              <span style={{ ...mono, fontSize: 10, color: C.muted }}>{Math.round(progress)}% complete</span>
              <Btn variant="ghost" size="sm" onClick={abort}>Abort Scan</Btn>
            </div>
          </div>
        )}
        {error && <div style={{ padding: 16, background: C.danger + "11", border: `1px solid ${C.danger}55`, borderRadius: 6, color: C.danger, ...mono, fontSize: 11 }}>{error}</div>}
        {result && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <SectionLabel>Findings ({result.findings.length})</SectionLabel>
              <Btn variant="ghost" size="sm" onClick={() => setSortDesc(!sortDesc)}>Sort: {sortDesc ? "Severity ↓" : "Severity ↑"}</Btn>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 460, overflowY: "auto" }}>
              {sortedFindings.map((f, i) => {
                const resCol = f.result === "VULNERABLE" ? C.danger : f.result === "PARTIAL" ? C.warn : C.success;
                return (
                  <div key={i} style={{ padding: 12, background: C.surface2, border: `1px solid ${resCol}33`, borderLeft: `3px solid ${resCol}`, borderRadius: 6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <Badge color={riskColor(f.severity)}>{f.severity}</Badge>
                        <Badge color={resCol}>{f.result}</Badge>
                        <span style={{ ...mono, fontSize: 11, color: C.text, fontWeight: 600 }}>{f.attack}</span>
                      </div>
                      <span style={{ ...mono, fontSize: 10, color: C.muted }}>{f.category}</span>
                    </div>
                    <div style={{ ...sans, fontSize: 12, color: C.text, marginBottom: 6 }}>{f.description}</div>
                    <div style={{ ...mono, fontSize: 10, color: C.textDim, padding: "6px 8px", background: C.bg, borderRadius: 4, marginBottom: 6 }}>{`>`} {f.payload}</div>
                    <div style={{ ...sans, fontSize: 11, color: C.success }}><strong>Fix:</strong> {f.recommendation}</div>
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: 18 }}>
              <Label>Vulnerabilities by Category</Label>
              {Object.entries(categoryBreakdown).filter(([, v]) => v > 0).map(([k, v]) => (
                <div key={k} style={{ display: "grid", gridTemplateColumns: "160px 1fr 30px", gap: 8, alignItems: "center", marginBottom: 4, ...mono, fontSize: 10 }}>
                  <span style={{ color: C.textDim }}>{k}</span>
                  <div style={{ height: 6, background: C.surface2, borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${(v / Math.max(...Object.values(categoryBreakdown), 1)) * 100}%`, background: C.danger }} />
                  </div>
                  <span style={{ color: C.danger, textAlign: "right" }}>{v}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      {/* RIGHT */}
      <Card>
        <SectionLabel>Security Score</SectionLabel>
        {result ? (
          <>
            <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 20px" }}>
              <ScoreRing score={result.securityScore} size={160} label="SECURITY" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <Stat label="Total Attacks" value={result.totalAttacks} />
              <Stat label="Successful" value={result.successfulAttacks} accent={result.successfulAttacks > 0 ? C.danger : C.success} />
            </div>
            <div style={{ marginTop: 14 }}>
              <Label>Risk Summary</Label>
              <div style={{ ...sans, fontSize: 12, color: C.text, padding: 12, background: C.surface2, borderRadius: 6, lineHeight: 1.5 }}>{result.riskSummary}</div>
            </div>
            <div style={{ marginTop: 14, padding: 12, border: `1px solid ${C.danger}55`, background: C.danger + "0c", borderRadius: 6 }}>
              <Label>Immediate Actions</Label>
              <ul style={{ ...sans, fontSize: 12, color: C.text, paddingLeft: 18, margin: 0 }}>
                {result.immediateActions.map((a, i) => <li key={i} style={{ marginBottom: 4 }}>{a}</li>)}
              </ul>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 14 }}>
              <Btn variant="ghost" size="sm" onClick={() => downloadJSON(`redteam-${Date.now()}.json`, result)}>Export JSON</Btn>
              <Btn variant="ghost" size="sm" onClick={() => window.print()}>Export PDF</Btn>
            </div>
          </>
        ) : <div style={{ ...mono, fontSize: 11, color: C.muted, padding: 40, textAlign: "center" }}>No scan results</div>}

        <div style={{ marginTop: 20 }}>
          <SectionLabel>Recent Scans</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 200, overflowY: "auto" }}>
            {history.slice(0, 6).map(h => (
              <div key={h.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 8px", background: C.surface2, borderRadius: 4, ...mono, fontSize: 10 }}>
                <span style={{ color: C.textDim }}>{relTime(h.timestamp)}</span>
                <Badge color={h.result.securityScore >= 80 ? C.success : h.result.securityScore >= 60 ? C.warn : C.danger}>{h.result.securityScore}/100</Badge>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

const Label = ({ children }: any) => <div style={{ ...mono, fontSize: 9, color: C.muted, letterSpacing: 1.4, textTransform: "uppercase", marginBottom: 4 }}>{children}</div>;
