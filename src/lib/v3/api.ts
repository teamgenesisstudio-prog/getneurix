import { supabase } from "@/integrations/supabase/client";

export type V3Action = "firewall" | "regression" | "repair" | "redteam";

export async function callV3<T = unknown>(action: V3Action, input: unknown): Promise<T> {
  const { data, error } = await supabase.functions.invoke("neurix-v3-pro", {
    body: { action, input },
  });
  if (error) throw new Error(error.message || "Request failed");
  if (data?.error) throw new Error(data.error);
  return data.result as T;
}
