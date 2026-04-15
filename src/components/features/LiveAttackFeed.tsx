import { useState, useEffect, useRef } from "react";
import { Skull, Shield, AlertTriangle, Zap } from "lucide-react";

interface AttackEvent {
  id: string;
  type: "jailbreak" | "bias" | "hallucination" | "toxicity" | "evasion";
  target: string;
  success: boolean;
  severity: "critical" | "high" | "medium" | "low";
  timestamp: Date;
}

const typeIcons = {
  jailbreak: <Skull className="w-3 h-3" />, bias: <AlertTriangle className="w-3 h-3" />,
  hallucination: <Zap className="w-3 h-3" />, toxicity: <Shield className="w-3 h-3" />,
  evasion: <AlertTriangle className="w-3 h-3" />,
};
const sevColors = { critical: "text-destructive", high: "text-warning", medium: "text-accent", low: "text-muted-foreground" };

interface Props { attacks: AttackEvent[]; isRunning: boolean; }

const LiveAttackFeed = ({ attacks, isRunning }: Props) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [attacks]);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {isRunning && <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />}
        <span className="text-[10px] font-mono text-muted-foreground">{isRunning ? "LIVE — attacks in progress" : `${attacks.length} attacks recorded`}</span>
      </div>
      <div ref={scrollRef} className="max-h-[300px] overflow-y-auto space-y-1 pr-1">
        {attacks.length === 0 && <p className="text-[9px] font-mono text-muted-foreground text-center py-4">No attacks yet. Run adversarial simulation to start.</p>}
        {attacks.map(a => (
          <div key={a.id} className={`flex items-center gap-2 p-1.5 rounded text-[10px] font-mono animate-slide-up ${a.success ? "bg-destructive/10 border border-destructive/20" : "bg-success/10 border border-success/20"}`}>
            <span className={sevColors[a.severity]}>{typeIcons[a.type]}</span>
            <span className="flex-1 truncate">{a.type.toUpperCase()}: {a.target}</span>
            <span className={a.success ? "text-destructive" : "text-success"}>{a.success ? "BREACHED" : "BLOCKED"}</span>
            <span className="text-muted-foreground text-[8px]">{a.timestamp.toLocaleTimeString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LiveAttackFeed;
export type { AttackEvent };
