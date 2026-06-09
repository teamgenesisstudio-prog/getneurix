// V3 storage layer — wraps localStorage with seeded defaults.
// Exposed as window.storage for parity with the spec.

export type Json = unknown;

const PREFIX = "";
const KEYS = [
  "nx_firewall_history",
  "nx_regression_suites",
  "nx_repair_history",
  "nx_observability_data",
  "nx_redteam_history",
  "nx_api_keys",
  "nx_settings",
  "nx_activity_feed",
] as const;
export type StorageKey = (typeof KEYS)[number];

class Storage {
  get<T = Json>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      if (raw == null) return fallback;
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }
  set<T = Json>(key: string, value: T): void {
    try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); } catch { /* quota */ }
  }
  remove(key: string): void {
    try { localStorage.removeItem(PREFIX + key); } catch { /* */ }
  }
  exportAll(): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const k of KEYS) out[k] = this.get(k, null);
    return out;
  }
  clearAll(): void {
    for (const k of KEYS) this.remove(k);
  }
}

export const storage = new Storage();

// Attach to window for spec parity
if (typeof window !== "undefined") {
  (window as unknown as { storage: Storage }).storage = storage;
}

// ---------- seeders ----------
const now = Date.now();
const ago = (m: number) => new Date(now - m * 60_000).toISOString();
const rand = (a: number, b: number) => Math.floor(a + Math.random() * (b - a));

export interface ActivityEvent {
  id: string;
  module: "firewall" | "regression" | "repair" | "observability" | "redteam";
  type: string;
  message: string;
  severity?: "info" | "warn" | "error" | "success";
  timestamp: string;
}

export function pushActivity(ev: Omit<ActivityEvent, "id" | "timestamp">) {
  const feed = storage.get<ActivityEvent[]>("nx_activity_feed", []);
  const next: ActivityEvent[] = [
    { id: crypto.randomUUID(), timestamp: new Date().toISOString(), ...ev },
    ...feed,
  ].slice(0, 50);
  storage.set("nx_activity_feed", next);
}

// One-time wipe of legacy seeded demo data. Real user activity is preserved.
const WIPE_FLAG = "nx_seed_wiped_v2";
const SEEDED_KEYS: StorageKey[] = [
  "nx_firewall_history",
  "nx_regression_suites",
  "nx_repair_history",
  "nx_observability_data",
  "nx_redteam_history",
  "nx_api_keys",
  "nx_activity_feed",
];

export function seedIfEmpty() {
  // Default settings only — no fake content.
  if (!storage.get("nx_settings", null)) {
    storage.set("nx_settings", {
      theme: "dark",
      defaultModel: "google/gemini-2.5-flash",
      notifications: { email: true, browser: false, slack: false },
      retentionDays: 30,
    });
  }

  // Strip any previously seeded fake data exactly once per browser.
  try {
    if (!localStorage.getItem(WIPE_FLAG)) {
      for (const k of SEEDED_KEYS) storage.remove(k);
      localStorage.setItem(WIPE_FLAG, "1");
    }
  } catch { /* ignore */ }
}
