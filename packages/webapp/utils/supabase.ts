import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { parseTwitterProfiles, twitterProfileFields } from "@twips/lib";
import { TwitterResponse, findMyUser } from "twitter-api-sdk/dist/types";
import { camelCase } from "lodash";

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

const serializeTwitterUser = (user: TwitterResponse<findMyUser>["data"]) => {
  return {
    id: user.id,
    updated_at: new Date().toISOString(),
    username: user.username,
    name: user.name,
    user_created_at: user.created_at,
    description: user.description,
    entities: user.entities,
    location: user.location,
    pinned_tweet_id: user.pinned_tweet_id,
    profile_image_url: user.profile_image_url,
    protected: user.protected,
    followers_count: user.public_metrics.followers_count,
    following_count: user.public_metrics.following_count,
    tweet_count: user.public_metrics.tweet_count,
    listed_count: user.public_metrics.listed_count,
    url: user.url,
    verified: user.verified,
    withheld: user.withheld,
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

export const updateUserProfile = async (
  supabase: SupabaseClient,
  userId: string,
  values: any
) => {
  const { error } = await supabase
    .from("user_profile")
    .update(values)
    .eq("id", userId);
  if (error) throw error;
};

export const upsertTwitterProfile = async (
  supabase: SupabaseClient,
  user: TwitterResponse<findMyUser>["data"]
) => {
  const row = serializeTwitterUser(user);
  const { data, error } = await supabase
    .from("twitter_profile")
    .upsert(row)
    .select(twitterProfileFields.join(","));
  if (error) throw error;

  return parseTwitterProfiles(data)[0];
};

export const getUserDetails = async (
  supabase: SupabaseClient
): Promise<UserDetails> => {
  const { data, error } = await supabase
    .from("user_details")
    .select(userDetailsFields.join(","));
  if (error) throw error;

  // @ts-ignore
  return data.length ? parseUserDetails(data[0]) : null;
};
