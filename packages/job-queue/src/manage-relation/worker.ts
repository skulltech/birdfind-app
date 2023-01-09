import { getTwitterClient, manageRelationJobColumns } from "@twips/common";
import { supabase } from "../utils";

const relations = ["follow", "mute", "block"] as const;
type Relation = typeof relations[number];

const chunkSize = 1;

export const manageRelation = async (jobId: number) => {
  // Get job from Supabase
  const { data: jobData } = await supabase
    .from("manage_relation_job")
    .select(manageRelationJobColumns)
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
    origin: "https://app.twips.xyz",
  });

  const targetIds: bigint[] = job.target_ids.map(BigInt);
  const targetIdsDone: bigint[] = job.target_ids_done.map(BigInt);
  const targetIdsToDo = targetIds
    .filter((x) => !targetIdsDone.includes(x))
    .slice(0, chunkSize);

  const relation = job.relation as Relation;
  // e.g. add-follow, remove-block, etc.
  const endpoint = `${job.add ? "add" : "remove"}-${job.relation}`;

  try {
    // Manage relation through Twitter SDK
    for (const targetId of targetIdsToDo)
      if (job.add) {
        if (relation == "follow")
          await twitter.users.usersIdFollow(userProfile.twitter_id, {
            target_user_id: targetId.toString(),
          });
        if (relation == "block")
          await twitter.users.usersIdBlock(userProfile.twitter_id, {
            target_user_id: targetId.toString(),
          });
        if (relation == "mute")
          await twitter.users.usersIdMute(userProfile.twitter_id, {
            target_user_id: targetId.toString(),
          });
      } else {
        if (relation == "follow")
          await twitter.users.usersIdUnfollow(
            userProfile.twitter_id,
            targetId.toString()
          );
        if (relation == "block")
          await twitter.users.usersIdUnblock(
            userProfile.twitter_id,
            targetId.toString()
          );
        if (relation == "mute")
          await twitter.users.usersIdUnmute(
            userProfile.twitter_id,
            targetId.toString()
          );
      }
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

  targetIdsDone.push(...targetIdsToDo);

  // Update relation tables
  const relationTable =
    relation == "follow"
      ? "twitter_follow"
      : relation == "block"
      ? "twitter_block"
      : relation == "mute"
      ? "twitter_mute"
      : null;
  if (job.add)
    await supabase
      .from(relationTable)
      .upsert(
        targetIdsToDo.map((x) => {
          return {
            source_id: userProfile.twitter_id,
            target_id: x,
          };
        })
      )
      .throwOnError();
  else
    await supabase
      .from(relationTable)
      .delete()
      .eq("source_id", userProfile.twitter_id)
      .in("target_id", targetIdsToDo)
      .throwOnError();

  // Update job
  await supabase
    .from("manage_relation_job")
    .update({
      priority: job.priority - chunkSize,
      target_ids_done: targetIdsDone,
    })
    .eq("id", jobId)
    .throwOnError();
};
