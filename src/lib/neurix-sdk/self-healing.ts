// Self-Healing Loop — schema validation + one-shot repair + safe fallback
import type { SelfHealingConfig } from "./config";

export interface ParseResult { ok: boolean; value?: unknown; error?: string }

export function tryParseJson(text: string): ParseResult {
  try {
    const m = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (!m) return { ok: false, error: "No JSON object/array found" };
    return { ok: true, value: JSON.parse(m[0]) };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

export type RepairFn = (originalPrompt: string, broken: string, parseError: string, model: string) => Promise<string>;

export interface HealResult {
  text: string;
  healed: boolean;
  attempts: number;
  fellBack: boolean;
  errors: string[];
}

export async function selfHeal(
  originalPrompt: string,
  raw: string,
  cfg: SelfHealingConfig,
  repair: RepairFn,
): Promise<HealResult> {
  if (!cfg.enabled) return { text: raw, healed: false, attempts: 0, fellBack: false, errors: [] };
  const first = tryParseJson(raw);
  if (first.ok) return { text: raw, healed: false, attempts: 0, fellBack: false, errors: [] };

  const errors: string[] = [first.error || "parse fail"];
  let current = raw;
  for (let i = 0; i < cfg.maxRetries; i++) {
    try {
      const repaired = await repair(originalPrompt, current, errors[errors.length - 1], cfg.repairModel);
      const parsed = tryParseJson(repaired);
      if (parsed.ok) {
        return { text: repaired, healed: true, attempts: i + 1, fellBack: false, errors };
      }
      errors.push(parsed.error || "parse fail");
      current = repaired;
    } catch (e: any) {
      errors.push(e.message);
    }
  }
  return {
    text: JSON.stringify({ error: cfg.fallbackResponse, fallback: true }),
    healed: false,
    attempts: cfg.maxRetries,
    fellBack: true,
    errors,
  };
}
