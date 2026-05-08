// SDK Playground — exercise the NeurixClient end-to-end
import { useState } from "react";
import { neurix, type NeurixResponse, getJsonl, getPrometheus } from "@/lib/neurix-sdk";
import { Loader2, Play, Download } from "lucide-react";

const SAMPLES: { label: string; prompt: string; expectJson?: boolean; cap?: number }[] = [
  { label: "PII redaction (Ghost)", prompt: "Email me at john.doe@acme.com or call 415-555-0142. SSN 123-45-6789." },
  { label: "JSON repair (Self-Heal)", prompt: "Return ONLY a JSON object with keys 'name' and 'score' (0-100) for an LLM eval.", expectJson: true },
  { label: "Cost cap pivot (Guard)", prompt: "Write one short sentence about reliability.", cap: 0.000001 },
  { label: "Clean baseline", prompt: "Say hello in one word." },
];

export default function NeurixSDKPanel() {
  const [prompt, setPrompt] = useState(SAMPLES[0].prompt);
  const [expectJson, setExpectJson] = useState(false);
  const [cap, setCap] = useState<string>("");
  const [ghost, setGhost] = useState(true);
  const [busy, setBusy] = useState(false);
  const [resp, setResp] = useState<NeurixResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const run = async () => {
    setBusy(true); setErr(null); setResp(null);
    try {
      const r = await neurix.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        expectJson,
        ghostMode: ghost,
        computeGuardCap: cap ? Number(cap) : undefined,
      });
      setResp(r);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const exportJsonl = () => {
    const lines = getJsonl().map(r => JSON.stringify(r)).join("\n");
    const blob = new Blob([lines], { type: "application/x-ndjson" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "neurix-logs.jsonl"; a.click();
    URL.revokeObjectURL(url);
  };

  const exportProm = () => {
    const blob = new Blob([getPrometheus()], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "neurix-metrics.prom"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-[#0A0A0A] border border-white/5 rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-mono text-sm uppercase tracking-wider text-white">Neurix SDK Playground</h2>
          <p className="text-[10px] font-mono text-[#A0A0A0] mt-1">
            <code className="text-[#00FFFF]">neurix.chat.completions.create()</code> · ghost + self-heal + guard active by default
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportJsonl} className="flex items-center gap-1 px-2 py-1 text-[10px] font-mono border border-white/10 rounded hover:border-[#00FFFF]/40 text-[#A0A0A0]">
            <Download className="w-3 h-3" /> JSONL
          </button>
          <button onClick={exportProm} className="flex items-center gap-1 px-2 py-1 text-[10px] font-mono border border-white/10 rounded hover:border-[#00FFFF]/40 text-[#A0A0A0]">
            <Download className="w-3 h-3" /> Prometheus
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {SAMPLES.map((s, i) => (
          <button key={i} onClick={() => { setPrompt(s.prompt); setExpectJson(!!s.expectJson); setCap(s.cap ? String(s.cap) : ""); }}
            className="px-2 py-1 text-[10px] font-mono border border-white/10 rounded hover:border-[#00FFFF]/40 text-[#A0A0A0]">
            {s.label}
          </button>
        ))}
      </div>

      <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={3}
        className="w-full bg-black border border-white/10 rounded p-2 text-xs font-mono text-white focus:border-[#00FFFF]/40 focus:outline-none" />

      <div className="flex flex-wrap items-center gap-4 text-[10px] font-mono text-[#A0A0A0]">
        <label className="flex items-center gap-1"><input type="checkbox" checked={ghost} onChange={e => setGhost(e.target.checked)} /> ghostMode</label>
        <label className="flex items-center gap-1"><input type="checkbox" checked={expectJson} onChange={e => setExpectJson(e.target.checked)} /> expectJson</label>
        <label className="flex items-center gap-1">computeGuardCap $
          <input value={cap} onChange={e => setCap(e.target.value)} placeholder="0.05"
            className="w-20 bg-black border border-white/10 rounded px-1 py-0.5 text-white" />
        </label>
        <button onClick={run} disabled={busy} className="ml-auto flex items-center gap-1 px-3 py-1 bg-[#00FFFF]/10 border border-[#00FFFF]/40 text-[#00FFFF] rounded font-mono text-xs disabled:opacity-50">
          {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />} Run
        </button>
      </div>

      {err && <div className="text-xs font-mono text-[#FF00FF] border border-[#FF00FF]/40 rounded p-2">{err}</div>}

      {resp && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px] font-mono">
            <Metric label="model used" value={resp.neurix.modelUsed} />
            <Metric label="cost actual" value={`$${resp.neurix.costActual.toFixed(5)}`} />
            <Metric label="cost saved" value={`$${resp.neurix.costSaved.toFixed(5)}`} highlight={resp.neurix.costSaved > 0} />
            <Metric label="latency" value={`${resp.neurix.latencyMs}ms`} />
            <Metric label="pii redacted" value={resp.neurix.piiRedacted.join(",") || "—"} highlight={resp.neurix.piiRedacted.length > 0} />
            <Metric label="healed" value={String(resp.neurix.healed)} highlight={resp.neurix.healed} />
            <Metric label="fell back" value={String(resp.neurix.fellBack)} highlight={resp.neurix.fellBack} />
            <Metric label="pivoted" value={String(resp.neurix.pivoted)} highlight={resp.neurix.pivoted} />
          </div>
          {resp.neurix.pivotReason && (
            <div className="text-[10px] font-mono text-[#A0A0A0] border-l-2 border-[#FF00FF] pl-2">{resp.neurix.pivotReason}</div>
          )}
          <pre className="bg-black border border-white/5 rounded p-3 text-xs font-mono text-white whitespace-pre-wrap max-h-64 overflow-auto">{resp.content}</pre>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`border rounded p-2 ${highlight ? "border-[#FF00FF]/40 bg-[#FF00FF]/5" : "border-white/10 bg-black/40"}`}>
      <div className="text-[#A0A0A0] uppercase">{label}</div>
      <div className={highlight ? "text-[#FF00FF]" : "text-white"}>{value}</div>
    </div>
  );
}
