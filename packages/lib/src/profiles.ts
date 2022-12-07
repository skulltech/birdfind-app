import { camelCase } from "lodash";
import { Filters, TwitterProfile } from "./utils";
import { SupabaseClient } from "@supabase/supabase-js";

export const twitterProfileFields = [
  "id::text",
  "created_at",
  "updated_at",
  "followers_updated_at",
  "following_updated_at",
  "username",
  "name",
  "user_created_at",
  "description",
  "entities",
  "location",
  "pinned_tweet_id",
  "profile_image_url",
  "protected",
  "followers_count",
  "following_count",
  "tweet_count",
  "listed_count",
  "url",
  "verified",
  "withheld",
];

export const getTwitterProfile = async (
  supabase: SupabaseClient,
  id: string
): Promise<TwitterProfile> => {
  const { data, error } = await supabase
    .from("twitter_profile")
    .select(twitterProfileFields.join(","))
    .eq("id", id);
  if (error) throw error;

  return data.length ? parseTwitterProfiles(data)[0] : null;
};

export const parseTwitterProfiles = (rows: any[]): TwitterProfile[] => {
  const camelCaseRows: any[] = rows.map((row) => {
    return Object.entries(row).reduce((prev, [key, value]) => {
      prev[camelCase(key)] = value;
      return prev;
    }, {});
  });

  const parsedProfiles: TwitterProfile[] = camelCaseRows.map((x) => {
    return {
      ...x,
      id: BigInt(x.id),
      pinnedTweetId: x.pinnedTweetId ? BigInt(x.pinnedTweetId) : null,
      createdAt: new Date(x.createdAt),
      updatedAt: new Date(x.updatedAt),
      followersUpdatedAt: new Date(x.followersUpdatedAt),
      followingUpdatedAt: new Date(x.followingUpdatedAt),
      userCreatedAt: new Date(x.userCreatedAt),
    };
  });

  return parsedProfiles;
};

export const searchTwitterProfiles = async (
  supabase: SupabaseClient,
  filters: Filters
): Promise<TwitterProfile[]> => {
  const { followerOf, followedBy, ...generalFilters } = filters;
  let query = supabase
    .rpc("search_follow_network", {
      follower_of: filters.followerOf?.map((x: BigInt) => x.toString()) ?? [],
      followed_by: filters.followedBy.map((x: BigInt) => x.toString()) ?? [],
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
  };

  if (filters)
    for (const [key, value] of Object.entries(generalFilters))
      query = appendFilterFunctions[key](query, value);

  const { data: profiles, error } = await query;
  if (error) throw error;

  return parseTwitterProfiles(profiles);
};
