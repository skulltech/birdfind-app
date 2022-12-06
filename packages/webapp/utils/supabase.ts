import { SupabaseClient } from "@supabase/supabase-js";
import { TwitterResponse, findMyUser } from "twitter-api-sdk/dist/types";

const twitterProfileFields = [
  "id::text",
  "created_at",
  "updated_at",

  // For follow network
  "followers_updated_at",
  "following_updated_at",

  // All user.fields available, in order as in Twitter docs
  "username",
  "name",
  "user_created_at",
  "description",
  "entities",
  "location",
  "pinned_tweet_id",
  "profile_image_url",
  "protected",

  // Public metrics
  "followers_count",
  "following_count",
  "tweet_count",
  "listed_count",

  "url",
  "verified",
  "withheld",
];

const userProfileFields = [
  "id",
  "twitter_oauth_state",
  "twitter_oauth_token",
  "twitter_id::text",
];

export const getUserProfile = async (
  supabase: SupabaseClient
): Promise<any> => {
  const { data, error } = await supabase
    .from("user_profile")
    .select(userProfileFields.join(","));
  if (error) throw error;
  return data.length ? data[0] : null;
};

export const getTwitterProfile = async (
  supabase: SupabaseClient,
  id: string
): Promise<any> => {
  const { data, error } = await supabase
    .from("twitter_profile")
    .select(twitterProfileFields.join(","))
    .eq("id", id);
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

const serializeTwitterProfile = (
  profile: TwitterResponse<findMyUser>["data"]
) => {
  return {
    id: profile.id,
    updated_at: new Date().toISOString(),

    username: profile.username,
    name: profile.name,
    user_created_at: profile.created_at,
    description: profile.description,
    entities: profile.entities,
    location: profile.location,
    pinned_tweet_id: profile.pinned_tweet_id,
    profile_image_url: profile.profile_image_url,
    protected: profile.protected,

    followers_count: profile.public_metrics.followers_count,
    following_count: profile.public_metrics.following_count,
    tweet_count: profile.public_metrics.tweet_count,
    listed_count: profile.public_metrics.listed_count,

    url: profile.url,
    verified: profile.verified,
    withheld: profile.withheld,
  };
};

export const upsertTwitterProfile = async (
  supabase: SupabaseClient,
  profile: TwitterResponse<findMyUser>["data"]
) => {
  const row = serializeTwitterProfile(profile);
  const { error } = await supabase.from("twitter_profile").upsert(row);
  if (error) throw error;
};
