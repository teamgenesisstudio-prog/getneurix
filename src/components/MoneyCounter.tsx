import { useEffect, useState } from "react";
import { DollarSign, TrendingUp } from "lucide-react";

interface MoneyCounterProps {
  amount: number;
  label?: string;
}

const MoneyCounter = ({ amount, label = "MONEY SAVED" }: MoneyCounterProps) => {
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    if (amount === 0) { setDisplayed(0); return; }
    const step = Math.max(1, Math.floor(amount / 60));
    const timer = setInterval(() => {
      setDisplayed((prev) => {
        if (prev + step >= amount) { clearInterval(timer); return amount; }
        return prev + step;
      });
    }, 16);
    return () => clearInterval(timer);
  }, [amount]);

  return (
    <div className="glass-panel rounded-lg p-5 neon-border-cyan">
      <div className="flex items-center gap-2 mb-2">
        <DollarSign className="w-4 h-4 text-success" />
        <span className="text-xs font-mono text-muted-foreground tracking-widest uppercase">{label}</span>
        <TrendingUp className="w-3 h-3 text-success ml-auto" />
      </div>
      <div className="font-display text-3xl font-bold text-success neon-glow-cyan">
        ${displayed.toLocaleString()}
      </div>
    </div>
  );
};

export default MoneyCounter;
