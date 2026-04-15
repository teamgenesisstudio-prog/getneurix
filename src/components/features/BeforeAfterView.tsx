import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { ArrowLeftRight } from "lucide-react";

interface Props { before: number; after: number; label?: string; }

const BeforeAfterView = ({ before, after, label = "Reliability Score" }: Props) => {
  const [sliderPos, setSliderPos] = useState([50]);
  const improvement = after - before;
  const pct = before > 0 ? ((improvement / before) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-4">
      <div className="text-[10px] font-mono text-muted-foreground text-center">{label}</div>
      <div className="relative h-24 rounded-lg overflow-hidden border border-border/30">
        <div className="absolute inset-0 flex">
          <div className="flex-1 bg-destructive/10 flex items-center justify-center" style={{ width: `${sliderPos[0]}%` }}>
            <div className="text-center">
              <div className="font-display text-2xl font-bold text-destructive">{before > 0 ? before : "—"}</div>
              <div className="text-[8px] font-mono text-destructive/70">BEFORE</div>
            </div>
          </div>
          <div className="w-px bg-primary/50 relative z-10" />
          <div className="flex-1 bg-success/10 flex items-center justify-center" style={{ width: `${100 - sliderPos[0]}%` }}>
            <div className="text-center">
              <div className="font-display text-2xl font-bold text-success">{after > 0 ? after : "—"}</div>
              <div className="text-[8px] font-mono text-success/70">AFTER</div>
            </div>
          </div>
        </div>
      </div>
      <Slider value={sliderPos} onValueChange={setSliderPos} min={10} max={90} step={1} className="mt-2" />
      {improvement !== 0 && (
        <div className={`text-center text-[10px] font-mono ${improvement > 0 ? "text-success" : "text-destructive"}`}>
          {improvement > 0 ? "↑" : "↓"} {Math.abs(improvement)} points ({pct}% {improvement > 0 ? "improvement" : "regression"})
        </div>
      )}
      {before === 0 && after === 0 && <p className="text-[9px] font-mono text-muted-foreground text-center">Run stress test, then auto-fix to see before/after</p>}
    </div>
  );
};

export default BeforeAfterView;
