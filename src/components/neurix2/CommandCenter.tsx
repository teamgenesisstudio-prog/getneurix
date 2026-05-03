import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Activity, DollarSign, Zap, Shield } from "lucide-react";
import type { SentinelState } from "@/lib/neurix-sentinel";

interface Props { state: SentinelState; }

export default function CommandCenter({ state }: Props) {
  const [eventCount, setEventCount] = useState(0);
  const [criticalCount, setCriticalCount] = useState(0);

  useEffect(() => {
    (async () => {
      const { count } = await (supabase.from("forensic_logs") as any).select("*", { count: "exact", head: true });
      setEventCount(count || 0);
      const { count: c2 } = await (supabase.from("forensic_logs") as any).select("*", { count: "exact", head: true }).eq("severity", "critical");
      setCriticalCount(c2 || 0);
    })();
  }, []);

  const tiles = [
    { icon: DollarSign, label: "Session Spend", value: `$${state.sessionCost.toFixed(4)}`, sub: `Cap $5.00`, color: "text-[#00FFFF]" },
    { icon: Zap, label: "Token Burn", value: state.totalTokens.toLocaleString(), sub: `Active: ${state.activeModel}`, color: "text-[#00FFFF]" },
    { icon: Shield, label: "Legal Exposure", value: `${state.legalExposure}/100`, sub: state.legalExposure >= 50 ? "HIGH RISK" : "Nominal", color: state.legalExposure >= 50 ? "text-[#FF00FF]" : "text-[#00FFFF]" },
    { icon: Activity, label: "Forensic Events", value: String(eventCount), sub: `${criticalCount} critical`, color: criticalCount > 0 ? "text-[#FF00FF]" : "text-[#00FFFF]" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {tiles.map((t, i) => (
          <div key={i} className="bg-[#0A0A0A] border border-white/5 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <t.icon className={`w-4 h-4 ${t.color}`} />
              <span className="text-[10px] font-mono text-[#A0A0A0] uppercase">{t.label}</span>
            </div>
            <div className={`font-mono text-2xl ${t.color}`}>{t.value}</div>
            <div className="text-[10px] font-mono text-[#A0A0A0] mt-1">{t.sub}</div>
          </div>
        ))}
      </div>

      <div className="bg-[#0A0A0A] border border-white/5 rounded-lg p-6">
        <h2 className="font-mono text-sm uppercase tracking-wider text-white mb-4">System Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-body text-[#A0A0A0]">
          <div><span className="text-[#00FFFF] font-mono">●</span> Compute Guard active — budget cap, token throttle, model downgrade</div>
          <div><span className="text-[#00FFFF] font-mono">●</span> Liability Mapper online — GDPR Art.32, EU AI Act Art.10 mapped</div>
          <div><span className="text-[#00FFFF] font-mono">●</span> Forensic logs streaming to encrypted store (realtime)</div>
        </div>
      </div>
    </div>
  );
}
