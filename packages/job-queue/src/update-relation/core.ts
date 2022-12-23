import {
  getTwitterClient,
  Relation,
  serializeTwitterUser,
  twitterUserFields,
  UpdateRelationJobResult,
  UpdateRelationJobData,
  updateRelationJobOpts,
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
  job: Job<UpdateRelationJobData, UpdateRelationJobResult>
) => {
  // Job inputs
  const { userId, relation, continuationParams, signedInUserId } = job.data;
  let paginationToken = continuationParams?.paginationToken;

  // Populate human readable data
  const { data: signedInUser, error: selectEmailError } = await supabase
    .from("user_profile")
    .select("email,twitter_id::text,twitter_oauth_token")
    .eq("id", signedInUserId)
    .single();
  if (selectEmailError) throw selectEmailError;

  const { data: usernames, error: selectUsernamesError } = await supabase
    .from("twitter_profile")
    .select("id::text,username")
    // @ts-ignore
    .in("id", [userId, signedInUser.twitter_id]);
  if (selectUsernamesError) throw selectUsernamesError;
  const usernamesMap: Record<string, string> = usernames.reduce(
    (prev, curr) => {
      // @ts-ignore
      return { ...prev, [curr.id]: curr.username };
    },
    {}
  );

  await job.update({
    ...job.data,
    humanReadable: {
      signedInUser: {
        // @ts-ignore
        email: signedInUser.email,
        // @ts-ignore
        username: usernamesMap[signedInUser.twitter_id],
      },
      username: usernamesMap[userId.toString()],
    },
  });

  // Get twitter client of user
  const twitter = await getTwitterClient({
    clientId: process.env.TWITTER_CLIENT_ID,
    clientSecret: process.env.TWITTER_CLIENT_SECRET,
    supabase,
    userId: signedInUserId,
    // @ts-ignore
    oauthToken: signedInUser.twitter_oauth_token,
  });

  // Get relation specific logic params
  const { table, updatedAtColumn, getTwitterMethod, getRow } = params[relation];

  // Call twitter API method
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
  let totalUpdatedCount: number = continuationParams?.totalUpdatedCount ?? 0;
  try {
    for await (const page of response) {
      paginationToken = page.meta.next_token;

      // Remove duplicates and save count
      const dedupedUsers = dedupeUsers(page.data);
      updatedCount = updatedCount + dedupedUsers.length;
      totalUpdatedCount = totalUpdatedCount + dedupedUsers.length;

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
      await job.updateProgress({ updatedCount, totalUpdatedCount });
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

  // Completed fetching all users of the batch
  if (paginationToken === undefined && rateLimitResetsAt === undefined) {
    // Upsert user's followersUpdatedAt field in database
    const { error: updateUserError } = await supabase
      .from("twitter_profile")
      .update({ [updatedAtColumn]: new Date().toISOString() })
      .eq("id", userId.toString());
    if (updateUserError) throw updateUserError;
  }

  // If it got rate limited, schedule another job
  console.log(typeof continuationParams?.initialProcessedAt);
  if (rateLimitResetsAt !== undefined) {
    const delay = rateLimitResetsAt.getTime() - Date.now() + bufferMs;
    const newContinuationParams = {
      paginationToken,
      iterationCount: (continuationParams?.iterationCount ?? 0) + 1,
      totalUpdatedCount:
        (continuationParams?.totalUpdatedCount ?? 0) + updatedCount,
      initialProcessedAt:
        continuationParams?.initialProcessedAt ?? new Date(job.processedOn),
    };

    // Add a new job to the queue with delay
    await queue.add(
      "Update relation",
      {
        signedInUserId,
        userId,
        relation,
        continuationParams: newContinuationParams,
      },
      { ...updateRelationJobOpts, delay }
    );
  }

  // Return result
  return {
    totalUpdatedCount,
    rateLimitResetsAt: rateLimitResetsAt.toISOString(),
  };
};
