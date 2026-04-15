import { useState } from "react";
import { Swords, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BattleResult {
  modelA: { name: string; score: number; wins: number };
  modelB: { name: string; score: number; wins: number };
  rounds: { attack: string; winnerA: boolean }[];
}

interface Props { result: BattleResult | null; onBattle: (modelA: string, modelB: string) => void; isRunning: boolean; }

const BattleMode = ({ result, onBattle, isRunning }: Props) => {
  const [modelA, setModelA] = useState("Current Model v1");
  const [modelB, setModelB] = useState("Current Model v2");

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <input value={modelA} onChange={e => setModelA(e.target.value)} placeholder="Model A" className="bg-muted/30 border border-border/30 rounded px-2 py-1.5 text-[10px] font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" />
        <input value={modelB} onChange={e => setModelB(e.target.value)} placeholder="Model B" className="bg-muted/30 border border-border/30 rounded px-2 py-1.5 text-[10px] font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" />
      </div>
      <Button onClick={() => onBattle(modelA, modelB)} disabled={isRunning} className="w-full bg-accent/20 border border-accent/50 text-accent hover:bg-accent/30 font-mono text-[10px]">
        <Swords className="w-3 h-3 mr-1" /> {isRunning ? "BATTLING..." : "START BATTLE"}
      </Button>
      {result && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className={`rounded-lg p-3 border ${result.modelA.wins > result.modelB.wins ? "bg-success/10 border-success/30" : "bg-muted/20 border-border/30"}`}>
              <div className="font-display text-lg font-bold">{result.modelA.score}</div>
              <div className="text-[9px] font-mono text-muted-foreground truncate">{result.modelA.name}</div>
              <div className="text-[10px] font-mono text-success">{result.modelA.wins} wins</div>
            </div>
            <div className={`rounded-lg p-3 border ${result.modelB.wins > result.modelA.wins ? "bg-success/10 border-success/30" : "bg-muted/20 border-border/30"}`}>
              <div className="font-display text-lg font-bold">{result.modelB.score}</div>
              <div className="text-[9px] font-mono text-muted-foreground truncate">{result.modelB.name}</div>
              <div className="text-[10px] font-mono text-success">{result.modelB.wins} wins</div>
            </div>
          </div>
          <div className="text-center">
            <Trophy className="w-4 h-4 mx-auto text-warning mb-1" />
            <div className="text-[10px] font-mono font-semibold text-warning">
              WINNER: {result.modelA.wins > result.modelB.wins ? result.modelA.name : result.modelB.name}
            </div>
          </div>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {result.rounds.map((r, i) => (
              <div key={i} className="flex items-center gap-2 text-[9px] font-mono">
                <span className="text-muted-foreground w-4">#{i + 1}</span>
                <span className="flex-1 truncate">{r.attack}</span>
                <span className={r.winnerA ? "text-primary" : "text-accent"}>{r.winnerA ? "A" : "B"}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BattleMode;
export type { BattleResult };
