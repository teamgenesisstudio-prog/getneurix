import { useState } from "react";
import { GitBranch, Lock, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

interface ModelMetrics { latency: number; safety: number; tokens: number; text: string; }

export default function Lab() {
  const [prompt, setPrompt] = useState("Summarize the security implications of prompt injection attacks.");
  const [loading, setLoading] = useState(false);
  const [stable, setStable] = useState<ModelMetrics | null>(null);
  const [shadow, setShadow] = useState<ModelMetrics | null>(null);
  const [autoProtect, setAutoProtect] = useState(true);
  const [promoted, setPromoted] = useState(false);

  const run = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true); setPromoted(false);
    try {
      const { data, error } = await supabase.functions.invoke("nexus-ai", { body: { prompt, sessionId: "lab" } });
      if (error) throw error;
      // Stable = agent A (gpt-4o-mini), Shadow = agent B (gemini)
      setStable({ latency: data.agentA.latency, safety: data.agentA.safety, tokens: data.agentA.tokens, text: data.agentA.text });
      setShadow({ latency: data.agentB.latency, safety: data.agentB.safety, tokens: data.agentB.tokens, text: data.agentB.text });
    } finally { setLoading(false); }
  };

  const safetyDelta = shadow && stable ? (shadow.safety - stable.safety) : 0;
  const latencyDelta = shadow && stable ? (shadow.latency - stable.latency) : 0;
  const regression = autoProtect && safetyDelta < -0.1;
  const canPromote = shadow && stable && shadow.safety > stable.safety && shadow.latency < stable.latency + 20 && !regression;

  return (
    <div className="space-y-4">
      <div className="bg-[#0A0A0A] border border-white/5 rounded-lg p-4">
        <Textarea value={prompt} onChange={e => setPrompt(e.target.value)} className="bg-black border-white/10 text-white font-mono text-sm min-h-[80px]" />
        <div className="flex items-center justify-between mt-3">
          <label className="flex items-center gap-2 text-[10px] font-mono text-[#A0A0A0] cursor-pointer">
            <input type="checkbox" checked={autoProtect} onChange={e => setAutoProtect(e.target.checked)} className="accent-[#00FFFF]" />
            Auto-Protect (block promotion on safety regression &gt;10%)
          </label>
          <Button onClick={run} disabled={loading} className="bg-[#00FFFF]/10 hover:bg-[#00FFFF]/20 text-[#00FFFF] border border-[#00FFFF]/30">
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <GitBranch className="w-3 h-3" />}
            <span className="ml-2 font-mono text-xs">RUN DUAL INFERENCE</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[{ label: "Production Model v1.2", data: stable, tag: "STABLE" }, { label: "Sentinel-Hardened v1.3", data: shadow, tag: "SHADOW" }].map((m, i) => (
          <div key={i} className="bg-[#0A0A0A] border border-white/5 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-xs text-white">{m.label}</span>
              <span className="px-2 py-0.5 rounded border border-[#00FFFF]/30 text-[#00FFFF] font-mono text-[10px]">{m.tag}</span>
            </div>
            {m.data ? (
              <>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="bg-black/40 rounded p-2"><div className="text-[10px] font-mono text-[#A0A0A0]">LATENCY</div><div className="font-mono text-lg text-[#00FFFF]">{m.data.latency}ms</div></div>
                  <div className="bg-black/40 rounded p-2"><div className="text-[10px] font-mono text-[#A0A0A0]">SAFETY</div><div className="font-mono text-lg text-[#00FFFF]">{m.data.safety.toFixed(2)}</div></div>
                </div>
                <div className="text-xs text-white/80 font-body max-h-24 overflow-y-auto">{m.data.text}</div>
              </>
            ) : <div className="text-[10px] font-mono text-[#A0A0A0] text-center py-8">No inference yet</div>}
          </div>
        ))}
      </div>

      {/* Heatmap */}
      {stable && shadow && (
        <div className="bg-[#0A0A0A] border border-white/5 rounded-lg p-4">
          <h3 className="font-mono text-xs uppercase tracking-wider text-white mb-3">KPI Regression Heatmap</h3>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Safety Δ", val: safetyDelta, fmt: (v: number) => v.toFixed(2), better: safetyDelta >= 0 },
              { label: "Latency Δ", val: latencyDelta, fmt: (v: number) => `${v}ms`, better: latencyDelta <= 0 },
              { label: "Token Δ", val: shadow.tokens - stable.tokens, fmt: (v: number) => `${v}`, better: shadow.tokens - stable.tokens <= 0 },
            ].map((k, i) => (
              <div key={i} className={`p-3 rounded border ${k.better ? "bg-[#00FFFF]/5 border-[#00FFFF]/30" : "bg-[#FF00FF]/5 border-[#FF00FF]/30"}`}>
                <div className="text-[10px] font-mono text-[#A0A0A0]">{k.label}</div>
                <div className={`font-mono text-lg ${k.better ? "text-[#00FFFF]" : "text-[#FF00FF]"}`}>{k.fmt(k.val)}</div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between bg-black/40 rounded p-3">
            {regression ? (
              <span className="flex items-center gap-2 text-[#FF00FF] font-mono text-xs"><Lock className="w-4 h-4" /> SAFETY REGRESSION DETECTED — Promotion Locked</span>
            ) : canPromote ? (
              <span className="flex items-center gap-2 text-[#00FFFF] font-mono text-xs"><CheckCircle2 className="w-4 h-4" /> Shadow outperforms Production</span>
            ) : (
              <span className="flex items-center gap-2 text-yellow-400 font-mono text-xs"><AlertTriangle className="w-4 h-4" /> Insufficient improvement to promote</span>
            )}
            <Button disabled={!canPromote || promoted} onClick={() => setPromoted(true)} className={`font-mono text-xs ${canPromote ? "bg-[#00FFFF]/20 text-[#00FFFF] border border-[#00FFFF]/40 hover:bg-[#00FFFF]/30" : "bg-white/5 text-[#A0A0A0] border border-white/10"}`}>
              {promoted ? "PROMOTED ✓" : "PROMOTE TO PRODUCTION"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
