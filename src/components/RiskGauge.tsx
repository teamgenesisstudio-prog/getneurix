import { useEffect, useState } from "react";

interface RiskGaugeProps {
  score: number;
  label?: string;
}

const RiskGauge = ({ score, label = "RELIABILITY SCORE" }: RiskGaugeProps) => {
  const [animatedScore, setAnimatedScore] = useState(0);
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (animatedScore / 100) * circumference;

  const getColor = (s: number) => {
    if (s >= 80) return "hsl(var(--neon-green))";
    if (s >= 50) return "hsl(var(--warning))";
    return "hsl(var(--destructive))";
  };

  const getRiskLabel = (s: number) => {
    if (s >= 80) return "LOW RISK";
    if (s >= 50) return "MEDIUM RISK";
    return "HIGH RISK";
  };

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScore(score), 100);
    return () => clearTimeout(timer);
  }, [score]);

  return (
    <div className="flex flex-col items-center gap-3">
      <svg viewBox="0 0 100 100" className="w-48 h-48 -rotate-90">
        <circle cx="50" cy="50" r="45" fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
        <circle
          cx="50" cy="50" r="45" fill="none"
          stroke={getColor(animatedScore)}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 1.5s ease-out, stroke 0.5s",
            filter: `drop-shadow(0 0 6px ${getColor(animatedScore)})`,
          }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center" style={{ marginTop: "2.5rem" }}>
        <span className="text-4xl font-display font-bold" style={{ color: getColor(animatedScore) }}>
          {animatedScore}
        </span>
        <span className="text-xs font-mono text-muted-foreground mt-1">{getRiskLabel(animatedScore)}</span>
      </div>
      <span className="text-xs font-mono text-muted-foreground tracking-widest uppercase">{label}</span>
    </div>
  );
};

export default RiskGauge;
