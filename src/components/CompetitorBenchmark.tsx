interface Competitor {
  name: string;
  score: number;
  color: string;
}

const competitors: Competitor[] = [
  { name: "NEURIX", score: 97, color: "bg-primary" },
  { name: "Scale AI", score: 62, color: "bg-muted-foreground" },
  { name: "GPT-4 Raw", score: 71, color: "bg-muted-foreground" },
  { name: "Claude Raw", score: 74, color: "bg-muted-foreground" },
  { name: "Manual QA", score: 45, color: "bg-muted-foreground" },
];

const CompetitorBenchmark = () => (
  <div className="space-y-3">
    {competitors.map((c) => (
      <div key={c.name} className="space-y-1">
        <div className="flex justify-between text-xs font-mono">
          <span className={c.name === "NEURIX" ? "text-primary font-bold" : "text-muted-foreground"}>
            {c.name}
          </span>
          <span className={c.name === "NEURIX" ? "text-primary" : "text-muted-foreground"}>{c.score}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${
              c.name === "NEURIX" ? "bg-primary shadow-[0_0_10px_hsl(var(--primary))]" : "bg-muted-foreground/40"
            }`}
            style={{ width: `${c.score}%` }}
          />
        </div>
      </div>
    ))}
  </div>
);

export default CompetitorBenchmark;
