import { AlertTriangle } from "lucide-react";

interface Prediction {
  type: string;
  probability: number;
  severity: "critical" | "high" | "medium" | "low";
  description: string;
}

interface Props { predictions: Prediction[]; }

const sevBg = { critical: "bg-destructive/10 border-destructive/30", high: "bg-warning/10 border-warning/30", medium: "bg-accent/10 border-accent/30", low: "bg-muted/20 border-border/30" };
const sevText = { critical: "text-destructive", high: "text-warning", medium: "text-accent", low: "text-muted-foreground" };

const FailurePrediction = ({ predictions }: Props) => {
  if (predictions.length === 0) return <p className="text-[9px] font-mono text-muted-foreground text-center py-4">Run an analysis to generate predictions</p>;

  return (
    <div className="space-y-2">
      {predictions.map((p, i) => (
        <div key={i} className={`rounded-lg border p-3 ${sevBg[p.severity]}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className={`w-3 h-3 ${sevText[p.severity]}`} />
              <span className="text-[10px] font-mono font-semibold">{p.type}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${p.probability > 70 ? "bg-destructive" : p.probability > 40 ? "bg-warning" : "bg-success"}`} style={{ width: `${p.probability}%` }} />
              </div>
              <span className={`text-[10px] font-mono font-semibold ${sevText[p.severity]}`}>{p.probability}%</span>
            </div>
          </div>
          <p className="text-[9px] font-mono text-muted-foreground mt-1">{p.description}</p>
        </div>
      ))}
    </div>
  );
};

export default FailurePrediction;
export type { Prediction };
