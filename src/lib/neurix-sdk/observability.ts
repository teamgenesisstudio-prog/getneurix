// Observability — JSONL log buffer + simple Prometheus-style counters
import type { ObservabilityConfig } from "./config";

export interface LogRecord {
  timestamp: string;
  requestId: string;
  model: string;
  modelRequested: string;
  costActual: number;
  costSaved: number;
  tokens: number;
  latencyMs: number;
  piiRedacted: string[];
  healed: boolean;
  fellBack: boolean;
  pivoted: boolean;
  error?: string;
}

const BUFFER: LogRecord[] = [];
const COUNTERS: Record<string, number> = {
  neurix_requests_total: 0,
  neurix_pii_redactions_total: 0,
  neurix_self_heal_total: 0,
  neurix_self_heal_fallback_total: 0,
  neurix_compute_pivots_total: 0,
  neurix_cost_usd_total: 0,
  neurix_cost_saved_usd_total: 0,
};

const LEVELS = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };

export function log(rec: LogRecord, cfg: ObservabilityConfig) {
  COUNTERS.neurix_requests_total += 1;
  COUNTERS.neurix_pii_redactions_total += rec.piiRedacted.length;
  if (rec.healed) COUNTERS.neurix_self_heal_total += 1;
  if (rec.fellBack) COUNTERS.neurix_self_heal_fallback_total += 1;
  if (rec.pivoted) COUNTERS.neurix_compute_pivots_total += 1;
  COUNTERS.neurix_cost_usd_total += rec.costActual;
  COUNTERS.neurix_cost_saved_usd_total += rec.costSaved;

  if (cfg.exportJsonl) {
    BUFFER.push(rec);
    if (BUFFER.length > 500) BUFFER.shift();
  }
  if (LEVELS[cfg.logLevel] <= LEVELS.INFO) {
    // eslint-disable-next-line no-console
    console.log("[neurix]", JSON.stringify(rec));
  }
}

export function getJsonl(): LogRecord[] {
  return [...BUFFER];
}

export function getPrometheus(): string {
  return Object.entries(COUNTERS)
    .map(([k, v]) => `# TYPE ${k} counter\n${k} ${v}`)
    .join("\n");
}

export function resetTelemetry() {
  BUFFER.length = 0;
  for (const k of Object.keys(COUNTERS)) COUNTERS[k] = 0;
}
