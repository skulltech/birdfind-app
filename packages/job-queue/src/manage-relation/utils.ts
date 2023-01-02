import ms from "ms";
import { manageRelationJobColumns } from "@twips/common";
import { formatDate, supabase } from "../utils";

// Get log metadata object
export const createManageRelationJobEventMetadata = async (jobId: number) => {
  // Get job details
  const { data: jobData } = await supabase
    .from("manage_relation_job")
    .select(manageRelationJobColumns)
    .eq("id", jobId)
    .throwOnError()
    .single();
  const job = jobData as any;

  // Get user details
  const { data: userDetailsData } = await supabase
    .rpc("get_user_details", {
      id: job.user_id,
    })
    .select("email,twitter_username,twitter_id::text")
    .throwOnError()
    .single();
  const userDetails = userDetailsData as any;

  // Get rate limit information
  const { data: rateLimit } = await supabase
    .from("twitter_api_rate_limit")
    .select("resets_at")
    .eq("endpoint", `${job.add ? "add" : "remove"}-${job.relation}`)
    .eq("user_twitter_id", userDetails.twitter_id)
    .throwOnError()
    .maybeSingle();

  // Return log metadata object
  return {
    id: job.id,
    user: {
      user_id: job.user_id,
      email: userDetails.email,
      twitter_username: "@" + userDetails.twitter_username,
    },
    relation: job.relation,
    rate_limit_resets_at: rateLimit ? formatDate(rateLimit.resets_at) : null,
    created_at: formatDate(job.created_at),
    updated_at: formatDate(job.updated_at),
    time_elapsed: ms(
      new Date(job.updated_at).getTime() - new Date(job.created_at).getTime()
    ),
    targets_to_do: job.target_ids.length,
    targets_done: job.target_ids_done.length,
    priority: job.priority,
  };
};
