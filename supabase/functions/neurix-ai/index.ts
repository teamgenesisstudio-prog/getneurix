import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { action, data, model } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Map user-facing model names to actual gateway models
    const modelMap: Record<string, string> = {
      "gpt-4o": "openai/gpt-5-mini",
      "claude-3.5": "google/gemini-2.5-pro",
      "gemini": "google/gemini-3-flash-preview",
    };
    const selectedModel = modelMap[model] || "google/gemini-3-flash-preview";

    let systemPrompt = "";
    let userPrompt = "";

    switch (action) {
      case "stress-test":
        systemPrompt = `You are NEURIX, an AI model stress-testing engine. Analyze the uploaded data and provide a comprehensive stress test report. Return JSON with this exact structure:
{
  "score": <number 0-100 reliability score>,
  "failures": [{"type": "critical"|"warning"|"info", "title": "<SHORT TITLE>", "description": "<detailed description>", "impact": "<dollar amount per month>", "fix": "<specific fix suggestion>"}],
  "moneySaved": <number estimated savings>,
  "summary": "<2 sentence summary>",
  "edgeCasesFound": <number>,
  "confidenceScore": <number 0-100>
}
Be specific and technical. Each failure should have a real dollar impact estimate.`;
        userPrompt = `Stress test this data:\n\nFile: ${data.fileName}\nSample data (first 500 chars): ${data.sampleData?.substring(0, 500) || "No data provided"}\nRows: ${data.rowCount || "unknown"}\nColumns: ${data.columns?.join(", ") || "unknown"}`;
        break;

      case "auto-label":
        systemPrompt = `You are NEURIX auto-labeling engine. Analyze the data and provide labels with confidence scores. Return JSON:
{
  "labels": [{"row": <index>, "label": "<label>", "confidence": <0-100>, "reasoning": "<why this label>"}],
  "autoLabeled": <count of high confidence labels>,
  "needsReview": <count of low confidence labels>,
  "summary": "<summary>"
}`;
        userPrompt = `Auto-label this data:\n${data.sampleData?.substring(0, 1000) || "No data"}`;
        break;

      case "adversarial":
        systemPrompt = `You are NEURIX adversarial simulator. You are an AI red-teamer testing model security. Return JSON:
{
  "attacks": [{"name": "<attack name>", "success": <boolean>, "severity": "high"|"medium"|"low", "description": "<what happened>", "mitigation": "<how to fix>"}],
  "overallRisk": "critical"|"high"|"medium"|"low",
  "summary": "<summary>"
}
Simulate 5 different attack types: prompt injection, data poisoning, model inversion, evasion, membership inference.`;
        userPrompt = `Run adversarial attacks against a model trained on: ${data.context || "general classification data"}`;
        break;

      case "explain-failure":
        systemPrompt = `You are NEURIX explainable AI engine. Explain in plain English why an AI model failed. Be specific, actionable, and include dollar impact estimates. Return JSON:
{
  "explanation": "<plain English explanation>",
  "rootCause": "<technical root cause>",
  "impact": "<dollar impact>",
  "fix": "<step by step fix>",
  "confidence": <0-100>
}`;
        userPrompt = `Explain this failure:\n${data.failure || "Model accuracy dropped 15% on edge cases"}`;
        break;

      case "synthetic-data":
        systemPrompt = `You are NEURIX synthetic data generator. Generate realistic synthetic training examples to fill data gaps. Return JSON:
{
  "samples": [{"data": "<synthetic example>", "label": "<label>", "quality": <0-100>}],
  "totalGenerated": <number>,
  "qualityScore": <average quality>,
  "summary": "<summary>"
}
Generate 5 high-quality examples.`;
        userPrompt = `Generate synthetic data to fill this gap: ${data.gap || "Need more edge case examples for rare categories"}`;
        break;

      case "conflict-resolve":
        systemPrompt = `You are NEURIX AI Judge for conflict resolution. Two labelers disagree on a label. Analyze both sides and resolve. Return JSON:
{
  "resolution": "<the correct label>",
  "confidence": <0-100>,
  "reasoning": "<why this is correct>",
  "needsHuman": <boolean - true if confidence < 90>
}`;
        userPrompt = `Resolve this labeling conflict:\nLabel A: ${data.labelA || "positive"}\nLabel B: ${data.labelB || "negative"}\nContext: ${data.context || "sentiment analysis of customer review"}`;
        break;

      case "distill":
        systemPrompt = `You are NEURIX dataset distillation engine. Analyze data redundancy and recommend what to keep. Return JSON:
{
  "totalRows": <number>,
  "redundantRows": <number>,
  "essentialRows": <number>,
  "savings": "<dollar savings>",
  "recommendation": "<what to do>",
  "edgeCasesPreserved": <number>
}`;
        userPrompt = `Analyze this dataset for redundancy: ${data.datasetInfo || "1M rows of classification data"}`;
        break;

      case "clarify":
        systemPrompt = `You are NEURIX clarification AI. The user input is ambiguous. Generate clarifying options. Return JSON:
{
  "interpretation": "<what you think they meant>",
  "options": [{"label": "A", "text": "<option A>"}, {"label": "B", "text": "<option B>"}, {"label": "C", "text": "<option C>"}, {"label": "D", "text": "Something else"}],
  "confidence": <0-100 how sure you are of the top interpretation>
}`;
        userPrompt = `The user typed: "${data.input || ""}". Generate clarifying questions in the context of AI model testing and data labeling.`;
        break;

      default:
        systemPrompt = "You are NEURIX AI assistant. Help with AI model testing and data labeling.";
        userPrompt = data.message || "Hello";
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error(`AI error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || "";

    // Try to parse JSON from response
    let parsed = null;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      }
    } catch {
      // If JSON parsing fails, return raw content
    }

    return new Response(JSON.stringify({
      result: parsed || content,
      model: model || "gemini",
      raw: content,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("neurix-ai error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
