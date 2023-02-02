import {
  joinStrings,
  serializeTwitterUser,
  twitterProfileColumns,
} from "@birdfind/common";
import { SupabaseClient } from "@supabase/supabase-js";
import { TwitterResponse, usersIdFollowers } from "twitter-api-sdk/dist/types";

export type CampaignProfile = {
  id: BigInt;
  username: string;
  name: string;
  userCreatedAt: Date;
  description: string;
  profileImageUrl: string;
  followersCount: number;
  followingCount: number;
  tweetCount: number;
  listedCount: number;
};

export const parseCampaignProfile = (row: any): CampaignProfile => {
  return {
    id: BigInt(row.id),
    userCreatedAt: new Date(row.user_created_at),
    username: row.username,
    name: row.name,
    description: row.description,
    profileImageUrl: row.profile_image_url,
    followersCount: row.followers_count,
    followingCount: row.following_count,
    tweetCount: row.tweet_count,
    listedCount: row.listed_count,
  };
};

export type ProfileSort =
  | "followersAscending"
  | "followersDescending"
  | "tweetsAscending"
  | "tweetsDescending"
  | "followingAscending"
  | "followingDescending"
  | "listedAscending"
  | "listedDescending"
  | "ageAscending"
  | "ageDescending";

type GetCampaignProfilesArgs = {
  supabase: SupabaseClient;
  campaignId: number;
  pageIndex: number;
  sort: ProfileSort;
};

type GetCampaignProfilesResult = {
  results: CampaignProfile[];
  count: number;
};

const applySort = (query: any, sort: ProfileSort) => {
  switch (sort) {
    case "followersAscending":
      return query.order("followers_count", { ascending: true });
    case "followersDescending":
      return query.order("followers_count", { ascending: false });
    case "tweetsAscending":
      return query.order("tweet_count", { ascending: true });
    case "tweetsDescending":
      return query.order("tweet_count", { ascending: false });
    case "followingAscending":
      return query.order("following_count", { ascending: true });
    case "followingDescending":
      return query.order("following_count", { ascending: false });
    case "listedAscending":
      return query.order("listed_count", { ascending: true });
    case "listedDescending":
      return query.order("listed_count", { ascending: false });
    case "ageAscending":
      return query.order("user_created_at", { ascending: true });
    case "ageDescending":
      return query.order("user_created_at", { ascending: false });
    default:
      return query;
  }
};

const campaignProfileColumns = joinStrings(
  [
    "id::text",
    "username",
    "name",
    "user_created_at",
    "description",
    "profile_image_url",
    "followers_count",
    "following_count",
    "tweet_count",
    "listed_count",
  ] as const,
  ","
);

export const getCampaignProfiles = async ({
  supabase,
  campaignId,
  pageIndex,
  sort,
}: GetCampaignProfilesArgs): Promise<GetCampaignProfilesResult> => {
  // Get count
  const { count } = await supabase
    .rpc(
      "get_campaign_profiles",
      { campaign_id: campaignId },
      { count: "exact" }
    )
    .select("id")
    .throwOnError();

  // Get results
  let resultsQuery = supabase
    .rpc("get_campaign_profiles", { campaign_id: campaignId })
    .select(campaignProfileColumns);
  resultsQuery = applySort(resultsQuery, sort);
  const { data } = await resultsQuery
    .range(100 * pageIndex, 100 * (pageIndex + 1) - 1)
    .throwOnError();

  return {
    count,
    results: data.map(parseCampaignProfile),
  };
};

export const upsertTwitterProfile = async (
  supabase: SupabaseClient,
  user: TwitterResponse<usersIdFollowers>["data"][number]
) => {
  await supabase
    .from("twitter_profile")
    .upsert(serializeTwitterUser(user))
    .select(twitterProfileColumns)
    .throwOnError();
};
