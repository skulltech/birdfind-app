import { SupabaseClient } from "@supabase/supabase-js";
import {
  Relation,
  twitterUserFields,
  UpdateRelationResult,
  upsertTwitterProfiles,
} from "@twips/lib";
import { Client } from "twitter-api-sdk";
import { TwitterResponse, usersIdFollowers } from "twitter-api-sdk/dist/types";
import { dedupeUsers } from "./utils";

export type UpdateRelationArgs = {
  userId: BigInt;
  relation: Relation;
  supabase: SupabaseClient;
  twitter: Client;
  paginationToken?: string;
};

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

export const updateRelation = async ({
  userId,
  relation,
  supabase,
  twitter,
  paginationToken,
}: UpdateRelationArgs): Promise<UpdateRelationResult> => {
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
  const users: TwitterResponse<usersIdFollowers>["data"] = [];
  let rateLimitResetsAt: Date;
  try {
    for await (const page of response) {
      users.push(...page.data);
      paginationToken = page.meta.next_token;
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

  // Remove duplicates and Upsert followers to database
  const dedupedUsers = dedupeUsers(users);
  await upsertTwitterProfiles(supabase, dedupedUsers);

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

  // If no more pagination remaining, and if not rate-limited
  if (paginationToken === undefined && rateLimitResetsAt === undefined) {
    // Upsert user's followersUpdatedAt field in database
    const { error: updateUserError } = await supabase
      .from("twitter_profile")
      .update({ [updatedAtColumn]: new Date().toISOString() })
      .eq("id", userId.toString());
    if (updateUserError) throw updateUserError;
  }

  return {
    updatedCount: dedupedUsers.length,
    paginationToken,
    rateLimitResetsAt,
  };
};
