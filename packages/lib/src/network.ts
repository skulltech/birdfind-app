import { SupabaseClient } from "@supabase/supabase-js";
import { Client } from "twitter-api-sdk";
import {
  TwitterResponse,
  usersIdFollowers,
  usersIdFollowing,
} from "twitter-api-sdk/dist/types";
import { twitterUserFields } from "./utils";

const dedupeUsers = <T extends { id: string }>(arr: T[]) => {
  const dedupedUsers = new Set<string>();

  return arr.filter((x) => {
    if (dedupedUsers.has(x.id)) return false;
    dedupedUsers.add(x.id);
    return true;
  });
};

export type UpdateNetworkArgs = {
  userId: BigInt;
  direction: "followers" | "following";
  supabase: SupabaseClient;
  twitter: Client;
  paginationToken?: string;
};

export type UpdateNetworkResult = {
  updatedCount: number;
  paginationToken?: string;
  rateLimitResetsAt?: Date;
};

export const updateNetwork = async ({
  userId,
  direction,
  supabase,
  twitter,
  paginationToken,
}: UpdateNetworkArgs): Promise<UpdateNetworkResult> => {
  const response = (
    direction == "followers"
      ? twitter.users.usersIdFollowers
      : twitter.users.usersIdFollowing
  )(
    userId.toString(),
    {
      max_results: 1000,
      "user.fields": twitterUserFields,
    },
    { pagination_token: paginationToken }
  );

  // Loop through paginated response and get all users
  const users: TwitterResponse<
    typeof direction extends "followers" ? usersIdFollowers : usersIdFollowing
  >["data"] = [];
  let rateLimitResetsAt: Date;
  try {
    for await (const page of response) {
      console.log(`Fetching ${direction} of user ${userId}`);
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

  // Remove duplicates
  const dedupedUsers = dedupeUsers(users);

  // Upsert followers to database
  const { error: insertUsersError } = await supabase
    .from("twitter_user")
    .upsert(
      dedupedUsers.map((x) => {
        return {
          username: x.username,
          id: x.id,
          name: x.name,
          followers_count: x.public_metrics.followers_count,
          following_count: x.public_metrics.following_count,
          tweet_count: x.public_metrics.tweet_count,
          description: x.description,
          user_created_at: x.created_at,
          updated_at: new Date().toISOString(),
          profile_image_url: x.profile_image_url,
        };
      })
    );
  if (insertUsersError) throw insertUsersError;

  // Upsert relations to database
  const { error: insertEdgesError } = await supabase
    .from("twitter_follow")
    .upsert(
      dedupedUsers.map((x) => {
        return direction == "followers"
          ? {
              follower_id: x.id,
              following_id: userId.toString(),
              updated_at: new Date().toISOString(),
            }
          : {
              follower_id: userId.toString(),
              following_id: x.id,
              updated_at: new Date().toISOString(),
            };
      })
    );
  if (insertEdgesError) throw insertEdgesError;

  // If no more pagination remaining, and if not rate-limited
  if (paginationToken === undefined && rateLimitResetsAt === undefined) {
    // Upsert user's followersUpdatedAt field in database
    const { error: updateUserError } = await supabase
      .from("twitter_user")
      .update({
        [direction == "followers"
          ? "followers_updated_at"
          : "following_updated_at"]: new Date().toISOString(),
      })
      .eq("id", userId.toString());
    if (updateUserError) throw updateUserError;
  }

  return {
    updatedCount: dedupedUsers.length,
    paginationToken,
    rateLimitResetsAt,
  };
};
