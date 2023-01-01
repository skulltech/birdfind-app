import { manageListMembersJobColumns } from "@twips/common";
import ms from "ms";
import { formatDate, supabase } from "../utils";

// Get log metadata object
export const createAddListMembersJobEventMetadata = async (jobId: number) => {
  // Get job details
  const { data: jobData } = await supabase
    .from("manage_list_members_job")
    .select(manageListMembersJobColumns.join(","))
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

  // Get list name
  const { data: list } = await supabase
    .from("twitter_list")
    .select("name")
    .eq("id", job.list_id)
    .throwOnError()
    .single();

  // Get rate limit information
  const { data: rateLimit } = await supabase
    .from("twitter_api_rate_limit")
    .select("resets_at")
    .eq("endpoint", "add-list-member")
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
    list: {
      id: job.list_id,
      name: list.name,
    },
    rate_limit_resets_at: rateLimit ? formatDate(rateLimit.resets_at) : null,
    created_at: formatDate(job.created_at),
    updated_at: formatDate(job.updated_at),
    time_elapsed: ms(
      new Date(job.updated_at).getTime() - new Date(job.created_at).getTime()
    ),
    members_to_do: job.member_ids_text.length,
    member_done: job.member_ids_done_text.length,
    priority: job.priority,
  };
};
