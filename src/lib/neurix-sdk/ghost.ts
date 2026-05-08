// Ghost Privacy Mode — local PII tokenization with re-injection
import type { GhostPrivacyConfig } from "./config";

const BUILTIN: Record<string, RegExp> = {
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
  phone: /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
  credit_card: /\b(?:\d[ -]*?){13,16}\b/g,
  api_key: /\bsk-[A-Za-z0-9_-]{20,}\b/g,
  jwt: /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g,
  ip_address: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
  aws_key: /\bAKIA[0-9A-Z]{16}\b/g,
};

export interface GhostResult {
  scrubbed: string;
  map: Record<string, string>;
  redactedTypes: string[];
}

export function scrub(text: string, cfg: GhostPrivacyConfig): GhostResult {
  if (!cfg.enabled) return { scrubbed: text, map: {}, redactedTypes: [] };
  const map: Record<string, string> = {};
  const types = new Set<string>();
  let out = text;
  let n = 0;

  const apply = (name: string, re: RegExp, prefix: string) => {
    out = out.replace(re, (m) => {
      n++;
      const token = `{{${prefix}_${n}}}`;
      map[token] = preserveDomain(m, name, cfg);
      types.add(name);
      return token;
    });
  };

  for (const t of cfg.piiTypes) {
    const re = BUILTIN[t];
    if (re) apply(t, new RegExp(re.source, re.flags), t.toUpperCase());
  }
  for (const cp of cfg.customPatterns || []) {
    apply(cp.name, new RegExp(cp.regex, "g"), cp.tokenPrefix);
  }
  return { scrubbed: out, map, redactedTypes: [...types] };
}

function preserveDomain(value: string, type: string, cfg: GhostPrivacyConfig): string {
  if (type === "email" && cfg.preserveDomain) {
    const [local, domain] = value.split("@");
    return `${(cfg.maskChar || "*").repeat(local.length)}@${domain}`;
  }
  return value;
}

export function reinject(text: string, map: Record<string, string>): string {
  let out = text;
  for (const [token, original] of Object.entries(map)) {
    out = out.split(token).join(original);
  }
  return out;
}
