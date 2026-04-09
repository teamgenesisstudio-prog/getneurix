import { DollarSign, Clock, Bug, TrendingDown } from "lucide-react";

interface ROIData {
  moneySaved: number;
  timeSavedHours: number;
  failuresPrevented: number;
  downtimeAvoided: number;
}

interface ROICalculatorProps {
  data: ROIData;
}

const ROICalculator = ({ data }: ROICalculatorProps) => {
  const stats = [
    { icon: <DollarSign className="w-5 h-5 text-success" />, label: "Money Saved", value: `$${data.moneySaved.toLocaleString()}` },
    { icon: <Clock className="w-5 h-5 text-primary" />, label: "Hours Saved", value: `${data.timeSavedHours}h` },
    { icon: <Bug className="w-5 h-5 text-warning" />, label: "Failures Prevented", value: data.failuresPrevented.toString() },
    { icon: <TrendingDown className="w-5 h-5 text-accent" />, label: "Downtime Avoided", value: `${data.downtimeAvoided}h` },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map((s) => (
        <div key={s.label} className="bg-muted/40 rounded-lg p-3 text-center">
          <div className="flex justify-center mb-2">{s.icon}</div>
          <div className="font-display text-lg font-bold">{s.value}</div>
          <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">{s.label}</div>
        </div>
      ))}
    </div>
  );
};

export default ROICalculator;
