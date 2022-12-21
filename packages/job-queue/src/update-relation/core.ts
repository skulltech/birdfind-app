import {
  getTwitterClient,
  getUpdateRelationJobParams,
  Relation,
  serializeTwitterUser,
  twitterUserFields,
  UpdateRelationJobInput,
  UpdateRelationResult,
} from "@twips/common";
import { Job } from "bullmq";
import { Client } from "twitter-api-sdk";
import { dedupeUsers, queue, supabase } from "./utils";

// 10 seconds
const bufferMs = 10 * 1000;

type Params = {
  table: string;
  updatedAtColumn: string;
  getTwitterMethod: (twitter: Client) => any;
  getRow: (
    sourceId: BigInt,
    targetId: string
  ) => { source_id: string; target_id: string };
};

const params: Record<Relation, Params> = {
  followers: {
    table: "twitter_follow",
    updatedAtColumn: "followers_updated_at",
    getTwitterMethod: (twitter) => twitter.users.usersIdFollowers,
    getRow: (sourceId: BigInt, targetId: string) => {
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
    getRow: (sourceId: BigInt, targetId: string) => {
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
    getRow: (sourceId: BigInt, targetId: string) => {
      return {
        source_id: sourceId.toString(),
        target_id: targetId,
      };
    },
  },
  muting: {
    table: "twitter_mute",
    updatedAtColumn: "muting_updated_at",
    getTwitterMethod: (twitter) => twitter.users.usersIdMuting,
    getRow: (sourceId: BigInt, targetId: string) => {
      return {
        source_id: sourceId.toString(),
        target_id: targetId,
      };
    },
  },
};

export const updateRelation = async (
  job: Job<UpdateRelationJobInput, UpdateRelationResult>
): Promise<UpdateRelationResult> => {
  // Job inputs
  let { userId, relation, paginationToken, signedInUserId } = job.data;

  // Get user's oauth token from Supabase
  const { data, error: getTokenError } = await supabase
    .from("user_profile")
    .select("twitter_oauth_token")
    .eq("id", signedInUserId);
  if (getTokenError) throw getTokenError;
  if (!data.length) throw Error("User not found");
  const oauthToken = data[0].twitter_oauth_token;

  // Get twitter client of user
  const twitter = await getTwitterClient({
    clientId: process.env.TWITTER_CLIENT_ID,
    clientSecret: process.env.TWITTER_CLIENT_SECRET,
    supabase,
    userId: signedInUserId,
    oauthToken,
  });

  // Get relation specific logic params
  const { table, updatedAtColumn, getTwitterMethod, getRow } = params[relation];

  const response = getTwitterMethod(twitter)(
    userId.toString(),
    {
      max_results: 1000,
      "user.fields": twitterUserFields,
    },
    { pagination_token: paginationToken }
  );

  // Loop through paginated response and get all users
  let rateLimitResetsAt: Date;
  let updatedCount: number = 0;
  try {
    for await (const page of response) {
      paginationToken = page.meta.next_token;

      // Remove duplicates and save count
      const dedupedUsers = dedupeUsers(page.data);
      updatedCount = updatedCount + dedupedUsers.length;

      // Upsert users to database
      const { error: insertProfilesError } = await supabase
        .from("twitter_profile")
        .upsert(dedupedUsers.map(serializeTwitterUser));
      if (insertProfilesError) throw insertProfilesError;

      // Upsert relations to database
      const { error: insertEdgesError } = await supabase.from(table).upsert(
        dedupedUsers.map((x) => {
          return {
            ...getRow(userId, x.id),
            updated_at: new Date().toISOString(),
          };
        })
      );
      if (insertEdgesError) throw insertEdgesError;

      // Update job progress
      await job.updateProgress({
        message: "Fetched users from Twitter and upserted to Supabase",
        data: { count: updatedCount },
      });
    }
  } catch (error) {
    // If rate-limited, save the rateLimitReset timestamp and continue
    if (error.status == 429) {
      rateLimitResetsAt = new Date(
        Number(error.headers["x-rate-limit-reset"]) * 1000
      );
    } else {
      throw error;
    }
  }

  // Update job progress
  await job.updateProgress({
    message: "Done fetching users from Twitter",
    data: { count: updatedCount },
  });

  // If no more pagination remaining, and if not rate-limited
  if (paginationToken === undefined && rateLimitResetsAt === undefined) {
    // Upsert user's followersUpdatedAt field in database
    const { error: updateUserError } = await supabase
      .from("twitter_profile")
      .update({ [updatedAtColumn]: new Date().toISOString() })
      .eq("id", userId.toString());
    if (updateUserError) throw updateUserError;
  }

  // If it got rate limited, schedule another job
  if (rateLimitResetsAt !== undefined) {
    const delay = rateLimitResetsAt.getTime() - Date.now() + bufferMs;

    // Add a new job to the queue with delay
    const { jobName, opts } = await getUpdateRelationJobParams({
      supabase,
      relation,
      userId,
      paginationToken,
    });
    await queue.add(
      jobName,
      { signedInUserId, userId, paginationToken, relation },
      { ...opts, delay }
    );

    // Update job progress
    const delayMins = (rateLimitResetsAt.getTime() - Date.now()) / (1000 * 60);
    await job.updateProgress({
      message: "Scheduled another job to get around rate limit",
      data: { delayMins },
    });
  }

  return { updatedCount, rateLimitResetsAt, paginationToken };
};
