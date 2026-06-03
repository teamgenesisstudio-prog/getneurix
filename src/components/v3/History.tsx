import { useMemo, useState } from "react";
import { storage } from "@/lib/v3/storage";
import { C, mono, sans, relTime, downloadJSON, riskColor } from "@/lib/v3/ui";
import { Card, SectionLabel, Btn, Badge, Select, Input } from "./primitives";
import { Trash2, Download, ChevronDown, ChevronRight } from "lucide-react";

type Row = { id: string; module: string; timestamp: string; summary: string; level: string; raw: any };

export default function History() {
  const [tick, setTick] = useState(0);
  const [moduleFilter, setModuleFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const rows: Row[] = useMemo(() => {
    const fw = storage.get<any[]>("nx_firewall_history", []).map(h => ({ id: h.id, module: "firewall", timestamp: h.timestamp, summary: `${h.mode} scan · ${h.model} · ${h.prompt.slice(0, 60)}`, level: h.result.riskLevel, raw: h }));
    const rp = storage.get<any[]>("nx_repair_history", []).map(h => ({ id: h.id, module: "repair", timestamp: h.timestamp, summary: `${h.outputType} repair · ${h.result.fixesApplied.length} fixes`, level: h.result.validationStatus, raw: h }));
    const rt = storage.get<any[]>("nx_redteam_history", []).map(h => ({ id: h.id, module: "redteam", timestamp: h.timestamp, summary: `Target: ${h.target.slice(0, 60)}`, level: h.result.securityScore >= 80 ? "SAFE" : h.result.securityScore >= 60 ? "MEDIUM" : "HIGH", raw: h }));
    const reg: Row[] = storage.get<any[]>("nx_regression_suites", []).flatMap(s => (s.runs || []).map((r: any) => ({ id: r.id, module: "regression", timestamp: r.timestamp, summary: `${s.name} · ${r.passRate}% pass`, level: r.passRate >= 90 ? "SAFE" : r.passRate >= 70 ? "MEDIUM" : "HIGH", raw: { suite: s.name, ...r } })));
    return [...fw, ...rp, ...rt, ...reg].sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp));
  }, [tick]);

  const filtered = rows.filter(r => {
    if (moduleFilter !== "all" && r.module !== moduleFilter) return false;
    if (levelFilter !== "all" && r.level !== levelFilter) return false;
    if (search && !r.summary.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const remove = (r: Row) => {
    const key = `nx_${r.module}_history` as any;
    if (r.module === "regression") {
      const suites = storage.get<any[]>("nx_regression_suites", []);
      const next = suites.map(s => ({ ...s, runs: s.runs.filter((x: any) => x.id !== r.id) }));
      storage.set("nx_regression_suites", next);
    } else {
      const cur = storage.get<any[]>(key, []);
      storage.set(key, cur.filter(x => x.id !== r.id));
    }
    setTick(t => t + 1);
  };

  return (
    <Card>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
        <SectionLabel>Scan History — {filtered.length} entries</SectionLabel>
        <div style={{ flex: 1 }} />
        <div style={{ width: 220 }}><Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} /></div>
        <div style={{ width: 150 }}><Select value={moduleFilter} onChange={setModuleFilter} options={["all", "firewall", "regression", "repair", "redteam"]} /></div>
        <div style={{ width: 150 }}><Select value={levelFilter} onChange={setLevelFilter} options={["all", "CRITICAL", "HIGH", "MEDIUM", "LOW", "SAFE", "VALID", "PARTIAL", "FAILED"]} /></div>
        <Btn variant="ghost" size="sm" onClick={() => downloadJSON("history-export.json", rows)}><Download size={11} style={{ marginRight: 4 }} />Export All</Btn>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {filtered.length === 0 && <div style={{ ...mono, fontSize: 11, color: C.muted, padding: 30, textAlign: "center" }}>No history matching filters</div>}
        {filtered.map(r => (
          <div key={r.id}>
            <div style={{ display: "grid", gridTemplateColumns: "20px 100px 90px 1fr 100px 30px", padding: "8px 12px", background: C.surface2, borderRadius: 4, ...mono, fontSize: 11, alignItems: "center", cursor: "pointer" }}
              onClick={() => setExpanded(expanded === r.id ? null : r.id)}>
              {expanded === r.id ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              <span style={{ color: C.textDim, textTransform: "uppercase" }}>{r.module}</span>
              <Badge color={riskColor(r.level)}>{r.level}</Badge>
              <span style={{ color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.summary}</span>
              <span style={{ color: C.muted }}>{relTime(r.timestamp)}</span>
              <button onClick={e => { e.stopPropagation(); remove(r); }} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer" }}><Trash2 size={12} /></button>
            </div>
            {expanded === r.id && (
              <pre style={{ ...mono, fontSize: 10, color: C.textDim, background: C.bg, padding: 12, borderRadius: 4, marginTop: 4, maxHeight: 320, overflow: "auto", border: `1px solid ${C.border}` }}>
                {JSON.stringify(r.raw, null, 2)}
              </pre>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
