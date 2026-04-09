import { AlertTriangle, Zap, Shield } from "lucide-react";

export interface Failure {
  id: string;
  type: "critical" | "warning" | "info";
  title: string;
  description: string;
  impact: string;
  fix: string;
}

interface FailureListProps {
  failures: Failure[];
}

const icons = {
  critical: <AlertTriangle className="w-4 h-4 text-destructive" />,
  warning: <Zap className="w-4 h-4 text-warning" />,
  info: <Shield className="w-4 h-4 text-primary" />,
};

const borderColors = {
  critical: "border-l-destructive",
  warning: "border-l-warning",
  info: "border-l-primary",
};

const FailureList = ({ failures }: FailureListProps) => (
  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
    {failures.length === 0 && (
      <p className="text-muted-foreground text-sm font-mono text-center py-8">
        No failures detected yet. Upload a model to begin stress testing.
      </p>
    )}
    {failures.map((f) => (
      <div
        key={f.id}
        className={`glass-panel rounded-lg p-4 border-l-4 ${borderColors[f.type]} animate-slide-up`}
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5">{icons[f.type]}</div>
          <div className="flex-1 min-w-0">
            <h4 className="font-display text-xs font-semibold tracking-wide">{f.title}</h4>
            <p className="text-xs text-muted-foreground mt-1 font-mono">{f.description}</p>
            <div className="flex gap-4 mt-2 text-xs">
              <span className="text-destructive font-mono">Impact: {f.impact}</span>
              <span className="text-success font-mono">Fix: {f.fix}</span>
            </div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

export default FailureList;
