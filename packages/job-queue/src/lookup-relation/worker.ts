import {
  getTwitterClient,
  serializeTwitterUser,
  twitterUserFields,
  lookupRelationJobColumns,
} from "@twips/common";
import { TwitterResponse, usersIdFollowing } from "twitter-api-sdk/dist/types";
import { supabase } from "../utils";
import { dedupeUsers } from "./utils";

const relations = ["followers", "following", "blocking", "muting"] as const;
type Relation = typeof relations[number];

export const lookupRelation = async (jobId: number) => {
  // Get job from Supabase
  const { data: jobData } = await supabase
    .from("lookup_relation_job")
    .select(lookupRelationJobColumns.join(","))
    .eq("id", jobId)
    .throwOnError()
    .single();
  const job = jobData as any;

  // Return immediately if job is finished
  if (job.finished) return;

  const relation = job.relation as Relation;
  const relationTable =
    relation == "followers" || relation == "following"
      ? "twitter_follow"
      : relation == "blocking"
      ? "twitter_block"
      : relation == "muting"
      ? "twitter_mute"
      : null;
  const endpoint = "lookup-" + relation;

  // If this is the first iteration, mark rows for delete
  if (job.updated_count === 0) {
    const { error } = await supabase
      .from(relationTable)
      .update({ to_delete: true })
      .eq(
        job.relation == "followers" ? "target_id" : "source_id",
        job.target_id
      );
    // TODO: Find a better way. Ref: https://www.postgresql.org/docs/current/sql-createpolicy.html
    if (error?.message && error.message.length != 0) throw error;
  }

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

  let users: TwitterResponse<usersIdFollowing>["data"];
  let paginationToken = job.pagination_token;

  try {
    const params = {
      max_results: 1000,
      "user.fields": twitterUserFields,
      pagination_token: paginationToken,
    };
    const page: any =
      relation == "followers"
        ? await twitter.users.usersIdFollowers(job.target_id, params)
        : relation == "following"
        ? await twitter.users.usersIdFollowing(job.target_id, params)
        : relation == "blocking"
        ? await twitter.users.usersIdBlocking(job.target_id, params)
        : relation == "muting"
        ? await twitter.users.usersIdMuting(job.target_id, params)
        : null;

    users = page.data ?? [];
    paginationToken = page.meta.next_token ?? null;
  } catch (error) {
    // If rate-limited, delay the job
    if (error.status == 429) {
      await supabase
        .from("twitter_api_rate_limit")
        .upsert({
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
    .delete()
    .eq("endpoint", endpoint)
    .eq("user_twitter_id", userProfile.twitter_id)
    .throwOnError();

  // Remove duplicates
  users = dedupeUsers(users);

  // Upsert users to database
  await supabase
    .from("twitter_profile")
    .upsert(users.map(serializeTwitterUser))
    .throwOnError();

  // Upsert relations to database
  await supabase
    .from(relationTable)
    .upsert(
      users.map((x) => {
        // Only in the case of followers target user is target_id
        const row =
          relation == "followers"
            ? {
                source_id: x.id,
                target_id: job.target_id,
              }
            : { source_id: job.target_id, target_id: x.id };
        return {
          ...row,
          updated_at: new Date(),
          to_delete: false,
        };
      })
    )
    .throwOnError();

  // When no more pagination remaining
  const finished = paginationToken === null;

  if (finished) {
    // delete old relations with delete flag
    await supabase
      .from(relationTable)
      .delete()
      // Only in the case of followers the user is target_id
      .eq(relation == "followers" ? "target_id" : "source_id", job.target_id)
      .eq("to_delete", true)
      .throwOnError();

    // Update user's relationUpdatedAt field in database
    await supabase
      .from("twitter_profile")
      .update({ [`${relation}_updated_at`]: new Date() })
      .eq("id", job.target_id)
      .throwOnError();
  }

  // Update job
  await supabase
    .from("lookup_relation_job")
    .update({
      pagination_token: paginationToken,
      updated_count: job.updated_count + users.length,
      priority: job.priority - 1,
      finished,
      updated_at: new Date(),
    })
    .eq("id", jobId)
    .throwOnError();
};
