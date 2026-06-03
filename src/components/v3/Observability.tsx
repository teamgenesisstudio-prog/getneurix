import { useEffect, useMemo, useRef, useState } from "react";
import { storage, pushActivity } from "@/lib/v3/storage";
import { C, mono, sans, fmtTs, relTime } from "@/lib/v3/ui";
import { Card, SectionLabel, Btn, Badge, Input, Select, Stat } from "./primitives";
import { TrendingUp, TrendingDown, X } from "lucide-react";

interface Point { ts: number; requests: number; failures: number; latencyMs: number }
interface LogRow { id: string; ts: number; request_id: string; model: string; status: string; latency: number; error_type: string; message: string }
interface Alert { id: string; severity: string; ts: string; rule: string; value: string }
interface Obs { points: Point[]; logs: LogRow[]; alerts: Alert[] }

const ERROR_TYPES = ["timeout", "parse_error", "rate_limit", "invalid_response", "pii_leak"];
const MODELS = ["gpt-4o", "claude-3.5", "gemini-1.5"];
const MESSAGES = ["Completion OK", "Schema validated", "Repaired malformed JSON", "Timeout @ upstream", "Rate limit hit", "PII detected and blocked", "Tool call dispatched", "Stream completed"];

const rand = (a: number, b: number) => Math.floor(a + Math.random() * (b - a));

export default function Observability() {
  const [data, setData] = useState<Obs>(() => storage.get<Obs>("nx_observability_data", { points: [], logs: [], alerts: [] }));
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterModel, setFilterModel] = useState("all");
  const [filterError, setFilterError] = useState("all");
  const [search, setSearch] = useState("");
  const [range, setRange] = useState("15m");
  const tick = useRef(0);

  // live update every 3s
  useEffect(() => {
    const i = setInterval(() => {
      tick.current++;
      setData(prev => {
        const now = Date.now();
        const requests = rand(80, 180);
        const failures = rand(0, Math.floor(requests * (Math.random() < 0.15 ? 0.12 : 0.05)));
        const latency = rand(220, 1500);
        const newPoint: Point = { ts: now, requests, failures, latencyMs: latency };
        const points = [...prev.points, newPoint].slice(-60);

        // 1-3 new log rows
        const newLogs: LogRow[] = Array.from({ length: rand(1, 4) }, () => {
          const isError = Math.random() < 0.18;
          const isWarn = !isError && Math.random() < 0.18;
          return {
            id: crypto.randomUUID(), ts: now - rand(0, 2000),
            request_id: "req_" + crypto.randomUUID().slice(0, 8),
            model: MODELS[rand(0, MODELS.length)],
            status: isError ? "error" : isWarn ? "warning" : "success",
            latency: rand(150, 2600),
            error_type: isError || isWarn ? ERROR_TYPES[rand(0, ERROR_TYPES.length)] : "",
            message: MESSAGES[rand(0, MESSAGES.length)],
          };
        });
        const logs = [...newLogs, ...prev.logs].slice(0, 200);

        // alert rules
        let alerts = prev.alerts;
        const last10 = points.slice(-10);
        const failRate = last10.reduce((a, p) => a + p.failures, 0) / Math.max(1, last10.reduce((a, p) => a + p.requests, 0));
        if (failRate > 0.05 && !alerts.some(a => a.rule === "Failure rate >5%" && Date.now() - new Date(a.ts).getTime() < 60000)) {
          const al = { id: crypto.randomUUID(), severity: "warn", ts: new Date().toISOString(), rule: "Failure rate >5%", value: (failRate * 100).toFixed(1) + "%" };
          alerts = [al, ...alerts].slice(0, 20);
          pushActivity({ module: "observability", type: "alert_raised", message: `Failure rate ${al.value}`, severity: "warn" });
        }
        if (latency > 2000 && !alerts.some(a => a.rule === "Latency >2000ms" && Date.now() - new Date(a.ts).getTime() < 60000)) {
          alerts = [{ id: crypto.randomUUID(), severity: "warn", ts: new Date().toISOString(), rule: "Latency >2000ms", value: latency + "ms" }, ...alerts].slice(0, 20);
        }

        const next = { points, logs, alerts };
        storage.set("nx_observability_data", next);
        return next;
      });
    }, 3000);
    return () => clearInterval(i);
  }, []);

  const last = data.points[data.points.length - 1];
  const prev = data.points[data.points.length - 2];
  const rpmTrend = last && prev ? last.requests - prev.requests : 0;
  const latencyTrend = last && prev ? last.latencyMs - prev.latencyMs : 0;
  const failRate = last ? (last.failures / Math.max(1, last.requests)) * 100 : 0;
  const prevFailRate = prev ? (prev.failures / Math.max(1, prev.requests)) * 100 : 0;
  const frTrend = failRate - prevFailRate;

  const filteredLogs = useMemo(() => data.logs.filter(l => {
    if (filterStatus !== "all" && l.status !== filterStatus) return false;
    if (filterModel !== "all" && l.model !== filterModel) return false;
    if (filterError !== "all" && l.error_type !== filterError) return false;
    if (search && !(l.message + l.request_id).toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [data.logs, filterStatus, filterModel, filterError, search]);

  const errorBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of ERROR_TYPES) counts[t] = 0;
    for (const l of data.logs) if (l.error_type) counts[l.error_type] = (counts[l.error_type] || 0) + 1;
    return counts;
  }, [data.logs]);

  const latencies = data.logs.map(l => l.latency).sort((a, b) => a - b);
  const pct = (p: number) => latencies[Math.floor(latencies.length * p)] ?? 0;
  const percentiles = { p50: pct(0.5), p75: pct(0.75), p90: pct(0.9), p95: pct(0.95), p99: pct(0.99) };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <Stat label="Requests / min" value={(last?.requests ?? 0) * 20} sub={<TrendIndicator v={rpmTrend} />} />
        <Stat label="Failure Rate" value={failRate.toFixed(1) + "%"} sub={<TrendIndicator v={frTrend} invert />} accent={failRate > 5 ? C.danger : C.success} />
        <Stat label="Avg Latency" value={(last?.latencyMs ?? 0) + "ms"} sub={<TrendIndicator v={latencyTrend} invert suffix="ms" />} />
        <Stat label="Active Alerts" value={data.alerts.length} accent={data.alerts.length ? C.warn : C.success} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 12 }}>
        <Card>
          <SectionLabel>Requests / s — Last 60 buckets</SectionLabel>
          <LineChart points={data.points} />
        </Card>
        <Card>
          <SectionLabel>Error Distribution</SectionLabel>
          <Donut data={errorBreakdown} />
        </Card>
        <Card>
          <SectionLabel>Latency Percentiles</SectionLabel>
          <PctBars data={percentiles} />
        </Card>
      </div>

      <Card>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
          <SectionLabel>Live Logs ({filteredLogs.length})</SectionLabel>
          <div style={{ flex: 1 }} />
          <div style={{ width: 200 }}><Input placeholder="Search messages or req_id..." value={search} onChange={e => setSearch(e.target.value)} /></div>
          <div style={{ width: 130 }}><Select value={filterStatus} onChange={setFilterStatus} options={["all", "success", "warning", "error"]} /></div>
          <div style={{ width: 130 }}><Select value={filterModel} onChange={setFilterModel} options={["all", ...MODELS]} /></div>
          <div style={{ width: 140 }}><Select value={filterError} onChange={setFilterError} options={["all", ...ERROR_TYPES]} /></div>
          <div style={{ width: 120 }}><Select value={range} onChange={setRange} options={["5m", "15m", "1h", "6h", "24h"]} /></div>
        </div>
        <div style={{ maxHeight: 320, overflowY: "auto", border: `1px solid ${C.border}`, borderRadius: 6 }}>
          <div style={{ display: "grid", gridTemplateColumns: "90px 110px 90px 70px 70px 110px 1fr", padding: "8px 12px", background: C.surface2, ...mono, fontSize: 9, letterSpacing: 1, textTransform: "uppercase", color: C.muted, position: "sticky", top: 0 }}>
            <span>TIME</span><span>REQ ID</span><span>MODEL</span><span>STATUS</span><span>LAT</span><span>ERROR</span><span>MESSAGE</span>
          </div>
          {filteredLogs.slice(0, 80).map(l => {
            const col = l.status === "error" ? C.danger : l.status === "warning" ? C.warn : C.success;
            return (
              <div key={l.id} style={{ display: "grid", gridTemplateColumns: "90px 110px 90px 70px 70px 110px 1fr", padding: "6px 12px", borderBottom: `1px solid ${C.border}`, ...mono, fontSize: 10, color: C.text }}>
                <span style={{ color: C.textDim }}>{fmtTs(l.ts)}</span>
                <span style={{ color: C.textDim }}>{l.request_id}</span>
                <span>{l.model}</span>
                <span style={{ color: col, fontWeight: 600 }}>{l.status}</span>
                <span style={{ color: l.latency > 1500 ? C.warn : C.textDim }}>{l.latency}ms</span>
                <span style={{ color: C.warn }}>{l.error_type || "—"}</span>
                <span style={{ color: C.textDim }}>{l.message}</span>
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <SectionLabel>Active Alerts</SectionLabel>
        {data.alerts.length === 0 ? <div style={{ ...mono, fontSize: 11, color: C.muted, padding: 10 }}>No active alerts</div> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {data.alerts.map(a => (
              <div key={a.id} style={{ display: "grid", gridTemplateColumns: "80px 1fr 100px 100px 30px", padding: "8px 12px", background: C.warn + "0e", border: `1px solid ${C.warn}33`, borderRadius: 6, ...mono, fontSize: 11, alignItems: "center" }}>
                <Badge color={C.warn}>{a.severity}</Badge>
                <span style={{ color: C.text }}>{a.rule}</span>
                <span style={{ color: C.warn, fontWeight: 600 }}>{a.value}</span>
                <span style={{ color: C.textDim }}>{relTime(a.ts)}</span>
                <button onClick={() => { const next = { ...data, alerts: data.alerts.filter(x => x.id !== a.id) }; setData(next); storage.set("nx_observability_data", next); }} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer" }}><X size={12} /></button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

const TrendIndicator = ({ v, invert, suffix = "" }: { v: number; invert?: boolean; suffix?: string }) => {
  const good = invert ? v < 0 : v > 0;
  const color = v === 0 ? C.muted : good ? C.success : C.danger;
  const Icon = v >= 0 ? TrendingUp : TrendingDown;
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color }}><Icon size={10} />{v > 0 ? "+" : ""}{v}{suffix}</span>;
};

function LineChart({ points }: { points: Point[] }) {
  if (points.length < 2) return <div style={{ ...mono, color: C.muted, fontSize: 11, padding: 30 }}>Collecting data...</div>;
  const w = 600, h = 140;
  const max = Math.max(...points.map(p => p.requests), 1);
  const step = w / (points.length - 1);
  const reqPts = points.map((p, i) => `${i * step},${h - (p.requests / max) * (h - 10) - 4}`).join(" ");
  const failPts = points.map((p, i) => `${i * step},${h - (p.failures / max) * (h - 10) - 4}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: 140 }}>
      <polyline points={`0,${h} ${reqPts} ${w},${h}`} fill={C.accent + "15"} stroke="none" />
      <polyline points={reqPts} fill="none" stroke={C.accent} strokeWidth={1.5} />
      <polyline points={failPts} fill="none" stroke={C.danger} strokeWidth={1.5} />
    </svg>
  );
}

function Donut({ data }: { data: Record<string, number> }) {
  const colors = [C.danger, C.warn, "#a78bfa", C.accent, "#ec4899"];
  const total = Object.values(data).reduce((a, b) => a + b, 0) || 1;
  let acc = 0;
  const entries = Object.entries(data);
  const r = 50, cx = 60, cy = 60, stroke = 14;
  const C2 = 2 * Math.PI * r;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <svg width={120} height={120}>
        {entries.map(([k, v], i) => {
          const frac = v / total;
          const dash = C2 * frac;
          const off = C2 - dash;
          const rot = (acc / total) * 360 - 90;
          acc += v;
          return <circle key={k} cx={cx} cy={cy} r={r} fill="none" stroke={colors[i % colors.length]} strokeWidth={stroke}
            strokeDasharray={`${dash} ${off}`} transform={`rotate(${rot} ${cx} ${cy})`} />;
        })}
      </svg>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
        {entries.map(([k, v], i) => (
          <div key={k} style={{ ...mono, fontSize: 10, display: "flex", alignItems: "center", gap: 6, color: C.textDim }}>
            <span style={{ width: 8, height: 8, background: colors[i % colors.length], borderRadius: 2 }} />
            <span style={{ flex: 1 }}>{k}</span>
            <span style={{ color: C.text }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PctBars({ data }: { data: Record<string, number> }) {
  const max = Math.max(...Object.values(data), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {Object.entries(data).map(([k, v]) => (
        <div key={k} style={{ display: "grid", gridTemplateColumns: "40px 1fr 60px", gap: 8, alignItems: "center", ...mono, fontSize: 10 }}>
          <span style={{ color: C.muted, textTransform: "uppercase" }}>{k}</span>
          <div style={{ height: 8, background: C.surface2, borderRadius: 2, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${(v / max) * 100}%`, background: v > 1500 ? C.warn : C.accent }} />
          </div>
          <span style={{ color: C.text, textAlign: "right" }}>{v}ms</span>
        </div>
      ))}
    </div>
  );
}
