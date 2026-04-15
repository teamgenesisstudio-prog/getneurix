import { Eye, AlertTriangle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ShadowEvent { id: string; input: string; flagged: boolean; reason: string; timestamp: Date; }

interface Props { events: ShadowEvent[]; isActive: boolean; onToggle: () => void; }

const ShadowMonitor = ({ events, isActive, onToggle }: Props) => {
  const flagged = events.filter(e => e.flagged).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isActive && <span className="w-2 h-2 rounded-full bg-success animate-pulse" />}
          <span className="text-[10px] font-mono text-muted-foreground">{isActive ? "Monitoring live traffic" : "Shadow monitoring paused"}</span>
        </div>
        <Button onClick={onToggle} variant="outline" className={`text-[9px] font-mono h-6 ${isActive ? "border-success/30 text-success" : "border-border/30"}`}>
          {isActive ? "STOP" : "START"}
        </Button>
      </div>
      {flagged > 0 && (
        <div className="bg-destructive/10 border border-destructive/30 rounded p-2 text-[10px] font-mono text-destructive">
          ⚠ {flagged} suspicious interactions flagged
        </div>
      )}
      <div className="max-h-40 overflow-y-auto space-y-1">
        {events.slice(-10).map(e => (
          <div key={e.id} className="flex items-center gap-2 text-[9px] font-mono p-1.5 rounded bg-muted/20">
            {e.flagged ? <AlertTriangle className="w-3 h-3 text-warning flex-shrink-0" /> : <CheckCircle className="w-3 h-3 text-success flex-shrink-0" />}
            <span className="flex-1 truncate">{e.input}</span>
            <span className="text-muted-foreground text-[8px]">{e.timestamp.toLocaleTimeString()}</span>
          </div>
        ))}
      </div>
      {events.length === 0 && <p className="text-[9px] font-mono text-muted-foreground text-center py-3">{isActive ? "Waiting for interactions..." : "Start monitoring to track live behavior"}</p>}
    </div>
  );
};

export default ShadowMonitor;
export type { ShadowEvent };
