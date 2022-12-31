import {
  getTwitterClient,
  Relation,
  serializeTwitterUser,
  twitterUserFields,
  updateRelationJobColumns,
} from "@twips/common";
import { Client } from "twitter-api-sdk";
import { TwitterResponse, usersIdFollowing } from "twitter-api-sdk/dist/types";
import { supabase } from "../utils";
import { dedupeUsers } from "./utils";

type Params = {
  table: string;
  updatedAtColumn: string;
  getTwitterMethod: (twitter: Client) => any;
  getRow: (
    sourceId: string,
    targetId: string
  ) => { source_id: string; target_id: string };
};

const params: Record<Relation, Params> = {
  followers: {
    table: "twitter_follow",
    updatedAtColumn: "followers_updated_at",
    getTwitterMethod: (twitter) => twitter.users.usersIdFollowers,
    getRow: (sourceId: string, targetId: string) => {
      return {
        source_id: targetId,
        target_id: sourceId.toString(),
      };
    },
  },
  following: {
    table: "twitter_follow",
    updatedAtColumn: "following_updated_at",
    getTwitterMethod: (twitter) => twitter.users.usersIdFollowing,
    getRow: (sourceId: string, targetId: string) => {
      return {
        source_id: sourceId.toString(),
        target_id: targetId,
      };
    },
  },
  blocking: {
    table: "twitter_block",
    updatedAtColumn: "blocking_updated_at",
    getTwitterMethod: (twitter) => twitter.users.usersIdBlocking,
    getRow: (sourceId: string, targetId: string) => {
      return {
        source_id: sourceId,
        target_id: targetId,
      };
    },
  },
  muting: {
    table: "twitter_mute",
    updatedAtColumn: "muting_updated_at",
    getTwitterMethod: (twitter) => twitter.users.usersIdMuting,
    getRow: (sourceId: string, targetId: string) => {
      return {
        source_id: sourceId.toString(),
        target_id: targetId,
      };
    },
  },
};

export const updateRelation = async (jobId: number) => {
  // Get job from Supabase
  const { data: jobData } = await supabase
    .from("update_relation_job")
    .select(updateRelationJobColumns.join(","))
    .eq("id", jobId)
    .throwOnError()
    .single();
  const job = jobData as any;

  // Return immediately if job is finished
  if (job.finished) return;

  // Get relation specific logic params
  const { table, updatedAtColumn, getTwitterMethod, getRow } =
    params[job.relation];

  // If this is the first iteration, set to_delete flags to true
  if (job.updated_count === 0)
    await supabase
      .from(table)
      .update({ to_delete: true })
      .eq(
        job.relation == "followers" ? "target_id" : "source_id",
        job.target_twitter_id
      )
      .throwOnError();

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
    const page = await getTwitterMethod(twitter)(job.target_twitter_id, {
      max_results: 1000,
      "user.fields": twitterUserFields,
      pagination_token: paginationToken,
    });
    users = page.data;
    paginationToken = page.meta.next_token ?? null;
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
          endpoint: "get-" + job.relation,
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
    .eq("endpoint", "get-" + job.relation)
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
    .from(table)
    .upsert(
      users.map((x) => {
        return {
          ...getRow(job.target_twitter_id, x.id),
          updated_at: new Date().toISOString(),
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
      .from(table)
      .delete()
      .eq(
        job.relation == "followers" ? "target_id" : "source_id",
        job.target_twitter_id
      )
      .eq("to_delete", true)
      .throwOnError();

    // Upsert user's relationUpdatedAt field in database
    await supabase
      .from("twitter_profile")
      .update({ [updatedAtColumn]: new Date().toISOString() })
      .eq("id", job.target_twitter_id)
      .throwOnError();
  }

  // Update job
  await supabase
    .from("update_relation_job")
    .update({
      pagination_token: paginationToken,
      updated_count: job.updated_count + users.length,
      priority: job.priority - 1,
      finished,
      updated_at: new Date().toISOString(),
    })
    .eq("id", jobId)
    .throwOnError();
};
