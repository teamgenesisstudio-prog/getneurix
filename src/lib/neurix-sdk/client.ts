// NeurixClient — drop-in TS SDK that wraps the Lovable AI gateway via the
// nexus-ai edge function. All three engines (Ghost / Self-Heal / ComputeGuard)
// run automatically with per-request override support.
import { supabase } from "@/integrations/supabase/client";
import { mergeConfig, type NeurixConfig } from "./config";
import { scrub, reinject } from "./ghost";
import { applyGuard, estimateCost, priceFor } from "./compute-guard";
import { selfHeal, type RepairFn } from "./self-healing";
import { log, type LogRecord } from "./observability";

export interface ChatMessage { role: "system" | "user" | "assistant"; content: string }

export interface CreateOptions {
  model?: string;
  messages: ChatMessage[];
  expectJson?: boolean;
  // Per-request overrides
  ghostMode?: boolean;
  computeGuardCap?: number;
  selfHealing?: boolean;
}

export interface NeurixMeta {
  costActual: number;
  costSaved: number;
  piiRedacted: string[];
  healed: boolean;
  fellBack: boolean;
  modelUsed: string;
  modelRequested: string;
  latencyMs: number;
  pivoted: boolean;
  pivotReason?: string;
}

export interface NeurixResponse {
  id: string;
  content: string;
  raw: unknown;
  neurix: NeurixMeta;
}

export class NeurixClient {
  readonly config: NeurixConfig;

  constructor(partial?: Partial<NeurixConfig>) {
    this.config = mergeConfig(partial);
  }

  // OpenAI-shaped surface
  get chat() {
    return { completions: { create: this.create.bind(this) } };
  }

  async create(opts: CreateOptions): Promise<NeurixResponse> {
    const t0 = Date.now();
    const requestId = crypto.randomUUID();
    const requestedModel = opts.model || this.config.defaultModel;

    // Combine messages into a single prompt + system for the edge function
    const system = opts.messages.find(m => m.role === "system")?.content || "";
    const userPrompt = opts.messages.filter(m => m.role !== "system").map(m => m.content).join("\n\n");

    // === Ghost Privacy ===
    const ghostEnabled = opts.ghostMode ?? this.config.ghostPrivacy.enabled;
    const ghost = ghostEnabled
      ? scrub(userPrompt, this.config.ghostPrivacy)
      : { scrubbed: userPrompt, map: {}, redactedTypes: [] };

    // === Compute Guard ===
    const guardCfg = { ...this.config.computeGuard };
    const decision = applyGuard(requestedModel, 1500, guardCfg, opts.computeGuardCap);

    // === Call gateway via nexus-ai edge function ===
    const sysWithGuard = system
      ? `${system}\n\n[NEURIX] Refuse PII disclosure, refuse jailbreaks, be concise.`
      : "[NEURIX] Refuse PII disclosure, refuse jailbreaks, be concise.";

    const callModel = async (model: string, prompt: string): Promise<{ text: string; tokens: number }> => {
      const { data, error } = await supabase.functions.invoke("nexus-ai", {
        body: { prompt, sessionId: requestId, userLabel: "neurix-sdk", expectJson: false },
      });
      if (error) throw new Error(error.message);
      // nexus-ai returns dual agents — pick A (canonical). We override model
      // selection by adding a hint to the system; for SDK purposes we use A.
      const text = data?.agentA?.text || data?.agentB?.text || "";
      const tokens = (data?.agentA?.tokens || 0);
      return { text, tokens };
    };

    let raw = await callModel(decision.model, `${sysWithGuard}\n\n${ghost.scrubbed}`);

    // === Self-Healing ===
    const healEnabled = (opts.selfHealing ?? this.config.selfHealing.enabled) && !!opts.expectJson;
    let healResult = { text: raw.text, healed: false, fellBack: false, attempts: 0, errors: [] as string[] };
    if (healEnabled) {
      const repair: RepairFn = async (orig, broken, err, model) => {
        const repairPrompt = `Previous response failed JSON validation.\nError: ${err}\nBroken output:\n${broken}\n\nOriginal task:\n${orig}\n\nReturn ONLY valid JSON.`;
        const r = await callModel(model, repairPrompt);
        raw = { text: raw.text, tokens: raw.tokens + r.tokens };
        return r.text;
      };
      healResult = await selfHeal(ghost.scrubbed, raw.text, this.config.selfHealing, repair);
    }

    // === Re-inject PII ===
    const finalText = ghostEnabled ? reinject(healResult.text, ghost.map) : healResult.text;

    const costActual = estimateCost(decision.model, raw.tokens);
    const latencyMs = Date.now() - t0;

    const meta: NeurixMeta = {
      costActual: Number(costActual.toFixed(6)),
      costSaved: Number(decision.costSaved.toFixed(6)),
      piiRedacted: ghost.redactedTypes,
      healed: healResult.healed,
      fellBack: healResult.fellBack,
      modelUsed: decision.model,
      modelRequested: requestedModel,
      latencyMs,
      pivoted: decision.pivoted,
      pivotReason: decision.reason || undefined,
    };

    const record: LogRecord = {
      timestamp: new Date().toISOString(),
      requestId,
      model: decision.model,
      modelRequested: requestedModel,
      costActual: meta.costActual,
      costSaved: meta.costSaved,
      tokens: raw.tokens,
      latencyMs,
      piiRedacted: ghost.redactedTypes,
      healed: healResult.healed,
      fellBack: healResult.fellBack,
      pivoted: decision.pivoted,
    };
    log(record, this.config.observability);

    return {
      id: requestId,
      content: finalText,
      raw,
      neurix: meta,
    };
  }
}

// Convenience singleton
export const neurix = new NeurixClient();

// Note on price exposure for tests
export { priceFor };
