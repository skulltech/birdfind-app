import { serializeTwitterUser, twitterProfileColumns } from "@birdfind/common";
import { SupabaseClient } from "@supabase/supabase-js";
import { TwitterResponse, usersIdFollowers } from "twitter-api-sdk/dist/types";

export type TwitterProfile = {
  id: BigInt;
  username: string;
  name: string;
  userCreatedAt: Date;
  description: string;
  location?: string;
  profileImageUrl: string;
  protected: boolean;
  followersCount: number;
  followingCount: number;
  tweetCount: number;
  listedCount: number;
  verified: boolean;
};

export const parseTwitterProfile = (row: any): TwitterProfile => {
  return {
    id: BigInt(row.id),
    userCreatedAt: new Date(row.user_created_at),
    username: row.username,
    name: row.name,
    description: row.description,
    location: row.location,
    profileImageUrl: row.profile_image_url,
    protected: row.protected,
    followersCount: row.followers_count,
    followingCount: row.following_count,
    tweetCount: row.tweet_count,
    listedCount: row.listed_count,
    verified: row.verified,
  };
};

export interface CampaignProfile extends TwitterProfile {}

export type ProfileSort =
  | "relevance"
  | "followersAscending"
  | "followersDescending"
  | "tweetsAscending"
  | "tweetsDescending"
  | "followingAscending"
  | "followingDescending";

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
    default:
      return query;
  }
};

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
    .select(twitterProfileColumns);
  resultsQuery = applySort(resultsQuery, sort);
  const { data } = await resultsQuery
    .range(100 * pageIndex, 100 * (pageIndex + 1) - 1)
    .throwOnError();

  return {
    count,
    results: data.map(parseTwitterProfile),
  };
};

export const upsertTwitterProfile = async (
  supabase: SupabaseClient,
  user: TwitterResponse<usersIdFollowers>["data"][number]
) => {
  const { data } = await supabase
    .from("twitter_profile")
    .upsert(serializeTwitterUser(user))
    .select(twitterProfileColumns)
    .throwOnError();

  return parseTwitterProfile(data[0]);
};
