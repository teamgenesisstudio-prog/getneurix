import { useMemo, useState } from "react";
import { storage, pushActivity } from "@/lib/v3/storage";
import { callV3 } from "@/lib/v3/api";
import { C, mono, sans, relTime, downloadJSON } from "@/lib/v3/ui";
import { Card, SectionLabel, Btn, Badge, Input, Textarea, Sparkline, Stat } from "./primitives";
import { Plus, Play, Trash2, AlertTriangle, Loader2 } from "lucide-react";

interface Test { id: string; prompt: string; expectedPattern: string; criteria: string; lastStatus?: "pass" | "fail" | "pending"; lastOutput?: string }
interface Run { id: string; timestamp: string; passRate: number; results: { testId: string; passed: boolean; output: string; latency: number }[] }
interface Suite { id: string; name: string; description: string; createdAt: string; baselineModel: string; tests: Test[]; runs: Run[] }

export default function Regression() {
  const [suites, setSuites] = useState<Suite[]>(() => storage.get("nx_regression_suites", []));
  const [selected, setSelected] = useState<string | null>(suites[0]?.id ?? null);
  const [running, setRunning] = useState(false);
  const [runIdx, setRunIdx] = useState(0);

  const persist = (next: Suite[]) => { setSuites(next); storage.set("nx_regression_suites", next); };
  const suite = useMemo(() => suites.find(s => s.id === selected) ?? null, [suites, selected]);

  const addSuite = () => {
    const s: Suite = { id: crypto.randomUUID(), name: "New Suite " + (suites.length + 1), description: "", createdAt: new Date().toISOString(), baselineModel: "gpt-4o", tests: [], runs: [] };
    persist([s, ...suites]); setSelected(s.id);
  };
  const updateSuite = (patch: Partial<Suite>) => {
    if (!suite) return;
    persist(suites.map(s => s.id === suite.id ? { ...s, ...patch } : s));
  };
  const deleteSuite = (id: string) => {
    const next = suites.filter(s => s.id !== id);
    persist(next); if (selected === id) setSelected(next[0]?.id ?? null);
  };
  const addTest = () => {
    if (!suite) return;
    updateSuite({ tests: [...suite.tests, { id: crypto.randomUUID(), prompt: "", expectedPattern: "", criteria: "" }] });
  };
  const updateTest = (id: string, patch: Partial<Test>) => {
    if (!suite) return;
    updateSuite({ tests: suite.tests.map(t => t.id === id ? { ...t, ...patch } : t) });
  };
  const deleteTest = (id: string) => {
    if (!suite) return;
    updateSuite({ tests: suite.tests.filter(t => t.id !== id) });
  };

  const runSuite = async () => {
    if (!suite || suite.tests.length === 0) return;
    setRunning(true); setRunIdx(0);
    const results: Run["results"] = [];
    const updatedTests: Test[] = [...suite.tests];
    for (let i = 0; i < suite.tests.length; i++) {
      setRunIdx(i);
      const t = suite.tests[i];
      try {
        const r = await callV3<{ output: string; passed: boolean; latencyMs: number }>("regression", { prompt: t.prompt, expectedPattern: t.expectedPattern, criteria: t.criteria });
        results.push({ testId: t.id, passed: r.passed, output: r.output, latency: r.latencyMs });
        updatedTests[i] = { ...t, lastStatus: r.passed ? "pass" : "fail", lastOutput: r.output };
      } catch {
        results.push({ testId: t.id, passed: false, output: "Run failed", latency: 0 });
        updatedTests[i] = { ...t, lastStatus: "fail", lastOutput: "Run failed" };
      }
    }
    const passRate = Math.round((results.filter(r => r.passed).length / results.length) * 100);
    const run: Run = { id: crypto.randomUUID(), timestamp: new Date().toISOString(), passRate, results };
    const nextSuite = { ...suite, tests: updatedTests, runs: [run, ...suite.runs].slice(0, 30) };
    persist(suites.map(s => s.id === suite.id ? nextSuite : s));
    pushActivity({ module: "regression", type: "suite_run", message: `${suite.name} — ${passRate}% pass`, severity: passRate >= 90 ? "success" : passRate >= 70 ? "warn" : "error" });
    setRunning(false);
  };

  const lastRun = suite?.runs[0];
  const prevRun = suite?.runs[1];
  const delta = lastRun && prevRun ? lastRun.passRate - prevRun.passRate : 0;
  const trend = suite?.runs.slice(0, 10).map(r => r.passRate).reverse() ?? [];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 16 }}>
      {/* LEFT — Suite list */}
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <SectionLabel>Test Suites</SectionLabel>
          <Btn onClick={addSuite} size="sm"><Plus size={11} style={{ marginRight: 4 }} />New</Btn>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {suites.length === 0 && <div style={{ ...mono, fontSize: 11, color: C.muted, padding: 20, textAlign: "center" }}>No suites yet</div>}
          {suites.map(s => {
            const active = s.id === selected;
            const last = s.runs[0]?.passRate;
            return (
              <div key={s.id} onClick={() => setSelected(s.id)}
                style={{ padding: 10, borderRadius: 6, background: active ? C.accent + "12" : C.surface2, border: `1px solid ${active ? C.accent + "55" : C.border}`, cursor: "pointer" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ ...sans, fontSize: 12, color: C.text, fontWeight: 600 }}>{s.name}</span>
                  <button onClick={(e) => { e.stopPropagation(); deleteSuite(s.id); }} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer" }}><Trash2 size={12} /></button>
                </div>
                <div style={{ ...mono, fontSize: 10, color: C.textDim, marginTop: 4, display: "flex", justifyContent: "space-between" }}>
                  <span>{s.tests.length} tests</span>
                  {last != null && <span style={{ color: last >= 90 ? C.success : last >= 70 ? C.warn : C.danger }}>{last}%</span>}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* RIGHT — Editor & runner */}
      <Card>
        {!suite ? (
          <div style={{ ...mono, padding: 60, textAlign: "center", color: C.muted, fontSize: 12 }}>Select or create a suite</div>
        ) : (
          <>
            {delta < -10 && (
              <div style={{ padding: 10, marginBottom: 14, background: C.danger + "14", border: `1px solid ${C.danger}55`, borderRadius: 6, color: C.danger, ...mono, fontSize: 11, display: "flex", alignItems: "center", gap: 8 }}>
                <AlertTriangle size={14} /> REGRESSION DETECTED — pass rate dropped {Math.abs(delta)}% from previous run
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
              <Input value={suite.name} onChange={e => updateSuite({ name: e.target.value })} placeholder="Suite name" />
              <Input value={suite.description} onChange={e => updateSuite({ description: e.target.value })} placeholder="Description" />
              <Input value={suite.baselineModel} onChange={e => updateSuite({ baselineModel: e.target.value })} placeholder="Baseline model" />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
              <Stat label="Last Pass Rate" value={(lastRun?.passRate ?? 0) + "%"} accent={(lastRun?.passRate ?? 0) >= 90 ? C.success : (lastRun?.passRate ?? 0) >= 70 ? C.warn : C.danger} />
              <Stat label="Delta vs Prev" value={(delta > 0 ? "+" : "") + delta + "%"} accent={delta >= 0 ? C.success : C.danger} />
              <div style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 8, padding: 12 }}>
                <div style={{ ...mono, fontSize: 9, color: C.muted, letterSpacing: 1.4, textTransform: "uppercase" }}>Trend</div>
                <Sparkline data={trend.length ? trend : [0]} color={C.accent} width={200} height={42} />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <SectionLabel>Tests ({suite.tests.length})</SectionLabel>
              <div style={{ display: "flex", gap: 6 }}>
                <Btn variant="ghost" size="sm" onClick={addTest}><Plus size={11} style={{ marginRight: 4 }} />Add Test</Btn>
                <Btn size="sm" onClick={runSuite} disabled={running || suite.tests.length === 0}>
                  {running ? <><Loader2 size={11} className="nx-spin" style={{ marginRight: 4 }} />Running {runIdx + 1}/{suite.tests.length}</> : <><Play size={11} style={{ marginRight: 4 }} />Run Suite</>}
                </Btn>
                <Btn variant="ghost" size="sm" onClick={() => downloadJSON(`suite-${suite.name}.json`, suite)}>Export</Btn>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 360, overflowY: "auto" }}>
              {suite.tests.map((t, i) => (
                <div key={t.id} style={{ padding: 10, background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 6, display: "grid", gridTemplateColumns: "20px 1fr 1fr 1fr 80px 20px", gap: 8, alignItems: "start" }}>
                  <span style={{ ...mono, fontSize: 11, color: C.muted, paddingTop: 6 }}>#{i + 1}</span>
                  <Textarea value={t.prompt} onChange={e => updateTest(t.id, { prompt: e.target.value })} placeholder="Prompt" style={{ minHeight: 60, fontSize: 11 }} />
                  <Input value={t.expectedPattern} onChange={e => updateTest(t.id, { expectedPattern: e.target.value })} placeholder="Expected pattern (regex/keywords)" style={{ fontSize: 11 }} />
                  <Input value={t.criteria} onChange={e => updateTest(t.id, { criteria: e.target.value })} placeholder="Pass criteria" style={{ fontSize: 11 }} />
                  <div style={{ paddingTop: 6 }}>
                    {t.lastStatus === "pass" && <Badge color={C.success}>PASS</Badge>}
                    {t.lastStatus === "fail" && <Badge color={C.danger}>FAIL</Badge>}
                    {!t.lastStatus && <Badge color={C.muted}>NEW</Badge>}
                  </div>
                  <button onClick={() => deleteTest(t.id)} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", paddingTop: 6 }}><Trash2 size={12} /></button>
                </div>
              ))}
              {suite.tests.length === 0 && <div style={{ ...mono, fontSize: 11, color: C.muted, padding: 20, textAlign: "center" }}>Add your first test</div>}
            </div>

            <div style={{ marginTop: 18 }}>
              <SectionLabel>Run History</SectionLabel>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {suite.runs.slice(0, 8).map(r => (
                  <div key={r.id} style={{ display: "grid", gridTemplateColumns: "120px 1fr 80px", padding: "6px 10px", background: C.surface2, borderRadius: 4, ...mono, fontSize: 11 }}>
                    <span style={{ color: C.textDim }}>{relTime(r.timestamp)}</span>
                    <span style={{ color: C.muted }}>{r.results.length} tests · {r.results.filter(x => x.passed).length} passed</span>
                    <span style={{ color: r.passRate >= 90 ? C.success : r.passRate >= 70 ? C.warn : C.danger, textAlign: "right", fontWeight: 600 }}>{r.passRate}%</span>
                  </div>
                ))}
                {suite.runs.length === 0 && <div style={{ ...mono, fontSize: 11, color: C.muted, padding: 10 }}>No runs yet</div>}
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
