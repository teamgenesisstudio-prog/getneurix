// NEURIX Sentinel — client-side Compute Guard + Liability Mapper
import { supabase } from "@/integrations/supabase/client";

export type ThreatResponse = "Monitoring" | "Downgraded" | "Throttled" | "Terminated";
export type ActiveModel = "gpt-4o" | "gpt-4o-mini";

export interface SentinelState {
  sessionId: string;
  sessionCost: number;
  totalTokens: number;
  requestsLastMinute: number[];
  activeModel: ActiveModel;
  threat: ThreatResponse;
  legalExposure: number;
  terminated: boolean;
}

export const BUDGET_CAP = 5.0;
export const RATE_LIMIT_PER_MIN = 5;
export const TOKEN_DOWNGRADE_THRESHOLD = 1000;
// rough pricing (per token, USD): gpt-4o $0.000005, gpt-4o-mini $0.00000015
const PRICE: Record<ActiveModel, number> = { "gpt-4o": 0.000005, "gpt-4o-mini": 0.00000015 };

export const CLAUSE_MAP = {
  "PII": { article: "GDPR Art.32", title: "Data Governance & PII Leakage", weight: 25 },
  "PROMPT_INJECTION": { article: "EU AI Act Art.10", title: "Adversarial Resilience", weight: 25 },
  "TOXIC_BIAS": { article: "EU AI Act Art.10", title: "Bias & Toxicity", weight: 25 },
  "BUDGET": { article: "Internal Policy", title: "Cost Containment", weight: 0 },
} as const;

export function newSession(): SentinelState {
  return {
    sessionId: crypto.randomUUID(),
    sessionCost: 0,
    totalTokens: 0,
    requestsLastMinute: [],
    activeModel: "gpt-4o",
    threat: "Monitoring",
    legalExposure: 0,
    terminated: false,
  };
}

export interface InterceptResult {
  allow: boolean;
  state: SentinelState;
  reason?: string;
}

export function intercept(state: SentinelState, prompt: string): InterceptResult {
  const next = { ...state, requestsLastMinute: [...state.requestsLastMinute] };
  const now = Date.now();
  next.requestsLastMinute = next.requestsLastMinute.filter(t => now - t < 60_000);

  if (next.terminated || next.sessionCost >= BUDGET_CAP) {
    next.terminated = true;
    next.threat = "Terminated";
    return { allow: false, state: next, reason: "Budget exhausted ($5.00 cap reached)" };
  }

  const promptTokens = Math.ceil(prompt.length / 4);
  if (promptTokens > TOKEN_DOWNGRADE_THRESHOLD || next.requestsLastMinute.length >= RATE_LIMIT_PER_MIN) {
    next.activeModel = "gpt-4o-mini";
    next.threat = next.requestsLastMinute.length >= RATE_LIMIT_PER_MIN ? "Throttled" : "Downgraded";
  } else {
    next.threat = "Monitoring";
  }

  next.requestsLastMinute.push(now);
  return { allow: true, state: next };
}

export function chargeUsage(state: SentinelState, tokens: number): SentinelState {
  const cost = tokens * PRICE[state.activeModel];
  return {
    ...state,
    totalTokens: state.totalTokens + tokens,
    sessionCost: state.sessionCost + cost,
  };
}

export interface Violation {
  type: keyof typeof CLAUSE_MAP;
  clause: string;
  title: string;
  match: string;
}

const PII = [
  { name: "email", re: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/ },
  { name: "ssn", re: /\b\d{3}-\d{2}-\d{4}\b/ },
  { name: "phone", re: /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/ },
  { name: "card", re: /\b(?:\d[ -]*?){13,16}\b/ },
];
const INJ = [/ignore (all |the |previous |above )?(prior |previous )?(instructions|prompts|rules)/i, /system prompt/i, /jailbreak|DAN mode/i, /reveal (your|the) (system )?prompt/i];
const TOX = [/\b(kill|murder|hate|racist|sexist|terrorist|bomb)\b/i];

export function scanText(text: string): Violation[] {
  const out: Violation[] = [];
  if (!text) return out;
  for (const p of PII) {
    const m = text.match(p.re);
    if (m) out.push({ type: "PII", clause: CLAUSE_MAP.PII.article, title: CLAUSE_MAP.PII.title, match: m[0].slice(0, 40) });
  }
  for (const p of INJ) {
    const m = text.match(p);
    if (m) out.push({ type: "PROMPT_INJECTION", clause: CLAUSE_MAP.PROMPT_INJECTION.article, title: CLAUSE_MAP.PROMPT_INJECTION.title, match: m[0].slice(0, 40) });
  }
  for (const p of TOX) {
    const m = text.match(p);
    if (m) out.push({ type: "TOXIC_BIAS", clause: CLAUSE_MAP.TOXIC_BIAS.article, title: CLAUSE_MAP.TOXIC_BIAS.title, match: m[0].slice(0, 40) });
  }
  return out;
}

export function applyViolations(state: SentinelState, violations: Violation[]): SentinelState {
  const add = violations.reduce((s, v) => s + (CLAUSE_MAP[v.type]?.weight || 0), 0);
  return { ...state, legalExposure: Math.min(100, state.legalExposure + add) };
}

export async function logForensic(opts: {
  sessionId: string; eventType: string; severity?: "info" | "warning" | "critical";
  model?: string; prompt?: string; response?: string; clause?: string;
  cost?: number; tokens?: number; metadata?: Record<string, unknown>;
}) {
  try {
    await (supabase.from("forensic_logs") as any).insert({
      session_id: opts.sessionId,
      event_type: opts.eventType,
      severity: opts.severity || "info",
      model: opts.model,
      prompt_excerpt: opts.prompt?.slice(0, 300),
      response_excerpt: opts.response?.slice(0, 300),
      violation_clause: opts.clause,
      cost_usd: opts.cost,
      tokens: opts.tokens,
      metadata: opts.metadata || {},
    });
  } catch (e) {
    console.error("logForensic", e);
  }
}
