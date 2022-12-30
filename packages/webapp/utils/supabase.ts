import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { serializeTwitterUser, twitterProfileFields } from "@twips/common";
import camelCase from "camelcase";
import { TwitterResponse, usersIdFollowers } from "twitter-api-sdk/dist/types";
import { parseTwitterProfile, TwitterProfile, Filters } from "./helpers";

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
        }
      : null,
  };
};

export const getUserProfile = async (
  supabase: SupabaseClient
): Promise<any> => {
  const { data, error } = await supabase
    .from("user_profile")
    .select(userProfileFields.join(","));
  if (error) throw error;
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

  const { error } = await supabase
    .from("user_profile")
    .update({ twitter_oauth_state: { state, challenge } })
    .eq("id", user.id);
  if (error) throw error;
};

export const completeOauthFlow = async (
  supabase: SupabaseClient,
  userId: string,
  twitterId: string,
  oauthToken: any
) => {
  // Check if someone has this Twitter account linked already
  const { count, error: selectError } = await supabase
    .from("user_profile")
    .select("*", { count: "exact", head: true })
    .eq("twitter_id", twitterId);
  if (selectError) throw selectError;

  // If yes, then remove that link
  if (count) {
    const { error: removeLinkError } = await supabase
      .from("user_profile")
      .update({ twitter_oauth_token: null, twitter_id: null })
      .eq("twitter_id", twitterId);
    if (removeLinkError) throw removeLinkError;
  }

  // Link twitter to the new account
  const { error: addLinkError } = await supabase
    .from("user_profile")
    .update({
      twitter_oauth_state: null,
      twitter_oauth_token: oauthToken,
      twitter_id: twitterId,
    })
    .eq("id", userId);
  if (addLinkError) throw addLinkError;
};

export const getUserDetails = async (
  supabase: SupabaseClient
): Promise<UserDetails> => {
  const { data, error } = await supabase
    .rpc("get_user_details")
    .select(userDetailsFields.join(","));
  if (error) throw error;

  // @ts-ignore
  return data.length ? parseUserDetails(data[0]) : null;
};

export const searchTwitterProfiles = async (
  supabase: SupabaseClient,
  filters: Filters
): Promise<TwitterProfile[]> => {
  const { followerOf, followedBy, blockedBy, mutedBy, ...otherFilters } =
    filters;

  let query = supabase
    .rpc("search_twitter_profiles", {
      follower_of: followerOf,
      followed_by: followedBy,
      blocked_by: blockedBy,
      muted_by: mutedBy,
    })
    .select(twitterProfileFields.join(","));

  const appendFilterFunctions = {
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
      query.gt("following_count", value),
    createdBefore: (query, value: Date) =>
      query.lt("user_created_at", value.toISOString()),
    createdAfter: (query, value: Date) =>
      query.gt("user_created_at", value.toISOString()),
    searchText: (query, value: string) =>
      query.ilike("concat(username,name,description)", `%${value}%`),
  };

  for (const [key, value] of Object.entries(otherFilters))
    query = appendFilterFunctions[key](query, value);

  const { data, error: searchError } = await query.limit(1000);
  if (searchError) throw searchError;

  // Insert event in user_event table
  await insertUserEvent(supabase, "search", filters);

  return data.map((x) => parseTwitterProfile(x));
};

export const upsertTwitterProfile = async (
  supabase: SupabaseClient,
  user: TwitterResponse<usersIdFollowers>["data"][number]
) => {
  const { data, error } = await supabase
    .from("twitter_profile")
    .upsert(serializeTwitterUser(user))
    .select(twitterProfileFields.join(","));
  if (error) throw error;

  return parseTwitterProfile(data[0]);
};

export const insertUserEvent = async (
  supabase: SupabaseClient,
  type: string,
  data: object
) => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error: insertEventError } = await supabase
    .from("user_event")
    .insert({ user_id: user.id, type, data });
  if (insertEventError) throw insertEventError;
};
