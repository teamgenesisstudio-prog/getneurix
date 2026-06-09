import { supabase } from "@/integrations/supabase/client";
import { storage, pushActivity } from "./storage";

export type V3Action = "firewall" | "regression" | "repair" | "redteam";

interface Point { ts: number; requests: number; failures: number; latencyMs: number }
interface LogRow { id: string; ts: number; request_id: string; model: string; status: string; latency: number; error_type: string; message: string }
interface Alert { id: string; severity: string; ts: string; rule: string; value: string }
interface Obs { points: Point[]; logs: LogRow[]; alerts: Alert[] }

function recordTelemetry(action: V3Action, ok: boolean, latencyMs: number, model: string, errorType: string, message: string) {
  const prev = storage.get<Obs>("nx_observability_data", { points: [], logs: [], alerts: [] });
  const now = Date.now();
  const log: LogRow = {
    id: crypto.randomUUID(), ts: now,
    request_id: "req_" + crypto.randomUUID().slice(0, 8),
    model, status: ok ? "success" : "error",
    latency: latencyMs, error_type: ok ? "" : errorType,
    message,
  };
  // Aggregate per-second point
  const last = prev.points[prev.points.length - 1];
  let points = prev.points;
  if (last && now - last.ts < 1000) {
    const merged: Point = {
      ts: last.ts,
      requests: last.requests + 1,
      failures: last.failures + (ok ? 0 : 1),
      latencyMs: Math.round((last.latencyMs + latencyMs) / 2),
    };
    points = [...prev.points.slice(0, -1), merged];
  } else {
    points = [...prev.points, { ts: now, requests: 1, failures: ok ? 0 : 1, latencyMs }].slice(-120);
  }
  storage.set("nx_observability_data", {
    points,
    logs: [log, ...prev.logs].slice(0, 200),
    alerts: prev.alerts,
  });
  if (!ok) pushActivity({ module: "observability", type: "request_failed", message: `${action} failed: ${errorType}`, severity: "error" });
}

export async function callV3<T = unknown>(action: V3Action, input: unknown): Promise<T> {
  const t0 = Date.now();
  try {
    const { data, error } = await supabase.functions.invoke("neurix-v3-pro", {
      body: { action, input },
    });
    const dt = Date.now() - t0;
    if (error) {
      recordTelemetry(action, false, dt, "google/gemini-2.5-flash", "invoke_error", error.message || "Invoke failed");
      throw new Error(error.message || "Request failed");
    }
    if (data?.error) {
      recordTelemetry(action, false, dt, data?.model || "google/gemini-2.5-flash", "gateway_error", data.error);
      throw new Error(data.error);
    }
    recordTelemetry(action, true, data?.elapsedMs ?? dt, data?.model || "google/gemini-2.5-flash", "", `${action} completed`);
    return data.result as T;
  } catch (e) {
    const dt = Date.now() - t0;
    recordTelemetry(action, false, dt, "google/gemini-2.5-flash", "exception", e instanceof Error ? e.message : "Unknown error");
    throw e;
  }
}
