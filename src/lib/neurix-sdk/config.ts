// Neurix SDK config — TS port of the YAML spec
export interface CustomPattern { name: string; regex: string; tokenPrefix: string }

export interface GhostPrivacyConfig {
  enabled: boolean;
  piiTypes: string[];
  customPatterns?: CustomPattern[];
  maskChar?: string;
  preserveDomain?: boolean;
}

export interface SelfHealingConfig {
  enabled: boolean;
  maxRetries: number;
  repairModel: string;
  fallbackResponse: string;
  logFailures: boolean;
}

export interface PivotPair { from: string; to: string }
export interface ComputeGuardConfig {
  enabled: boolean;
  defaultCapUsd: number;
  autoPivot: PivotPair[];
  escalationThreshold: number; // 0-1
}

export interface ObservabilityConfig {
  logLevel: "DEBUG" | "INFO" | "WARN" | "ERROR";
  exportJsonl: boolean;
  exportPrometheus: boolean;
}

export interface NeurixConfig {
  ghostPrivacy: GhostPrivacyConfig;
  selfHealing: SelfHealingConfig;
  computeGuard: ComputeGuardConfig;
  observability: ObservabilityConfig;
  defaultModel: string;
}

export const DEFAULT_CONFIG: NeurixConfig = {
  ghostPrivacy: {
    enabled: true,
    piiTypes: ["email", "ssn", "phone", "credit_card", "api_key", "jwt", "ip_address"],
    customPatterns: [],
    maskChar: "*",
    preserveDomain: true,
  },
  selfHealing: {
    enabled: true,
    maxRetries: 1,
    repairModel: "google/gemini-2.5-flash-lite",
    fallbackResponse: "SCHEMA_BREAKDOWN",
    logFailures: true,
  },
  computeGuard: {
    enabled: true,
    defaultCapUsd: 0.05,
    autoPivot: [
      { from: "openai/gpt-5-mini", to: "openai/gpt-5-nano" },
      { from: "google/gemini-2.5-flash", to: "google/gemini-2.5-flash-lite" },
      { from: "openai/gpt-5", to: "openai/gpt-5-mini" },
    ],
    escalationThreshold: 0.8,
  },
  observability: {
    logLevel: "INFO",
    exportJsonl: true,
    exportPrometheus: false,
  },
  defaultModel: "google/gemini-2.5-flash",
};

export function mergeConfig(partial?: Partial<NeurixConfig>): NeurixConfig {
  if (!partial) return DEFAULT_CONFIG;
  return {
    ...DEFAULT_CONFIG,
    ...partial,
    ghostPrivacy: { ...DEFAULT_CONFIG.ghostPrivacy, ...(partial.ghostPrivacy || {}) },
    selfHealing: { ...DEFAULT_CONFIG.selfHealing, ...(partial.selfHealing || {}) },
    computeGuard: { ...DEFAULT_CONFIG.computeGuard, ...(partial.computeGuard || {}) },
    observability: { ...DEFAULT_CONFIG.observability, ...(partial.observability || {}) },
  };
}
