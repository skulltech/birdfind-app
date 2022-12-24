import {
  getTwitterClient,
  Relation,
  serializeTwitterUser,
  twitterUserFields,
  UpdateRelationJobData,
  UpdateRelationJobStep,
} from "@twips/common";
import { Job } from "bullmq";
import { Client } from "twitter-api-sdk";
import { TwitterResponse, usersIdFollowing } from "twitter-api-sdk/dist/types";
import { dedupeUsers, supabase } from "./utils";

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
  job: Job<UpdateRelationJobData>,
  token?: string
) => {
  const { twitterId, relation, signedInUserId } = job.data;
  let { step, updatedCount, paginationToken, iterationCount } = job.data;

  // Get relation specific logic params
  const { table, updatedAtColumn, getTwitterMethod, getRow } = params[relation];

  while (step !== UpdateRelationJobStep.Finish) {
    switch (step) {
      case UpdateRelationJobStep.Execute: {
        // Get twitter client of user
        const { data, error: getTokenError } = await supabase
          .from("user_profile")
          .select("twitter_oauth_token")
          .eq("id", signedInUserId)
          .single();
        if (getTokenError) throw getTokenError;

        const twitter = await getTwitterClient({
          clientId: process.env.TWITTER_CLIENT_ID,
          clientSecret: process.env.TWITTER_CLIENT_SECRET,
          supabase,
          userId: signedInUserId,
          // @ts-ignore
          oauthToken: data.twitter_oauth_token,
        });

        let users: TwitterResponse<usersIdFollowing>["data"];
        try {
          const page = await getTwitterMethod(twitter)(twitterId.toString(), {
            max_results: 1000,
            "user.fields": twitterUserFields,
            pagination_token: paginationToken,
          });
          users = page.data;
          paginationToken = page.meta.next_token ?? undefined;
        } catch (error) {
          // If rate-limited, delay the job
          if (error.status == 429) {
            const delayedTo =
              Number(error.headers["x-rate-limit-reset"]) * 1000 +
              // extra 10 seconds just to be safe
              10 * 1000;
            await job.updateProgress({
              delayedTo: new Date(delayedTo).toLocaleTimeString(),
            });
            await job.moveToDelayed(delayedTo, token);
            return null;
          } else throw error;
        }

        // Remove duplicates
        users = dedupeUsers(users);

        // Upsert users to database
        const { error: insertProfilesError } = await supabase
          .from("twitter_profile")
          .upsert(users.map(serializeTwitterUser));
        if (insertProfilesError) throw insertProfilesError;

        // Upsert relations to database
        const { error: insertEdgesError } = await supabase.from(table).upsert(
          users.map((x) => {
            return {
              ...getRow(twitterId, x.id),
              updated_at: new Date().toISOString(),
            };
          })
        );
        if (insertEdgesError) throw insertEdgesError;

        // Update job progress
        updatedCount = updatedCount + users.length;
        iterationCount = iterationCount + 1;
        await job.update({
          ...job.data,
          paginationToken,
          updatedCount,
          iterationCount,
        });
        await job.updateProgress(null);

        if (paginationToken === undefined) {
          step = UpdateRelationJobStep.Finalize;
          await job.update({
            ...job.data,
            step,
          });
        }
        break;
      }

      case UpdateRelationJobStep.Finalize: {
        // Upsert user's relationUpdatedAt field in database
        const { error: updateUserError } = await supabase
          .from("twitter_profile")
          .update({ [updatedAtColumn]: new Date().toISOString() })
          .eq("id", twitterId.toString());
        if (updateUserError) throw updateUserError;

        step = UpdateRelationJobStep.Finish;
        await job.update({ ...job.data, step });
        return null;
      }
    }
  }
};
