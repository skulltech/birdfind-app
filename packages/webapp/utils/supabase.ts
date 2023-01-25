import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
  JobName,
  serializeTwitterUser,
  twitterProfileColumns,
} from "@birdfind/common";
import camelCase from "camelcase";
import { TwitterResponse, usersIdFollowers } from "twitter-api-sdk/dist/types";
import { parseTwitterProfile, TwitterProfile, Filters, Job } from "./helpers";

export const getServiceRoleSupabase = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

const userProfileFields = [
  "id",
  "twitter_oauth_state",
  "twitter_oauth_token",
  "twitter_id::text",
];

const userDetailsFields = [
  "id",
  "email",
  "twitter_id::text",
  "twitter_username",
  "twitter_oauth_token",
  "twitter_profile_image_url",
  "twitter_name",
];

export type List = {
  id: BigInt;
  name: string;
};

export type UserDetails = {
  id: string;
  email: string;
  twitter: {
    id: BigInt;
    username: string;
    profileImageUrl: string;
    oauthToken: any;
    name: string;
  } | null;
};

const parseUserDetails = (row: any) => {
  const camelCaseRow: any = Object.entries(row).reduce((prev, [key, value]) => {
    prev[camelCase(key)] = value;
    return prev;
  }, {});

  return {
    id: camelCaseRow.id,
    email: camelCaseRow.email,
    twitter: camelCaseRow.twitterId
      ? {
          id: BigInt(camelCaseRow.twitterId),
          username: camelCaseRow.twitterUsername,
          profileImageUrl: camelCaseRow.twitterProfileImageUrl,
          oauthToken: camelCaseRow.twitterOauthToken,
          name: camelCaseRow.twitterName,
        }
      : null,
  };
};

export const getUserProfile = async (
  supabase: SupabaseClient
): Promise<any> => {
  const { data } = await supabase
    .from("user_profile")
    .select(userProfileFields.join(","))
    .throwOnError();
  return data.length ? data[0] : null;
};

export const startOauthFlow = async (
  supabase: SupabaseClient,
  state: string,
  challenge: string
) => {
  const {
    data: { user: user },
  } = await supabase.auth.getUser();

  await supabase
    .from("user_profile")
    .update({ twitter_oauth_state: { state, challenge } })
    .eq("id", user.id)
    .throwOnError();
};

export const completeOauthFlow = async (
  supabase: SupabaseClient,
  userId: string,
  twitterId: string,
  oauthToken: any
) => {
  // Check if someone has this Twitter account linked already
  const { count } = await supabase
    .from("user_profile")
    .select("*", { count: "exact", head: true })
    .eq("twitter_id", twitterId)
    .throwOnError();

  // If yes, then remove that link
  if (count)
    await supabase
      .from("user_profile")
      .update({ twitter_oauth_token: null, twitter_id: null })
      .eq("twitter_id", twitterId)
      .throwOnError();

  // Link twitter to the new account
  await supabase
    .from("user_profile")
    .update({
      twitter_oauth_state: null,
      twitter_oauth_token: oauthToken,
      twitter_id: twitterId,
    })
    .eq("id", userId)
    .throwOnError();
};

export const getUserDetails = async (
  supabase: SupabaseClient
): Promise<UserDetails> => {
  const { data } = await supabase
    .rpc("get_user_details")
    .select(userDetailsFields.join(","))
    .throwOnError();
  // @ts-ignore
  return data.length ? parseUserDetails(data[0]) : null;
};

export interface SearchResult extends TwitterProfile {
  isFollowing: boolean;
  isFollower: boolean;
  isBlocked: boolean;
  isMuted: boolean;
}

type SearchTwitterProfilesArgs = {
  supabase: SupabaseClient;
  userTwitterId: BigInt;
  filters: Filters;
  pageIndex: number;
  orderBy: string;
  orderAscending: boolean;
};

type SearchTwitterProfilesResult = {
  results: SearchResult[];
  count: number;
};

export const searchTwitterProfiles = async ({
  supabase,
  userTwitterId,
  filters,
  pageIndex,
  orderBy,
  orderAscending,
}: SearchTwitterProfilesArgs): Promise<SearchTwitterProfilesResult> => {
  const { followerOf, followedBy, ...otherFilters } = filters;

  const appendFilterFunctions: Record<
    keyof typeof otherFilters,
    (query: any, value: any) => any
  > = {
    followersCountLessThan: (query, value: number) =>
      query.lt("followers_count", value),
    followersCountGreaterThan: (query, value: number) =>
      query.gt("followers_count", value),
    followingCountLessThan: (query, value: number) =>
      query.lt("following_count", value),
    followingCountGreaterThan: (query, value: number) =>
      query.gt("following_count", value),
    tweetCountLessThan: (query, value: number) =>
      query.lt("tweet_count", value),
    tweetCountGreaterThan: (query, value: number) =>
      query.gt("tweet_count", value),
    createdBefore: (query, value: Date) =>
      query.lt("user_created_at", value.toISOString()),
    createdAfter: (query, value: Date) =>
      query.gt("user_created_at", value.toISOString()),
    searchText: (query, value: string) =>
      query.ilike("concat(username,name,description)", `%${value}%`),
  };

  // Get count

  let countQuery = supabase
    .rpc(
      "search_twitter_profiles",
      {
        follower_of: followerOf,
        followed_by: followedBy,
      },
      { count: "exact" }
    )
    .select(
      "username,name,description,followers_count,following_count,tweet_count,user_created_at"
    );

  for (const [key, value] of Object.entries(otherFilters))
    countQuery = appendFilterFunctions[key](countQuery, value);

  const { count } = await countQuery.throwOnError();

  // Get results

  let resultsQuery = supabase
    .rpc("search_twitter_profiles", {
      reference_user: userTwitterId,
      follower_of: followerOf,
      followed_by: followedBy,
    })
    .select(
      [
        ...twitterProfileColumns,
        "is_follower",
        "is_following",
        "is_blocked",
        "is_muted",
      ].join(",")
    );

  for (const [key, value] of Object.entries(otherFilters))
    resultsQuery = appendFilterFunctions[key](resultsQuery, value);

  const { data } = await resultsQuery
    .order(orderBy, { ascending: orderAscending })
    .order("updated_at", { ascending: true })
    .order("id", { ascending: true })
    .range(100 * pageIndex, 100 * (pageIndex + 1) - 1)
    .throwOnError();

  // Insert user event
  await insertUserEvent(supabase, "search-using-filters", {
    filters,
    pageIndex,
  });

  const results = data.map((x: any) => {
    return {
      ...parseTwitterProfile(x),
      isFollower: x.is_follower,
      isFollowing: x.is_following,
      isBlocked: x.is_blocked,
      isMuted: x.is_muted,
    };
  });

  return {
    count,
    results,
  };
};

export const upsertTwitterProfile = async (
  supabase: SupabaseClient,
  user: TwitterResponse<usersIdFollowers>["data"][number]
) => {
  const { data } = await supabase
    .from("twitter_profile")
    .upsert(serializeTwitterUser(user))
    .select(twitterProfileColumns.join(","))
    .throwOnError();

  return parseTwitterProfile(data[0]);
};

type UserEventType =
  | "search-using-filters"
  | "manage-relation"
  | "create-list"
  | "manage-list-members"
  | "prompt-to-filters";

export const insertUserEvent = async (
  supabase: SupabaseClient,
  type: UserEventType,
  data: object
) => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  await supabase
    .from("user_event")
    .insert({ user_id: user.id, type, data })
    .throwOnError();
};
