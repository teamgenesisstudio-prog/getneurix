import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

const json = (body: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", ...extra },
  });

function formatPairs(pairs: any[], format: string): string {
  return pairs
    .map((p) => {
      if (format === "openai" || format === "together") {
        const messages: any[] = [];
        if (p.system_prompt) messages.push({ role: "system", content: p.system_prompt });
        messages.push({ role: "user", content: p.prompt });
        messages.push({ role: "assistant", content: p.response });
        return JSON.stringify({ messages });
      }
      if (format === "alpaca") {
        return JSON.stringify({
          instruction: p.system_prompt ?? "",
          input: p.prompt,
          output: p.response,
        });
      }
      if (format === "sharegpt") {
        return JSON.stringify({
          conversations: [
            { from: "human", value: p.prompt },
            { from: "gpt", value: p.response },
          ],
        });
      }
      return "";
    })
    .join("\n");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
  const auth = req.headers.get("Authorization") ?? "";
  const supabase = createClient(SUPABASE_URL, ANON, {
    global: { headers: { Authorization: auth } },
  });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return json({ error: "Unauthorized" }, 401);

  let body: any = {};
  try { body = await req.json(); } catch { /* empty */ }
  const action = body.action as string;

  try {
    switch (action) {
      // ---------- DATASETS ----------
      case "list_datasets": {
        const { data, error } = await supabase
          .from("distillation_datasets")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) throw error;
        return json({ datasets: data });
      }
      case "create_dataset": {
        const { name, description, source_model } = body;
        if (!name) return json({ error: "name required" }, 400);
        const { data, error } = await supabase
          .from("distillation_datasets")
          .insert({ user_id: user.id, name, description, source_model: source_model ?? "gpt-4o" })
          .select()
          .single();
        if (error) throw error;
        return json({ dataset: data });
      }
      case "delete_dataset": {
        const { id } = body;
        const { error } = await supabase.from("distillation_datasets").delete().eq("id", id);
        if (error) throw error;
        return json({ ok: true });
      }
      case "toggle_auto_capture": {
        const { id, auto_capture } = body;
        const { data, error } = await supabase
          .from("distillation_datasets")
          .update({ auto_capture })
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        return json({ dataset: data });
      }

      // ---------- PAIRS ----------
      case "list_pairs": {
        const { dataset_id, page = 1 } = body;
        const from = (page - 1) * 50;
        const to = from + 49;
        const { data, error } = await supabase
          .from("distillation_pairs")
          .select("*")
          .eq("dataset_id", dataset_id)
          .order("created_at", { ascending: false })
          .range(from, to);
        if (error) throw error;
        return json({ pairs: data });
      }
      case "create_pair": {
        const { dataset_id, prompt, response, system_prompt, category,
          token_count_input, token_count_output } = body;
        if (!dataset_id || !prompt || !response)
          return json({ error: "dataset_id, prompt, response required" }, 400);
        const quality =
          prompt.length > 20 && response.length > 20 && response.length > prompt.length * 0.3
            ? 1.0 : 0.5;
        const { data, error } = await supabase
          .from("distillation_pairs")
          .insert({
            dataset_id, prompt, response, system_prompt, category,
            token_count_input, token_count_output, quality_score: quality,
          })
          .select()
          .single();
        if (error) throw error;
        // increment count
        const { data: ds } = await supabase
          .from("distillation_datasets").select("pair_count").eq("id", dataset_id).single();
        await supabase.from("distillation_datasets").update({
          pair_count: (ds?.pair_count ?? 0) + 1,
          updated_at: new Date().toISOString(),
        }).eq("id", dataset_id);
        return json({ pair: data });
      }

      // ---------- EXPORT ----------
      case "export": {
        const { dataset_id, format, min_quality_score = 0, categories } = body;
        let q = supabase.from("distillation_pairs").select("*").eq("dataset_id", dataset_id);
        if (min_quality_score) q = q.gte("quality_score", min_quality_score);
        if (categories?.length) q = q.in("category", categories);
        const { data, error } = await q;
        if (error) throw error;
        const text = formatPairs(data ?? [], format);
        const ext = format === "alpaca" || format === "sharegpt" ? "json" : "jsonl";
        return new Response(text, {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/x-ndjson",
            "Content-Disposition": `attachment; filename="dataset-${dataset_id}.${format}.${ext}"`,
          },
        });
      }

      // ---------- JOBS ----------
      case "list_jobs": {
        const { data, error } = await supabase
          .from("distillation_jobs")
          .select("*, distillation_datasets!inner(name)")
          .order("created_at", { ascending: false });
        if (error) throw error;
        return json({ jobs: data });
      }
      case "create_job": {
        const { dataset_id, provider, base_model, epochs = 3,
          learning_rate_multiplier = 1.0, custom_endpoint } = body;
        if (!dataset_id || !provider || !base_model)
          return json({ error: "dataset_id, provider, base_model required" }, 400);
        const { data, error } = await supabase
          .from("distillation_jobs")
          .insert({
            dataset_id, user_id: user.id, provider, base_model,
            epochs, learning_rate_multiplier,
            fine_tuned_endpoint: custom_endpoint,
            status: "pending",
            started_at: new Date().toISOString(),
          })
          .select()
          .single();
        if (error) throw error;
        // mark dataset as fine_tuning
        await supabase.from("distillation_datasets")
          .update({ status: "fine_tuning" }).eq("id", dataset_id);
        return json({ job: data });
      }
      case "check_job_status": {
        const { job_id } = body;
        const { data: job, error } = await supabase
          .from("distillation_jobs").select("*").eq("id", job_id).single();
        if (error) throw error;

        // Simulated provider polling — real OpenAI/Together calls would go here.
        let newStatus = job.status as string;
        let modelId = job.fine_tuned_model_id as string | null;
        let cost = job.training_cost_usd as number | null;
        let completedAt: string | null = job.completed_at;

        const startedMs = job.started_at ? new Date(job.started_at).getTime() : Date.now();
        const elapsed = Date.now() - startedMs;
        if (job.status === "pending" && elapsed > 2_000) newStatus = "queued";
        if (elapsed > 6_000) newStatus = "training";
        if (elapsed > 12_000) {
          newStatus = "completed";
          modelId = job.provider === "openai"
            ? `ft:${job.base_model}:neurix:${job.id.slice(0, 6)}`
            : `${job.base_model}-ft-${job.id.slice(0, 6)}`;
          cost = +(0.30 + Math.random() * 1.7).toFixed(2);
          completedAt = new Date().toISOString();
        }

        const { data: updated } = await supabase.from("distillation_jobs").update({
          status: newStatus,
          fine_tuned_model_id: modelId,
          training_cost_usd: cost,
          completed_at: completedAt,
        }).eq("id", job_id).select().single();

        if (newStatus === "completed") {
          await supabase.from("distillation_datasets")
            .update({ status: "completed", target_model: modelId })
            .eq("id", job.dataset_id);
        }
        return json({ job: updated });
      }

      // ---------- ROUTES ----------
      case "list_routes": {
        const { data, error } = await supabase
          .from("distillation_routes")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) throw error;
        return json({ routes: data });
      }
      case "create_route": {
        const { source_model, distilled_model, distilled_endpoint, provider,
          confidence_threshold = 0.85 } = body;
        const { data, error } = await supabase
          .from("distillation_routes")
          .insert({
            user_id: user.id, source_model, distilled_model,
            distilled_endpoint, provider, confidence_threshold,
          })
          .select()
          .single();
        if (error) throw error;
        return json({ route: data });
      }
      case "update_route": {
        const { route_id, active, confidence_threshold } = body;
        const updates: any = {};
        if (active !== undefined) updates.active = active;
        if (confidence_threshold !== undefined) updates.confidence_threshold = confidence_threshold;
        const { data, error } = await supabase
          .from("distillation_routes").update(updates).eq("id", route_id).select().single();
        if (error) throw error;
        return json({ route: data });
      }
      case "delete_route": {
        const { id } = body;
        const { error } = await supabase.from("distillation_routes").delete().eq("id", id);
        if (error) throw error;
        return json({ ok: true });
      }

      default:
        return json({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (e: any) {
    console.error("[distillation]", e);
    return json({ error: e.message ?? "Server error" }, 500);
  }
});
