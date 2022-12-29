import { SupabaseClient } from "@supabase/supabase-js";
import { Relation } from "./core";

type AddUpdateRelationJob = {
  supabase: SupabaseClient;
  userId: string;
  targetTwitterId: BigInt;
  relation: Relation;
  priority: number;
};

export const addUpdateRelationJob = async ({
  supabase,
  userId,
  targetTwitterId,
  relation,
  priority,
}: AddUpdateRelationJob) => {
  // Get running job with same parameters
  const { data, error: getJobError } = await supabase
    .from("update_relation_job")
    .select("id,priority")
    .eq("user_id", userId)
    .eq("target_twitter_id", targetTwitterId)
    .eq("relation", relation)
    .eq("finished", false)
    .maybeSingle();

  // If exists, then resume and upgrade priority if needed
  if (data) {
    const { error: updateJobError } = await supabase
      .from("update_relation_job")
      .update({
        priority: priority > data.priority ? priority : data.priority,
        paused: false,
      })
      .eq("id", data.id);
    if (updateJobError) throw updateJobError;
    // If doesn't exist then add
  } else {
    const { error: insertJobError } = await supabase
      .from("update_relation_job")
      .insert({
        user_id: userId,
        target_twitter_id: targetTwitterId,
        relation,
        priority,
      });
    if (insertJobError) throw insertJobError;
  }
};
