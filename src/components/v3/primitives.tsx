import { ReactNode, CSSProperties, useEffect, useState } from "react";
import { C, sans, mono } from "@/lib/v3/ui";

export const Card = ({ children, style, padded = true }: { children: ReactNode; style?: CSSProperties; padded?: boolean }) => (
  <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: padded ? 20 : 0, ...sans, ...style }}>
    {children}
  </div>
);

export const SectionLabel = ({ children }: { children: ReactNode }) => (
  <div style={{ ...mono, fontSize: 10, letterSpacing: 1.6, color: C.muted, textTransform: "uppercase", marginBottom: 12 }}>
    {children}
  </div>
);

export const Btn = ({
  onClick, disabled, children, variant = "primary", size = "md", style,
}: {
  onClick?: () => void; disabled?: boolean; children: ReactNode;
  variant?: "primary" | "ghost" | "danger"; size?: "sm" | "md"; style?: CSSProperties;
}) => {
  const bg = variant === "primary" ? C.accent : variant === "danger" ? C.danger : "transparent";
  const fg = variant === "ghost" ? C.text : "#000";
  const border = variant === "ghost" ? `1px solid ${C.border2}` : "none";
  return (
    <button
      onClick={onClick} disabled={disabled}
      style={{
        ...mono, fontSize: size === "sm" ? 10 : 11, letterSpacing: 1.2, textTransform: "uppercase",
        padding: size === "sm" ? "6px 10px" : "9px 14px", borderRadius: 6, cursor: disabled ? "not-allowed" : "pointer",
        background: bg, color: fg, border, opacity: disabled ? 0.4 : 1, transition: "filter 0.15s",
        fontWeight: 600, ...style,
      }}
      onMouseEnter={e => !disabled && (e.currentTarget.style.filter = "brightness(1.15)")}
      onMouseLeave={e => (e.currentTarget.style.filter = "brightness(1)")}
    >{children}</button>
  );
};

export const Badge = ({ children, color = C.accent }: { children: ReactNode; color?: string }) => (
  <span style={{ ...mono, fontSize: 9, letterSpacing: 1, textTransform: "uppercase", padding: "3px 8px", borderRadius: 4, background: color + "22", color, border: `1px solid ${color}44`, fontWeight: 600 }}>
    {children}
  </span>
);

export const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    style={{
      width: "100%", background: C.bg, border: `1px solid ${C.border}`, color: C.text,
      padding: "9px 12px", borderRadius: 6, fontSize: 13, outline: "none", ...sans, ...props.style,
    }}
  />
);

export const Textarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea
    {...props}
    style={{
      width: "100%", background: C.bg, border: `1px solid ${C.border}`, color: C.text,
      padding: 12, borderRadius: 6, fontSize: 12, outline: "none", resize: "vertical", minHeight: 100, ...mono, ...props.style,
    }}
  />
);

export const Select = ({ value, onChange, options, style }: { value: string; onChange: (v: string) => void; options: string[]; style?: CSSProperties }) => (
  <select
    value={value} onChange={e => onChange(e.target.value)}
    style={{ width: "100%", background: C.bg, border: `1px solid ${C.border}`, color: C.text, padding: "8px 10px", borderRadius: 6, fontSize: 12, outline: "none", ...mono, ...style }}
  >
    {options.map(o => <option key={o} value={o}>{o}</option>)}
  </select>
);

export const Stat = ({ label, value, sub, accent = C.accent }: { label: string; value: ReactNode; sub?: ReactNode; accent?: string }) => (
  <Card style={{ padding: 18 }}>
    <div style={{ ...mono, fontSize: 9, letterSpacing: 1.4, color: C.muted, textTransform: "uppercase" }}>{label}</div>
    <div style={{ ...mono, fontSize: 28, color: accent, marginTop: 6, fontWeight: 600 }}>{value}</div>
    {sub && <div style={{ ...mono, fontSize: 10, color: C.textDim, marginTop: 4 }}>{sub}</div>}
  </Card>
);

// Animated number counter
export function useCounter(target: number, duration = 800) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const t0 = performance.now();
    let raf = 0;
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setV(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return v;
}

// Sparkline SVG
export const Sparkline = ({ data, color = C.accent, height = 40, width = 200 }: { data: number[]; color?: string; height?: number; width?: number }) => {
  if (!data.length) return <svg width={width} height={height} />;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const step = width / Math.max(1, data.length - 1);
  const pts = data.map((v, i) => `${i * step},${height - ((v - min) / range) * (height - 4) - 2}`).join(" ");
  return (
    <svg width={width} height={height}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} />
      <polyline points={`0,${height} ${pts} ${width},${height}`} fill={color + "18"} stroke="none" />
    </svg>
  );
};

// Score ring
export const ScoreRing = ({ score, size = 140, label }: { score: number; size?: number; label?: string }) => {
  const v = useCounter(score);
  const r = size / 2 - 10;
  const c = 2 * Math.PI * r;
  const off = c - (v / 100) * c;
  const color = score >= 80 ? C.success : score >= 60 ? C.accent : score >= 40 ? C.warn : C.danger;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke={C.border2} strokeWidth={6} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={6} fill="none"
          strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.8s ease" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ ...mono, fontSize: size / 4, color, fontWeight: 600 }}>{v}</div>
        {label && <div style={{ ...mono, fontSize: 9, color: C.muted, letterSpacing: 1.4, textTransform: "uppercase", marginTop: 2 }}>{label}</div>}
      </div>
    </div>
  );
};

export const Shimmer = ({ height = 12 }: { height?: number }) => (
  <div style={{ height, borderRadius: 4, background: `linear-gradient(90deg, ${C.surface2}, ${C.border2}, ${C.surface2})`, backgroundSize: "200% 100%", animation: "nxShimmer 1.4s linear infinite" }} />
);
