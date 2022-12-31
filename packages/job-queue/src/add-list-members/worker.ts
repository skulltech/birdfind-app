import { addListMembersJobColumns, getTwitterClient } from "@twips/common";
import { supabase } from "../utils";

const chunkSize = 3;

export const addListMembers = async (jobId: number) => {
  // Get job from Supabase
  const { data: jobData } = await supabase
    .from("add_list_members_job")
    .select(addListMembersJobColumns.join(","))
    .eq("id", jobId)
    .throwOnError()
    .single();
  const job = jobData as any;

  // Return immediately if job is finished
  if (job.finished) return;

  // Get twitter client of user
  const { data: userProfileData } = await supabase
    .from("user_profile")
    .select("twitter_id::text,twitter_oauth_token")
    .eq("id", job.user_id)
    .throwOnError()
    .single();
  const userProfile = userProfileData as any;

  const twitter = await getTwitterClient({
    clientId: process.env.TWITTER_CLIENT_ID,
    clientSecret: process.env.TWITTER_CLIENT_SECRET,
    supabase,
    userId: job.user_id,
    oauthToken: userProfile.twitter_oauth_token,
  });

  const memberIds: bigint[] = job.member_ids_text.map(BigInt);
  const memberIdsAdded: bigint[] = job.member_ids_added_text.map(BigInt);
  const membersToAdd = memberIds
    .filter((x) => !memberIdsAdded.includes(x))
    .slice(0, chunkSize);

  try {
    for (const userId of membersToAdd)
      await twitter.lists.listAddMember(job.list_id, {
        user_id: userId.toString(),
      });
  } catch (error) {
    // If rate-limited, delay the job
    if (error.status == 429) {
      const rateLimitResetsAt = new Date(
        Number(error.headers["x-rate-limit-reset"]) * 1000
      );
      await supabase
        .from("twitter_api_rate_limit")
        .upsert({
          user_twitter_id: userProfile.twitter_id,
          endpoint: "add-list-member",
          resets_at: rateLimitResetsAt.toISOString(),
        })
        .throwOnError();
      return;
    } else throw error;
  }

  // Delete rate limit
  await supabase
    .from("twitter_api_rate_limit")
    .delete()
    .eq("endpoint", "add-list-member")
    .eq("user_twitter_id", userProfile.twitter_id)
    .throwOnError();

  memberIdsAdded.push(...membersToAdd);

  // Update job
  await supabase
    .from("add_list_members_job")
    .update({
      priority: job.priority - chunkSize,
      updated_at: new Date().toISOString(),
      member_ids_added: memberIdsAdded,
    })
    .eq("id", jobId)
    .throwOnError();
};
