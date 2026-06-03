// Shared V3 design tokens + helpers.
export const C = {
  bg: "#0a0a0b",
  surface: "#111114",
  surface2: "#16161b",
  border: "#1e1e24",
  border2: "#2a2a32",
  accent: "#00d4ff",
  danger: "#ff4d4f",
  warn: "#f5a623",
  success: "#00c853",
  muted: "#52525b",
  text: "#e4e4e7",
  textDim: "#a1a1aa",
};

export const sans = { fontFamily: "'DM Sans', system-ui, sans-serif" } as const;
export const mono = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" } as const;

export function riskColor(level: string): string {
  switch (level) {
    case "CRITICAL": return C.danger;
    case "HIGH": return "#ff7a45";
    case "MEDIUM": return C.warn;
    case "LOW": return C.accent;
    case "SAFE": return C.success;
    default: return C.muted;
  }
}

export function relTime(iso: string | number): string {
  const t = typeof iso === "string" ? new Date(iso).getTime() : iso;
  const s = Math.max(0, (Date.now() - t) / 1000);
  if (s < 60) return Math.floor(s) + "s ago";
  if (s < 3600) return Math.floor(s / 60) + "m ago";
  if (s < 86400) return Math.floor(s / 3600) + "h ago";
  return Math.floor(s / 86400) + "d ago";
}

export function fmtTs(iso: string | number): string {
  const d = new Date(typeof iso === "string" ? iso : iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export function downloadJSON(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
