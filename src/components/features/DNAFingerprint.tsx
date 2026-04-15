import { Dna } from "lucide-react";

interface Props { traits: { label: string; value: number; color: string }[]; modelName?: string; }

const DNAFingerprint = ({ traits, modelName = "Your Model" }: Props) => {
  const size = 200;
  const center = size / 2;
  const radius = 70;
  const angleStep = (2 * Math.PI) / (traits.length || 1);

  const points = traits.map((t, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const r = (t.value / 100) * radius;
    return { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle), ...t };
  });

  const pathData = points.length > 2 ? `M ${points.map(p => `${p.x},${p.y}`).join(" L ")} Z` : "";

  return (
    <div className="flex flex-col items-center gap-3">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {[20, 40, 60, 80, 100].map(v => (
          <circle key={v} cx={center} cy={center} r={(v / 100) * radius} fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" strokeDasharray="2,2" />
        ))}
        {traits.map((t, i) => {
          const angle = i * angleStep - Math.PI / 2;
          const lx = center + radius * 1.15 * Math.cos(angle);
          const ly = center + radius * 1.15 * Math.sin(angle);
          return <text key={i} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" className="fill-muted-foreground text-[7px] font-mono">{t.label}</text>;
        })}
        {pathData && <path d={pathData} fill="hsl(var(--primary) / 0.15)" stroke="hsl(var(--primary))" strokeWidth="1.5" />}
        {points.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="3" fill={`hsl(var(--${p.color}))`} />)}
      </svg>
      <div className="text-[10px] font-mono text-muted-foreground">{modelName} DNA</div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        {traits.map((t, i) => (
          <div key={i} className="flex items-center gap-1 text-[9px] font-mono">
            <span className={`w-2 h-2 rounded-full bg-${t.color}`} />
            <span className="text-muted-foreground">{t.label}:</span>
            <span>{t.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DNAFingerprint;
