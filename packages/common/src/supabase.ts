import { SupabaseClient } from "@supabase/supabase-js";

type AddLookupRelationJob = {
  supabase: SupabaseClient;
  userId: string;
  targetTwitterId: BigInt;
  relation: "followers" | "following" | "blocking" | "muting";
  priority: number;
};

export const addLookupRelationJob = async ({
  supabase,
  userId,
  targetTwitterId,
  relation,
  priority,
}: AddLookupRelationJob) => {
  // Get running job with same parameters
  const { data } = await supabase
    .from("lookup_relation_job")
    .select("id,priority")
    .eq("user_id", userId)
    .eq("target_id", targetTwitterId)
    .eq("relation", relation)
    .eq("finished", false)
    .throwOnError()
    .maybeSingle();

  // If exists, then resume and upgrade priority if needed
  if (data)
    await supabase
      .from("lookup_relation_job")
      .update({
        priority: priority > data.priority ? priority : data.priority,
        paused: false,
        deleted: false,
      })
      .eq("id", data.id)
      .throwOnError();
  // If doesn't exist then add
  else
    await supabase
      .from("lookup_relation_job")
      .insert({
        user_id: userId,
        target_id: targetTwitterId,
        relation,
        priority,
      })
      .throwOnError();
};
