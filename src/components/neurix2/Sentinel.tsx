import { useEffect, useState } from "react";
import { Activity, AlertOctagon, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CLAUSE_MAP, type SentinelState } from "@/lib/neurix-sentinel";

interface ForensicLog {
  id: string; session_id: string; event_type: string; severity: string;
  violation_clause: string | null; created_at: string; prompt_excerpt: string | null;
}

interface Props { state: SentinelState; }

const threatBadge: Record<string, string> = {
  Monitoring: "bg-[#00FFFF]/10 text-[#00FFFF] border-[#00FFFF]/30",
  Downgraded: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  Throttled: "bg-orange-500/10 text-orange-400 border-orange-500/30",
  Terminated: "bg-[#FF00FF]/10 text-[#FF00FF] border-[#FF00FF]/30",
};

export default function Sentinel({ state }: Props) {
  const [logs, setLogs] = useState<ForensicLog[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase.from("forensic_logs") as any).select("*").order("created_at", { ascending: false }).limit(20);
      if (data) setLogs(data);
    })();
    const ch = supabase.channel("forensic_feed")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "forensic_logs" }, (p: any) => {
        setLogs(prev => [p.new as ForensicLog, ...prev].slice(0, 20));
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Live sessions table */}
        <div className="bg-[#0A0A0A] border border-white/5 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-[#00FFFF]" />
            <h3 className="font-mono text-xs uppercase tracking-wider text-white">Live Sessions · Compute Guard</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr className="text-[10px] font-mono text-[#A0A0A0] uppercase">
                <th className="text-left py-2">Session</th>
                <th className="text-right py-2">Cost</th>
                <th className="text-right py-2">Tokens</th>
                <th className="text-right py-2">Model</th>
                <th className="text-right py-2">Threat</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-white/5">
                <td className="py-2 font-mono text-xs text-white/90">{state.sessionId.slice(0, 8)}…</td>
                <td className="py-2 font-mono text-xs text-right text-[#00FFFF]">${state.sessionCost.toFixed(4)}</td>
                <td className="py-2 font-mono text-xs text-right text-white/70">{state.totalTokens}</td>
                <td className="py-2 font-mono text-xs text-right text-white/70">{state.activeModel}</td>
                <td className="py-2 text-right">
                  <span className={`px-2 py-0.5 rounded border text-[10px] font-mono ${threatBadge[state.threat]}`}>{state.threat}</span>
                </td>
              </tr>
            </tbody>
          </table>
          <div className="mt-3 h-1 bg-white/5 rounded overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#00FFFF] to-[#FF00FF] transition-all" style={{ width: `${Math.min(100, (state.sessionCost / 5) * 100)}%` }} />
          </div>
          <div className="mt-1 text-[10px] font-mono text-[#A0A0A0]">Budget · ${state.sessionCost.toFixed(4)} / ${5.00.toFixed(2)}</div>
        </div>

        {/* Legal exposure */}
        <div className="bg-[#0A0A0A] border border-white/5 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertOctagon className="w-4 h-4 text-[#FF00FF]" />
            <h3 className="font-mono text-xs uppercase tracking-wider text-white">Liability Mapper · Legal Exposure</h3>
          </div>
          <div className="text-center py-4">
            <div className={`text-6xl font-mono font-bold ${state.legalExposure >= 50 ? "text-[#FF00FF]" : state.legalExposure >= 25 ? "text-yellow-400" : "text-[#00FFFF]"}`}>
              {state.legalExposure}
            </div>
            <div className="text-[10px] font-mono text-[#A0A0A0] mt-1 uppercase">Exposure Score / 100</div>
          </div>
          <div className="space-y-1 mt-3">
            {Object.entries(CLAUSE_MAP).filter(([k]) => k !== "BUDGET").map(([k, v]) => {
              const triggered = logs.some(l => l.violation_clause === v.article);
              return (
                <div key={k} className={`flex items-center justify-between px-2 py-1.5 rounded text-[10px] font-mono ${triggered ? "bg-[#FF00FF]/10 text-[#FF00FF]" : "bg-white/5 text-[#A0A0A0]"}`}>
                  <span>{v.article}</span><span>{v.title}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Forensic feed */}
      <div className="bg-[#0A0A0A] border border-white/5 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-4 h-4 text-[#00FFFF]" />
          <h3 className="font-mono text-xs uppercase tracking-wider text-white">Forensic Log Feed · Live</h3>
          <span className="ml-auto text-[10px] font-mono text-[#A0A0A0]">{logs.length} events</span>
        </div>
        <div className="max-h-[400px] overflow-y-auto space-y-1">
          {logs.length === 0 ? (
            <p className="text-[10px] font-mono text-[#A0A0A0] text-center py-8">No violations recorded. System nominal.</p>
          ) : logs.map(l => (
            <div key={l.id} className="flex items-center gap-3 px-3 py-2 bg-black/40 border border-white/5 rounded text-[10px] font-mono">
              <span className={`px-1.5 py-0.5 rounded ${l.severity === "critical" ? "bg-[#FF00FF]/20 text-[#FF00FF]" : "bg-yellow-500/20 text-yellow-400"}`}>{l.severity.toUpperCase()}</span>
              <span className="text-white">{l.event_type}</span>
              {l.violation_clause && <span className="text-[#FF00FF]">→ {l.violation_clause}</span>}
              <span className="ml-auto text-[#A0A0A0]">{new Date(l.created_at).toLocaleTimeString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
