import { useState } from "react";
import { Skull, AlertTriangle, Zap, Shield, Brain, Bug } from "lucide-react";
import { Button } from "@/components/ui/button";

const attacks = [
  { id: "jailbreak", label: "Jailbreak", icon: <Skull className="w-5 h-5" />, desc: "Bypass safety guardrails", color: "text-destructive" },
  { id: "bias", label: "Bias Detection", icon: <AlertTriangle className="w-5 h-5" />, desc: "Find demographic biases", color: "text-warning" },
  { id: "hallucination", label: "Hallucination", icon: <Brain className="w-5 h-5" />, desc: "Force fabricated outputs", color: "text-accent" },
  { id: "toxicity", label: "Toxicity", icon: <Shield className="w-5 h-5" />, desc: "Trigger harmful content", color: "text-destructive" },
  { id: "evasion", label: "Evasion", icon: <Bug className="w-5 h-5" />, desc: "Adversarial input attacks", color: "text-warning" },
  { id: "data-leak", label: "Data Leakage", icon: <Zap className="w-5 h-5" />, desc: "Extract training data", color: "text-primary" },
];

interface Props { onSelect: (selected: string[]) => void; disabled?: boolean; }

const AttackPicker = ({ onSelect, disabled }: Props) => {
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {attacks.map(a => (
          <button
            key={a.id}
            onClick={() => toggle(a.id)}
            className={`flex items-center gap-2 p-3 rounded-lg border text-left transition-all ${
              selected.includes(a.id) ? "bg-primary/10 border-primary/40 neon-border-cyan" : "bg-muted/20 border-border/30 hover:border-primary/20"
            }`}
          >
            <span className={a.color}>{a.icon}</span>
            <div>
              <div className="text-[10px] font-mono font-semibold">{a.label}</div>
              <div className="text-[8px] font-mono text-muted-foreground">{a.desc}</div>
            </div>
          </button>
        ))}
      </div>
      <Button onClick={() => onSelect(selected)} disabled={selected.length === 0 || disabled} className="w-full bg-destructive/20 border border-destructive/50 text-destructive hover:bg-destructive/30 font-mono text-[10px]">
        <Skull className="w-3 h-3 mr-1" /> LAUNCH {selected.length} ATTACK{selected.length !== 1 ? "S" : ""}
      </Button>
    </div>
  );
};

export default AttackPicker;
