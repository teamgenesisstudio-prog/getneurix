import { useState } from "react";
import { storage, pushActivity } from "@/lib/v3/storage";
import { callV3 } from "@/lib/v3/api";
import { C, mono, sans, relTime } from "@/lib/v3/ui";
import { Card, SectionLabel, Btn, Badge, Textarea, Select, Stat } from "./primitives";
import { Wrench, Loader2, Copy } from "lucide-react";

interface RepairResult {
  repairedOutput: string;
  errorsDetected: { type: string; location: string; description: string }[];
  fixesApplied: { fix: string; confidence: number }[];
  validationStatus: "VALID" | "PARTIAL" | "FAILED";
  repairTime: number; confidence: number;
}

const STAGES = ["Parsing input", "Detecting errors", "Classifying damage", "Generating strategy", "Applying fixes", "Validating output", "Complete"];

export default function Repair() {
  const [input, setInput] = useState('{"name": "Acme Corp", "users": [\n  {"id": 1, "email": "ada@acme.com"},\n  {"id": 2, "email": "grace@acme.com",\n], "active": true,}');
  const [outputType, setOutputType] = useState("JSON");
  const [schema, setSchema] = useState("");
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState(0);
  const [result, setResult] = useState<RepairResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDiff, setShowDiff] = useState(false);
  const [history, setHistory] = useState<any[]>(() => storage.get("nx_repair_history", []));

  const run = async () => {
    if (!input.trim()) return;
    setLoading(true); setError(null); setResult(null); setStage(0);
    const interval = setInterval(() => setStage(s => Math.min(STAGES.length - 1, s + 1)), 400);
    try {
      const res = await callV3<RepairResult>("repair", { input, outputType, expectedSchema: schema });
      setResult(res);
      const entry = { id: crypto.randomUUID(), timestamp: new Date().toISOString(), input, outputType, result: res };
      const next = [entry, ...history].slice(0, 200);
      storage.set("nx_repair_history", next); setHistory(next);
      pushActivity({ module: "repair", type: "repair_complete", message: `${res.validationStatus} (${res.fixesApplied.length} fixes)`, severity: res.validationStatus === "VALID" ? "success" : "warn" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Repair failed");
    } finally {
      clearInterval(interval); setLoading(false); setStage(STAGES.length - 1);
    }
  };

  const statusColor = result ? (result.validationStatus === "VALID" ? C.success : result.validationStatus === "PARTIAL" ? C.warn : C.danger) : C.muted;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
      {/* LEFT */}
      <Card>
        <SectionLabel>Broken Input</SectionLabel>
        <Textarea value={input} onChange={e => setInput(e.target.value)} style={{ minHeight: 240 }} placeholder="Paste broken AI output..." />
        <div style={{ marginTop: 12 }}>
          <Label>Output Type</Label>
          <Select value={outputType} onChange={setOutputType} options={["JSON", "Markdown", "Structured Text", "Code"]} />
        </div>
        <div style={{ marginTop: 10 }}>
          <Label>Expected Schema (optional)</Label>
          <Textarea value={schema} onChange={e => setSchema(e.target.value)} placeholder='e.g. {"name": string, "users": array}' style={{ minHeight: 60, fontSize: 11 }} />
        </div>
        <div style={{ marginTop: 14 }}>
          <Btn onClick={run} disabled={loading} style={{ width: "100%" }}>{loading ? "Repairing..." : "Run Repair"}</Btn>
        </div>
      </Card>

      {/* CENTER — engine */}
      <Card>
        <SectionLabel>Repair Engine</SectionLabel>
        {!loading && !result && !error && (
          <div style={{ ...mono, padding: 60, textAlign: "center", color: C.muted, fontSize: 12 }}>
            <Wrench size={36} style={{ opacity: 0.3, marginBottom: 12 }} />
            <div>Engine idle</div>
          </div>
        )}
        {loading && (
          <div style={{ padding: "16px 4px" }}>
            <div style={{ ...mono, fontSize: 11, color: C.accent, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
              <Loader2 size={14} className="nx-spin" /> {STAGES[stage]}
            </div>
            <div style={{ height: 6, background: C.surface2, borderRadius: 3, overflow: "hidden", marginBottom: 16 }}>
              <div style={{ height: "100%", width: `${((stage + 1) / STAGES.length) * 100}%`, background: C.accent, transition: "width 0.3s" }} />
            </div>
            {STAGES.map((s, i) => (
              <div key={s} style={{ ...mono, fontSize: 10, color: i <= stage ? C.text : C.muted, padding: "3px 0" }}>
                <span style={{ color: i < stage ? C.success : i === stage ? C.accent : C.muted, marginRight: 8 }}>{i < stage ? "✓" : i === stage ? "▸" : "·"}</span>{s}
              </div>
            ))}
          </div>
        )}
        {error && <div style={{ padding: 16, background: C.danger + "11", border: `1px solid ${C.danger}55`, borderRadius: 6, color: C.danger, ...mono, fontSize: 11 }}>{error} <Btn variant="ghost" size="sm" onClick={run} style={{ marginLeft: 12 }}>Retry</Btn></div>}
        {result && !loading && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Stat label="Status" value={<span style={{ color: statusColor }}>{result.validationStatus}</span>} accent={statusColor} />
              <Stat label="Confidence" value={result.confidence + "%"} />
            </div>
            <div style={{ marginTop: 16 }}>
              <Label>Errors Detected</Label>
              {result.errorsDetected.length === 0 ? <Empty>None</Empty> : result.errorsDetected.map((e, i) => (
                <div key={i} style={{ padding: 8, background: C.surface2, borderRadius: 4, marginBottom: 6, ...mono, fontSize: 11 }}>
                  <div style={{ color: C.danger, fontWeight: 600 }}>{e.type} <span style={{ color: C.muted }}>@ {e.location}</span></div>
                  <div style={{ color: C.textDim, marginTop: 2, ...sans }}>{e.description}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 14 }}>
              <Label>Fixes Applied</Label>
              {result.fixesApplied.map((f, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 10px", background: C.surface2, borderRadius: 4, marginBottom: 4, ...mono, fontSize: 11 }}>
                  <span style={{ color: C.text }}>{f.fix}</span>
                  <Badge color={C.success}>{f.confidence}%</Badge>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      {/* RIGHT — repaired output */}
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <SectionLabel>Repaired Output</SectionLabel>
          {result && <Badge color={statusColor}>{result.validationStatus}</Badge>}
        </div>
        {result ? (
          <>
            <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
              <Btn variant="ghost" size="sm" onClick={() => setShowDiff(false)} style={showDiff ? {} : { borderColor: C.accent, color: C.accent }}>Repaired</Btn>
              <Btn variant="ghost" size="sm" onClick={() => setShowDiff(true)} style={showDiff ? { borderColor: C.accent, color: C.accent } : {}}>Diff</Btn>
              <Btn variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(result.repairedOutput)}><Copy size={11} style={{ marginRight: 4 }} />Copy</Btn>
            </div>
            {!showDiff ? (
              <pre style={{ ...mono, fontSize: 11, color: C.text, background: C.bg, padding: 12, borderRadius: 6, border: `1px solid ${C.border}`, whiteSpace: "pre-wrap", maxHeight: 320, overflowY: "auto", margin: 0 }}>{result.repairedOutput}</pre>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                <div>
                  <Label>Original</Label>
                  <pre style={{ ...mono, fontSize: 10, color: C.danger, background: C.bg, padding: 10, borderRadius: 6, border: `1px solid ${C.danger}33`, whiteSpace: "pre-wrap", maxHeight: 280, overflowY: "auto", margin: 0 }}>{input}</pre>
                </div>
                <div>
                  <Label>Repaired</Label>
                  <pre style={{ ...mono, fontSize: 10, color: C.success, background: C.bg, padding: 10, borderRadius: 6, border: `1px solid ${C.success}33`, whiteSpace: "pre-wrap", maxHeight: 280, overflowY: "auto", margin: 0 }}>{result.repairedOutput}</pre>
                </div>
              </div>
            )}
            <div style={{ ...mono, fontSize: 10, color: C.muted, marginTop: 8 }}>Repair time: {result.repairTime}ms</div>
          </>
        ) : <div style={{ ...mono, fontSize: 11, color: C.muted, padding: 40, textAlign: "center" }}>No repair yet</div>}

        <div style={{ marginTop: 20 }}>
          <SectionLabel>History</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 160, overflowY: "auto" }}>
            {history.slice(0, 6).map(h => (
              <div key={h.id} style={{ padding: "6px 8px", background: C.surface2, borderRadius: 4, ...mono, fontSize: 10, display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: C.textDim }}>{h.outputType} · {relTime(h.timestamp)}</span>
                <Badge color={h.result.validationStatus === "VALID" ? C.success : h.result.validationStatus === "PARTIAL" ? C.warn : C.danger}>{h.result.validationStatus}</Badge>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

const Label = ({ children }: any) => <div style={{ ...mono, fontSize: 9, color: C.muted, letterSpacing: 1.4, textTransform: "uppercase", marginBottom: 4 }}>{children}</div>;
const Empty = ({ children }: any) => <div style={{ ...mono, fontSize: 11, color: C.muted, padding: 8 }}>{children}</div>;
