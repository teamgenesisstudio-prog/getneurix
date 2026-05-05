import { useEffect, useRef, useState } from "react";
import { Send, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { intercept, chargeUsage, scanText, applyViolations, logForensic, newSession, BUDGET_CAP, type SentinelState } from "@/lib/neurix-sentinel";

interface AgentResponse {
  text: string; latency: number; tokens: number; model: string;
  findings: { type: string; clause: string; match: string }[];
  safety: number;
}

interface NexusResponse {
  agentA: AgentResponse; agentB: AgentResponse;
  inputFindings: { type: string; clause: string; match: string }[];
  consensus: "GREEN_GREEN" | "GREEN_MAGENTA" | "MAGENTA_GREEN" | "MAGENTA_MAGENTA";
  fortress?: {
    scrub: { redactions: number; types: string[] };
    selfHeal: { agent: string; attempt: number; error: string; recovered: boolean }[];
    computeGuard: { downgraded: boolean; reason: string; costUsd: number; cap: number; modelA: string; modelB: string };
  };
}

interface Props {
  state: SentinelState;
  onState: (s: SentinelState) => void;
}

const consensusColor = {
  GREEN_GREEN: "bg-[#00FFFF]/20 text-[#00FFFF] border-[#00FFFF]/40",
  GREEN_MAGENTA: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
  MAGENTA_GREEN: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
  MAGENTA_MAGENTA: "bg-[#FF00FF]/20 text-[#FF00FF] border-[#FF00FF]/40",
};

export default function NexusAI({ state, onState }: Props) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [resp, setResp] = useState<NexusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    if (!prompt.trim() || loading) return;
    setError(null);

    const intercepted = intercept(state, prompt);
    onState(intercepted.state);
    if (!intercepted.allow) {
      setError(intercepted.reason || "Blocked");
      await logForensic({ sessionId: state.sessionId, eventType: "REQUEST_BLOCKED", severity: "critical", prompt, metadata: { reason: intercepted.reason } });
      return;
    }

    setLoading(true);
    try {
      const { data, error: err } = await supabase.functions.invoke("nexus-ai", {
        body: { prompt, sessionId: state.sessionId },
      });
      if (err) throw err;
      if (data?.error) throw new Error(data.error);
      const r = data as NexusResponse;
      setResp(r);

      const allFindings = [...r.inputFindings, ...r.agentA.findings, ...r.agentB.findings];
      const violations = allFindings.map(f => ({
        type: (f.type.startsWith("PII") ? "PII" : f.type) as any,
        clause: f.clause, title: f.type, match: f.match,
      }));
      let next = chargeUsage(intercepted.state, r.agentA.tokens + r.agentB.tokens);
      next = applyViolations(next, violations);
      onState(next);
    } catch (e: any) {
      setError(e.message || "Request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-[#0A0A0A] border border-white/5 rounded-lg p-4">
        <label className="text-[10px] font-mono text-[#A0A0A0] uppercase tracking-wider">Sandbox Prompt</label>
        <Textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="Test a prompt against both Intelligence Agents (real GPT-4o + Gemini) wrapped in NEURIX security..."
          className="mt-2 bg-black border-white/10 text-white font-mono text-sm min-h-[100px]"
          maxLength={4000}
        />
        <div className="flex items-center justify-between mt-3">
          <span className="text-[10px] font-mono text-[#A0A0A0]">{prompt.length}/4000 · Active model: <span className="text-[#00FFFF]">{state.activeModel}</span> · Threat: <span className={state.threat === "Monitoring" ? "text-[#00FFFF]" : "text-[#FF00FF]"}>{state.threat}</span></span>
          <Button onClick={send} disabled={loading || !prompt.trim() || state.terminated} className="bg-[#00FFFF]/10 hover:bg-[#00FFFF]/20 text-[#00FFFF] border border-[#00FFFF]/30">
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
            <span className="ml-2 font-mono text-xs">EXECUTE</span>
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-[#FF00FF]/10 border border-[#FF00FF]/40 rounded p-3 text-[#FF00FF] font-mono text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> {error}
        </div>
      )}

      {resp && (
        <>
          <div className="flex items-center justify-center">
            <span className={`px-4 py-1.5 rounded-full border font-mono text-[10px] uppercase tracking-wider ${consensusColor[resp.consensus]}`}>
              Safety Consensus: {resp.consensus.replace("_", " / ")}
            </span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[{ label: "Intelligence Agent A", data: resp.agentA }, { label: "Intelligence Agent B", data: resp.agentB }].map((a, i) => (
              <div key={i} className="bg-[#0A0A0A] border border-white/5 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs text-[#00FFFF]">{a.label}</span>
                  <span className="font-mono text-[10px] text-[#A0A0A0]">{a.data.latency}ms · {a.data.tokens}t</span>
                </div>
                <div className="text-sm text-white/90 font-body whitespace-pre-wrap min-h-[120px]">{a.data.text || "—"}</div>
                <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                  <span className="font-mono text-[10px] text-[#A0A0A0]">Safety: <span className={a.data.safety >= 0.9 ? "text-[#00FFFF]" : "text-[#FF00FF]"}>{a.data.safety.toFixed(2)}</span></span>
                  {a.data.findings.length === 0 ? (
                    <span className="flex items-center gap-1 text-[#00FFFF] text-[10px] font-mono"><CheckCircle2 className="w-3 h-3" /> CLEAN</span>
                  ) : (
                    <span className="flex items-center gap-1 text-[#FF00FF] text-[10px] font-mono"><AlertTriangle className="w-3 h-3" /> {a.data.findings.length} VIOLATION{a.data.findings.length > 1 ? "S" : ""}</span>
                  )}
                </div>
                {a.data.findings.map((f, j) => (
                  <div key={j} className="mt-2 text-[10px] font-mono text-[#FF00FF]/80 bg-[#FF00FF]/5 px-2 py-1 rounded">{f.type} → {f.clause}</div>
                ))}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
