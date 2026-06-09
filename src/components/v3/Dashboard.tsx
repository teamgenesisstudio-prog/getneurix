import { useEffect, useMemo, useState } from "react";
import { storage, seedIfEmpty, type ActivityEvent } from "@/lib/v3/storage";
import { C, mono, sans, relTime } from "@/lib/v3/ui";
import { Card, ScoreRing, Sparkline, Stat, SectionLabel, Btn, Badge } from "./primitives";
import { Shield, AlertTriangle, Activity, Wrench, Crosshair, ArrowRight } from "lucide-react";

type Sec = "dashboard" | "firewall" | "regression" | "repair" | "observability" | "redteam" | "history" | "keys" | "settings";

export default function Dashboard({ onNav }: { onNav: (s: Sec) => void }) {
  useEffect(() => { seedIfEmpty(); }, []);
  const [, setTick] = useState(0);
  useEffect(() => { const i = setInterval(() => setTick(t => t + 1), 5000); return () => clearInterval(i); }, []);

  const firewall = storage.get<any[]>("nx_firewall_history", []);
  const repairs = storage.get<any[]>("nx_repair_history", []);
  const redteam = storage.get<any[]>("nx_redteam_history", []);
  const obs = storage.get<any>("nx_observability_data", { points: [], logs: [], alerts: [] });
  const feed = storage.get<ActivityEvent[]>("nx_activity_feed", []);

  const totalRequests = useMemo(() => obs.points?.reduce((a: number, p: any) => a + p.requests, 0) ?? 0, [obs]);
  const totalFailures = useMemo(() => obs.points?.reduce((a: number, p: any) => a + p.failures, 0) ?? 0, [obs]);
  const repairSuccess = repairs.length ? Math.round((repairs.filter(r => r.result?.validationStatus === "VALID").length / repairs.length) * 100) : 0;

  const threats24h = firewall.filter(f => Date.now() - new Date(f.timestamp).getTime() < 86400000 && f.result?.riskLevel !== "SAFE").length;

  const health = useMemo(() => {
    if (!totalRequests && !redteam.length && !firewall.length) return 100;
    const failRate = totalRequests ? (totalFailures / totalRequests) : 0;
    const securityAvg = redteam.length ? redteam.reduce((a, r) => a + (r.result?.securityScore || 0), 0) / redteam.length : 100;
    return Math.round(Math.max(0, Math.min(100, 100 - failRate * 200 - (100 - securityAvg) * 0.4)));
  }, [totalRequests, totalFailures, redteam, firewall.length]);

  // 7-day buckets from real observability points only.
  const days = 7;
  const reqSeries = Array.from({ length: days }, (_, i) => {
    const slice = obs.points?.slice(Math.floor((i / days) * obs.points.length), Math.floor(((i + 1) / days) * obs.points.length)) ?? [];
    return slice.reduce((a: number, p: any) => a + p.requests, 0);
  });
  const failSeries = reqSeries.map((_, i) => {
    const slice = obs.points?.slice(Math.floor((i / days) * obs.points.length), Math.floor(((i + 1) / days) * obs.points.length)) ?? [];
    return slice.reduce((a: number, p: any) => a + p.failures, 0);
  });
  const repairSeries = Array.from({ length: days }, () => repairs.length ? Math.round(repairs.length / days) : 0);

  const modules: { id: Sec; label: string; icon: any; color: string; desc: string }[] = [
    { id: "firewall", label: "AI Firewall", icon: Shield, color: C.accent, desc: "Real-time prompt threat detection" },
    { id: "regression", label: "Regression", icon: Activity, color: "#a78bfa", desc: "Prompt baseline drift testing" },
    { id: "repair", label: "Self-Healing", icon: Wrench, color: C.success, desc: "Auto-repair malformed outputs" },
    { id: "observability", label: "Observability", icon: AlertTriangle, color: C.warn, desc: "Live failure stream + alerts" },
    { id: "redteam", label: "Red Team", icon: Crosshair, color: C.danger, desc: "Automated adversarial scanning" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Top row: health + stats */}
      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 16 }}>
        <Card>
          <SectionLabel>System Health</SectionLabel>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "8px 0 16px" }}>
            <ScoreRing score={health} label="HEALTH" />
          </div>
          <div style={{ ...mono, fontSize: 10, color: C.textDim, textAlign: "center" }}>
            {health >= 80 ? "All systems nominal" : health >= 60 ? "Minor degradation detected" : "Active issues — review alerts"}
          </div>
        </Card>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          <Stat label="Threats 24h" value={threats24h} sub={`${firewall.length} scans total`} accent={threats24h > 0 ? C.danger : C.success} />
          <Stat label="Requests" value={totalRequests.toLocaleString()} sub="last hour rolling" />
          <Stat label="Repair Success" value={repairSuccess + "%"} sub={`${repairs.length} repaired`} accent={C.success} />
          <Stat label="Active Alerts" value={obs.alerts?.length ?? 0} sub="across all modules" accent={obs.alerts?.length ? C.warn : C.success} />
          <Card style={{ gridColumn: "span 4", padding: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
              <SparkCell label="REQUESTS / 7D" value={reqSeries.reduce((a, b) => a + b, 0)} data={reqSeries} color={C.accent} />
              <SparkCell label="FAILURES / 7D" value={failSeries.reduce((a, b) => a + b, 0)} data={failSeries} color={C.danger} />
              <SparkCell label="REPAIRS / 7D" value={repairSeries.reduce((a, b) => a + b, 0)} data={repairSeries} color={C.success} />
            </div>
          </Card>
        </div>
      </div>

      {/* Quick launch */}
      <Card>
        <SectionLabel>Quick Launch</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
          {modules.map(m => (
            <button key={m.id} onClick={() => onNav(m.id)}
              style={{ textAlign: "left", padding: 14, borderRadius: 8, background: C.surface2, border: `1px solid ${C.border}`, cursor: "pointer", transition: "all 0.15s", ...sans, color: C.text }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = m.color; e.currentTarget.style.background = m.color + "0d"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.surface2; }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <m.icon size={18} color={m.color} />
                <ArrowRight size={12} color={C.muted} />
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{m.label}</div>
              <div style={{ fontSize: 11, color: C.textDim }}>{m.desc}</div>
            </button>
          ))}
        </div>
      </Card>

      {/* Activity feed */}
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <SectionLabel>Recent Activity</SectionLabel>
          <Badge color={C.success}>LIVE</Badge>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {feed.slice(0, 10).map(ev => {
            const col = ev.severity === "error" ? C.danger : ev.severity === "warn" ? C.warn : ev.severity === "success" ? C.success : C.accent;
            return (
              <div key={ev.id} style={{ display: "grid", gridTemplateColumns: "100px 110px 1fr 80px", gap: 12, padding: "10px 0", borderBottom: `1px solid ${C.border}`, alignItems: "center" }}>
                <span style={{ ...mono, fontSize: 10, color: C.muted, textTransform: "uppercase" }}>{ev.module}</span>
                <Badge color={col}>{ev.type.replace(/_/g, " ")}</Badge>
                <span style={{ fontSize: 12, color: C.text }}>{ev.message}</span>
                <span style={{ ...mono, fontSize: 10, color: C.textDim, textAlign: "right" }}>{relTime(ev.timestamp)}</span>
              </div>
            );
          })}
          {feed.length === 0 && <div style={{ ...mono, fontSize: 11, color: C.muted, padding: 20, textAlign: "center" }}>No activity yet</div>}
        </div>
      </Card>
    </div>
  );
}

function SparkCell({ label, value, data, color }: { label: string; value: number; data: number[]; color: string }) {
  return (
    <div>
      <div style={{ ...mono, fontSize: 9, color: C.muted, letterSpacing: 1.4, textTransform: "uppercase" }}>{label}</div>
      <div style={{ ...mono, fontSize: 20, color, fontWeight: 600, margin: "4px 0 4px" }}>{value.toLocaleString()}</div>
      <Sparkline data={data} color={color} width={220} height={36} />
    </div>
  );
}
