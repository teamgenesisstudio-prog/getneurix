import { Shield } from "lucide-react";

interface Props { score: number; testsRun: number; failures: number; }

const HealthScoreWidget = ({ score, testsRun, failures }: Props) => {
  const color = score >= 80 ? "text-success" : score >= 50 ? "text-warning" : score > 0 ? "text-destructive" : "text-muted-foreground";
  const bg = score >= 80 ? "bg-success/10 border-success/30" : score >= 50 ? "bg-warning/10 border-warning/30" : score > 0 ? "bg-destructive/10 border-destructive/30" : "bg-muted/20 border-border/30";

  return (
    <div className={`rounded-xl border p-6 text-center ${bg}`}>
      <Shield className={`w-8 h-8 mx-auto mb-2 ${color}`} />
      <div className={`font-display text-5xl font-black ${color}`}>{score > 0 ? score : "—"}</div>
      <div className="text-[10px] font-mono text-muted-foreground mt-2">MODEL HEALTH SCORE</div>
      <div className="flex justify-center gap-4 mt-3 text-[9px] font-mono">
        <span>{testsRun} tests</span>
        <span>{failures} failures</span>
      </div>
      {score === 0 && <p className="text-[9px] font-mono text-muted-foreground mt-2">Run a stress test to calculate</p>}
    </div>
  );
};

export default HealthScoreWidget;
