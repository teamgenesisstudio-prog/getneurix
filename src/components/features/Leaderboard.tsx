import { Trophy, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  change: number;
  tests: number;
}

interface Props { entries: LeaderboardEntry[]; userRank?: number; }

const Leaderboard = ({ entries, userRank }: Props) => {
  const medalColors = ["text-warning", "text-muted-foreground", "text-accent"];

  return (
    <div className="space-y-2">
      {entries.map((e, i) => (
        <div key={i} className={`flex items-center gap-3 p-2 rounded text-[10px] font-mono ${e.rank === userRank ? "bg-primary/10 border border-primary/30" : "bg-muted/20"}`}>
          <span className={`font-display font-bold text-sm w-6 text-center ${i < 3 ? medalColors[i] : "text-muted-foreground"}`}>
            {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${e.rank}`}
          </span>
          <div className="flex-1 min-w-0">
            <span className="truncate">{e.name}</span>
            {e.rank === userRank && <span className="ml-1 text-primary">(YOU)</span>}
          </div>
          <span className="font-semibold">{e.score}</span>
          <span className={e.change > 0 ? "text-success" : e.change < 0 ? "text-destructive" : "text-muted-foreground"}>
            {e.change > 0 ? <TrendingUp className="w-3 h-3" /> : e.change < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
          </span>
        </div>
      ))}
    </div>
  );
};

export default Leaderboard;
export type { LeaderboardEntry };
