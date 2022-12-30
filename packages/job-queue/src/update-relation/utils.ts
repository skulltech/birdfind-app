import ms from "ms";
import { updateRelationJobColumns } from "@twips/common";
import { supabase } from "../utils";

export const dedupeUsers = <T extends { id: string }>(arr: T[]) => {
  const dedupedUsers = new Set<string>();

  return arr.filter((x) => {
    if (dedupedUsers.has(x.id)) return false;
    dedupedUsers.add(x.id);
    return true;
  });
};

const formatDate = (str: string) => new Date(str).toLocaleString("en-IN");

// Get log metadata object
export const getLog = async (jobId: number) => {
  // Get job details
  const { data: jobData, error: getJobError } = await supabase
    .from("update_relation_job")
    .select(updateRelationJobColumns.join(","))
    .eq("id", jobId)
    .single();
  if (getJobError) throw getJobError;
  const job = jobData as any;

  // Get user details
  const { data: userDetailsData, error: getUserDetailsError } = await supabase
    .rpc("get_user_details", {
      id: job.user_id,
    })
    .select("email,twitter_username,twitter_id::text")
    .single();
  if (getUserDetailsError) throw getUserDetailsError;
  const userDetails = userDetailsData as any;

  // Get target Twitter username
  const { data: targetDetails, error: getTwitterProfileError } = await supabase
    .from("twitter_profile")
    .select("username")
    .eq("id", job.target_twitter_id)
    .single();
  if (getTwitterProfileError) throw getTwitterProfileError;

  // Get rate limit information
  const { data: rateLimit, error: getRateLimitError } = await supabase
    .from("twitter_api_rate_limit")
    .select("resets_at")
    .eq("endpoint", "get-" + job.relation)
    .eq("user_twitter_id", userDetails.twitter_id)
    .maybeSingle();
  if (getRateLimitError) throw getRateLimitError;

  // Return log metadata object
  return {
    id: job.id,
    user: {
      user_id: job.user_id,
      email: userDetails.email,
      twitter_username: "@" + userDetails.twitter_username,
    },
    target: {
      twitter_username: "@" + targetDetails.username,
      twitter_id: job.target_twitter_id,
    },
    relation: job.relation,
    rate_limit_resets_at: rateLimit ? formatDate(rateLimit.resets_at) : null,
    created_at: formatDate(job.created_at),
    updated_at: formatDate(job.updated_at),
    time_elapsed: ms(
      new Date(job.updated_at).getTime() - new Date(job.created_at).getTime()
    ),
    updated_count: job.updated_count,
    pagination_token: job.pagination_token,
    priority: job.priority,
  };
};
