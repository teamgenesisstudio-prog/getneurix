import { supabase } from "@/integrations/supabase/client";

export type AIModel = "gpt-4o" | "claude-3.5" | "gemini";
export type AIAction = "stress-test" | "auto-label" | "adversarial" | "explain-failure" | "synthetic-data" | "conflict-resolve" | "distill" | "clarify";

export interface AIRequest {
  action: AIAction;
  data: Record<string, unknown>;
  model?: AIModel;
}

export async function callNeurixAI(request: AIRequest) {
  const { data, error } = await supabase.functions.invoke("neurix-ai", {
    body: {
      action: request.action,
      data: request.data,
      model: request.model || "gemini",
    },
  });

  if (error) throw new Error(error.message || "AI request failed");
  if (data?.error) throw new Error(data.error);
  return data;
}

export function parseCSV(text: string): { headers: string[]; rows: string[][]; rowCount: number } {
  const lines = text.trim().split("\n");
  const headers = lines[0]?.split(",").map(h => h.trim()) || [];
  const rows = lines.slice(1).map(l => l.split(",").map(c => c.trim()));
  return { headers, rows, rowCount: rows.length };
}

export function maskPII(text: string): string {
  return text
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, "[REDACTED_EMAIL]")
    .replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, "[REDACTED_PHONE]")
    .replace(/\b\d{3}-\d{2}-\d{4}\b/g, "[REDACTED_SSN]")
    .replace(/\b\d{1,5}\s\w+\s(Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd)\b/gi, "[REDACTED_ADDRESS]");
}
