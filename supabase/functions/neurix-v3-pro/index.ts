// Neurix V3 Pro — backend for the V3 workspace.
// Actions: firewall | regression | repair | redteam
// Uses Lovable AI Gateway (LOVABLE_API_KEY). Returns strict JSON.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MODEL = "google/gemini-2.5-flash";

const SYSTEMS: Record<string, string> = {
  firewall: `You are an AI security analyst. Analyze the user's prompt for security threats. Return ONLY valid JSON, no prose, this exact schema:
{
  "threatScore": <int 0-100>,
  "riskLevel": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "SAFE",
  "threats": [{"type": "<string>", "description": "<string>", "severity": "CRITICAL"|"HIGH"|"MEDIUM"|"LOW", "confidence": <int 0-100>}],
  "recommendations": ["<string>"],
  "attackVectors": ["<string>"],
  "piiDetected": ["<string>"],
  "injectionPatterns": ["<string>"],
  "overallConfidence": <int 0-100>
}`,
  regression: `You are a prompt regression evaluator. The user gives JSON: {"prompt": string, "expectedPattern": string, "criteria": string}. Run the prompt mentally and judge whether the result would satisfy the criteria/pattern. Return ONLY valid JSON:
{
  "output": "<the simulated model output>",
  "passed": <boolean>,
  "score": <int 0-100>,
  "reason": "<one sentence>",
  "latencyMs": <int 200-3000>
}`,
  repair: `You are a self-healing output repair engine. The user gives JSON: {"input": string, "outputType": "JSON"|"Markdown"|"Structured Text"|"Code", "expectedSchema": string}. Repair the malformed output. Return ONLY valid JSON:
{
  "repairedOutput": "<the repaired text>",
  "errorsDetected": [{"type": "<string>", "location": "<string>", "description": "<string>"}],
  "fixesApplied": [{"fix": "<string>", "confidence": <int 0-100>}],
  "validationStatus": "VALID" | "PARTIAL" | "FAILED",
  "repairTime": <int ms>,
  "confidence": <int 0-100>
}`,
  redteam: `You are an automated red team security researcher for AI systems. The user gives JSON: {"target": string, "categories": string[], "intensity": "Passive"|"Active"|"Aggressive"}. Generate a realistic red team report for the described system. Include 6-12 findings spanning the requested categories. Return ONLY valid JSON:
{
  "securityScore": <int 0-100>,
  "totalAttacks": <int>,
  "successfulAttacks": <int>,
  "findings": [{
    "category": "<string>",
    "attack": "<short attack name>",
    "payload": "<the attack prompt, 1-2 sentences>",
    "result": "VULNERABLE" | "PARTIAL" | "RESISTANT",
    "severity": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
    "description": "<2 sentence finding>",
    "recommendation": "<concrete mitigation>"
  }],
  "attackSuccessRate": <int 0-100>,
  "riskSummary": "<2-3 sentence executive summary>",
  "immediateActions": ["<string>"]
}`,
};

function extractJSON(text: string): unknown {
  const cleaned = text.replace(/```json|```/g, "").trim();
  try { return JSON.parse(cleaned); } catch { /* */ }
  const start = cleaned.search(/[\{\[]/);
  if (start === -1) throw new Error("No JSON found");
  for (let end = cleaned.length; end > start + 1; end--) {
    try { return JSON.parse(cleaned.slice(start, end)); } catch { /* */ }
  }
  throw new Error("Failed to parse JSON");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { action, input } = await req.json();
    const system = SYSTEMS[action];
    if (!system) {
      return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const userContent = typeof input === "string" ? input : JSON.stringify(input ?? {}, null, 2);
    const t0 = Date.now();

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: system },
          { role: "user", content: userContent },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      if (res.status === 429) return new Response(JSON.stringify({ error: "Rate limited. Retry shortly." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (res.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await res.text();
      console.error("gateway", res.status, t);
      return new Response(JSON.stringify({ error: `Gateway ${res.status}` }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const json = await res.json();
    const content = json?.choices?.[0]?.message?.content ?? "";
    const parsed = extractJSON(content);
    return new Response(JSON.stringify({ result: parsed, elapsedMs: Date.now() - t0, model: MODEL }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("v3-pro", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
