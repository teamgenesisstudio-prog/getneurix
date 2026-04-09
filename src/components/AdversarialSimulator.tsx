import { useState } from "react";
import { Skull, Play, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AttackResult {
  attack: string;
  success: boolean;
  severity: "high" | "medium" | "low";
  description: string;
}

interface AdversarialSimulatorProps {
  onRun: () => Promise<AttackResult[]>;
}

const AdversarialSimulator = ({ onRun }: AdversarialSimulatorProps) => {
  const [results, setResults] = useState<AttackResult[]>([]);
  const [running, setRunning] = useState(false);

  const handleRun = async () => {
    setRunning(true);
    try {
      const res = await onRun();
      setResults(res);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button
        onClick={handleRun}
        disabled={running}
        className="w-full bg-destructive/20 border border-destructive/50 text-destructive hover:bg-destructive/30 font-mono text-xs"
      >
        {running ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Skull className="w-4 h-4 mr-2" />}
        {running ? "ATTACKING..." : "LAUNCH ADVERSARIAL ATTACK"}
      </Button>
      <div className="space-y-2 max-h-[200px] overflow-y-auto">
        {results.map((r, i) => (
          <div key={i} className="flex items-start gap-2 p-2 rounded bg-muted/50 animate-slide-up text-xs font-mono">
            <span className={r.success ? "text-destructive" : "text-success"}>
              {r.success ? "✗ BREACHED" : "✓ BLOCKED"}
            </span>
            <div className="flex-1">
              <p className="font-semibold">{r.attack}</p>
              <p className="text-muted-foreground">{r.description}</p>
            </div>
            <span className={`px-1.5 py-0.5 rounded text-[10px] ${
              r.severity === "high" ? "bg-destructive/20 text-destructive" :
              r.severity === "medium" ? "bg-warning/20 text-warning" : "bg-primary/20 text-primary"
            }`}>{r.severity}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdversarialSimulator;
