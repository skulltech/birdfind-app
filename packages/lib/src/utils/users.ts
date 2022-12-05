import { appendGeneralFilters, userApiFields } from "./helpers";
import { camelCase } from "lodash";
import { Filters, GeneralFilters, TwitterUser } from "./types";
import { SupabaseClient } from "@supabase/supabase-js";
import Client from "twitter-api-sdk";
import {
  findUsersByUsername,
  TwitterResponse,
} from "twitter-api-sdk/dist/types";

const userSelectFields = [
  "id::text",
  "updated_at",
  "followers_updated_at",
  "following_updated_at",
  "username",
  "name",
  "followers_count",
  "following_count",
  "tweet_count",
  "description",
  "user_created_at",
  "profile_image_url",
];

export type UpdateUsersArgs = {
  users: string[] | TwitterResponse<findUsersByUsername>["data"];
  supabase: SupabaseClient;
  twitter: Client;
};

const isArrayOfStrings = (value: unknown): value is string[] => {
  return (
    Array.isArray(value) && value.every((item) => typeof item === "string")
  );
};

// Fetch users from Twitter API and update DB cache
export const updateUsers = async ({
  users,
  supabase,
  twitter,
}: UpdateUsersArgs) => {
  if (isArrayOfStrings(users)) {
    console.log("Making request to findUsersByUsername.");
    const response = await twitter.users.findUsersByUsername({
      usernames: users,
      "user.fields": userApiFields,
    });
  }

  if (response.data) {
    const { error } = await supabase.from("twitter_user").upsert(
      response.data.map((x) => {
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
    if (error) throw error;
  }

  return response;
};

export const parseUsers = (users: any[]) => {
  const camelCaseUsers: any[] = users.map((user) => {
    return Object.entries(user).reduce((prev, [key, value]) => {
      prev[camelCase(key)] = value;
      return prev;
    }, {});
  });

  const parsedUsers: TwitterUser[] = camelCaseUsers.map((x) => {
    return {
      ...x,
      id: BigInt(x.id),
      updatedAt: new Date(x.updatedAt),
      followersUpdatedAt: new Date(x.followersUpdatedAt),
      followingUpdatedAt: new Date(x.followingUpdatedAt),
      userCreatedAt: new Date(x.userCreatedAt),
    };
  });

  return parsedUsers;
};

export type GetUsersArgs = {
  usernames: string[];
  supabase: SupabaseClient;
};

export const getUsers = async ({ usernames, supabase }: GetUsersArgs) => {
  const { data: users, error: selectError } = await supabase
    .from("twitter_user")
    .select(userSelectFields.join(","))
    .in("username", usernames);
  if (selectError) throw selectError;

  return parseUsers(users);
};

export const getUsersByFilters = async (
  supabase: SupabaseClient,
  filters
): Promise<TwitterUser[]> => {
  const { followerOf, followedBy, ...generalFilters } = filters;
  let query = supabase
    .rpc("search_follow_network", {
      follower_of: filters.followerOf?.map((x: BigInt) => x.toString()) ?? [],
      followed_by: filters.followedBy.map((x: BigInt) => x.toString()) ?? [],
    })
    .select(userSelectFields.join(","));
  // @ts-ignore
  query = appendGeneralFilters(query, generalFilters);
  console.log(query);

  const { data: users, error: selectError } = await query;
  if (selectError) throw selectError;

  return parseUsers(users);
};
