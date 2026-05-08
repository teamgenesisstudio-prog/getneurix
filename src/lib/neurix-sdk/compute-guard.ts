// Compute Guard — per-request cost cap + auto-pivot
import type { ComputeGuardConfig } from "./config";

export const PRICE_PER_1K: Record<string, number> = {
  "openai/gpt-5": 0.005,
  "openai/gpt-5-mini": 0.0006,
  "openai/gpt-5-nano": 0.00015,
  "google/gemini-2.5-pro": 0.0035,
  "google/gemini-2.5-flash": 0.0004,
  "google/gemini-2.5-flash-lite": 0.0001,
};

export function priceFor(model: string): number {
  return PRICE_PER_1K[model] ?? 0.0005;
}

export function estimateCost(model: string, tokens: number): number {
  return (tokens / 1000) * priceFor(model);
}

export interface GuardDecision {
  model: string;
  pivoted: boolean;
  reason: string;
  projectedCost: number;
  costSaved: number;
}

export function applyGuard(
  requestedModel: string,
  estimatedTokens: number,
  cfg: ComputeGuardConfig,
  capOverride?: number,
): GuardDecision {
  const cap = capOverride ?? cfg.defaultCapUsd;
  const projected = estimateCost(requestedModel, estimatedTokens);
  if (!cfg.enabled || projected <= cap * cfg.escalationThreshold) {
    return { model: requestedModel, pivoted: false, reason: "", projectedCost: projected, costSaved: 0 };
  }
  const pivot = cfg.autoPivot.find(p => p.from === requestedModel);
  if (!pivot) {
    return { model: requestedModel, pivoted: false, reason: `No pivot defined for ${requestedModel}`, projectedCost: projected, costSaved: 0 };
  }
  const newProjected = estimateCost(pivot.to, estimatedTokens);
  return {
    model: pivot.to,
    pivoted: true,
    reason: `Projected $${projected.toFixed(5)} > ${(cfg.escalationThreshold * 100).toFixed(0)}% of cap $${cap}`,
    projectedCost: newProjected,
    costSaved: projected - newProjected,
  };
}
