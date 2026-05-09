import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Fire-and-forget capture: if the user has a 'collecting' dataset for this
 * source model, append the prompt/response pair to it.
 */
export async function captureIfNeeded(
  userId: string,
  sourceModel: string,
  prompt: string,
  response: string,
  systemPrompt?: string,
): Promise<void> {
  try {
    const { data: dataset } = await supabase
      .from("distillation_datasets")
      .select("id, pair_count, name, auto_capture")
      .eq("user_id", userId)
      .eq("source_model", sourceModel)
      .eq("status", "collecting")
      .eq("auto_capture", true)
      .maybeSingle();

    if (!dataset) return;

    const ti = Math.ceil((systemPrompt?.length ?? 0 + prompt.length) / 4);
    const to = Math.ceil(response.length / 4);
    const quality =
      prompt.length > 20 && response.length > 20 && response.length > prompt.length * 0.3
        ? 1.0
        : 0.5;

    await supabase.from("distillation_pairs").insert({
      dataset_id: dataset.id,
      prompt,
      response,
      system_prompt: systemPrompt,
      token_count_input: ti,
      token_count_output: to,
      quality_score: quality,
    });

    const newCount = (dataset.pair_count ?? 0) + 1;
    const updates: any = { pair_count: newCount, updated_at: new Date().toISOString() };
    if (newCount >= 100) {
      updates.status = "ready";
      toast.success(`Dataset "${dataset.name}" reached 100 pairs — ready for fine-tuning.`);
    }
    await supabase.from("distillation_datasets").update(updates).eq("id", dataset.id);
  } catch (e) {
    console.warn("[distillation-capture] failed", e);
  }
}
