import { manageListMembersJobColumns, getTwitterClient } from "@twips/common";
import { supabase } from "../utils";

const chunkSize = 1;

export const manageListMembers = async (jobId: number) => {
  // Get job from Supabase
  const { data: jobData } = await supabase
    .from("manage_list_members_job")
    .select(manageListMembersJobColumns.join(","))
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

  const memberIds: bigint[] = job.member_ids.map(BigInt);
  const memberIdsDone: bigint[] = job.member_ids_done.map(BigInt);
  const memberIdsToDo = memberIds
    .filter((x) => !memberIdsDone.includes(x))
    .slice(0, chunkSize);

  // add-list-member or remove-list-member
  const endpoint = `${job.add ? "add" : "remove"}-list-member`;

  try {
    for (const userId of memberIdsToDo)
      if (job.add)
        await twitter.lists.listAddMember(job.list_id, {
          user_id: userId.toString(),
        });
      else await twitter.lists.listRemoveMember(job.list_id, userId.toString());
  } catch (error) {
    // If rate-limited, delay the job
    if (error.status == 429) {
      await supabase
        .from("twitter_api_rate_limit")
        .insert({
          user_twitter_id: userProfile.twitter_id,
          endpoint,
          resets_at: new Date(
            Number(error.headers["x-rate-limit-reset"]) * 1000
          ),
        })
        .throwOnError();
      return;
    } else throw error;
  }

  // Delete rate limit
  await supabase
    .from("twitter_api_rate_limit")
    .update({ deleted: true })
    .eq("endpoint", endpoint)
    .eq("user_twitter_id", userProfile.twitter_id)
    .throwOnError();

  memberIdsDone.push(...memberIdsToDo);

  // Update list member table
  if (job.add)
    await supabase
      .from("twitter_list_member")
      .upsert(
        memberIdsToDo.map((x) => {
          return {
            list_id: job.list_id,
            member_id: x,
          };
        })
      )
      .throwOnError();
  else
    await supabase
      .from("twitter_list_member")
      .delete()
      .eq("list_id", job.list_id)
      .in("member_id", memberIdsToDo)
      .throwOnError();

  // Update job
  await supabase
    .from("manage_list_members_job")
    .update({
      priority: job.priority - chunkSize,
      member_ids_done: memberIdsDone,
    })
    .eq("id", jobId)
    .throwOnError();
};
