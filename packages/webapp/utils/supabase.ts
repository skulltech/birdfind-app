import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
  serializeTwitterUser,
  tweetColumns,
  twitterProfileColumns,
} from "@birdfind/common";
import camelCase from "camelcase";
import { TwitterResponse, usersIdFollowers } from "twitter-api-sdk/dist/types";
import {
  parseTweet,
  parseTwitterProfile,
  Tweet,
  TwitterProfile,
} from "./helpers";
import { Filters } from "../components/FilterForm/FilterForm";

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

export interface CampaignProfile extends TwitterProfile {}

export type ProfileSort =
  | "relevance"
  | "followersAscending"
  | "followersDescending"
  | "tweetsAscending"
  | "tweetsDescending"
  | "followingAscending"
  | "followingDescending";

export type TweetSort =
  | "ageAscending"
  | "ageDescending"
  | "likesAscending"
  | "likesDescending"
  | "repliesAscending"
  | "repliesDescending"
  | "retweetsAscending"
  | "retweetsDescending"
  | "quotesAscending"
  | "quotesDescending";

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

export const getCampaignProfiles = async ({
  supabase,
  campaignId,
  pageIndex,
  sort,
}: GetCampaignProfilesArgs): Promise<GetCampaignProfilesResult> => {
  // Get count
  let countQuery = supabase
    .rpc(
      "get_campaign_profiles",
      { campaign_id: campaignId },
      { count: "exact" }
    )
    .select("id");
  const { count } = await countQuery.throwOnError();

  // Get results
  let resultsQuery = supabase
    .rpc("get_campaign_profiles", { campaign_id: campaignId })
    .select(twitterProfileColumns);

  // Apply sort
  resultsQuery =
    sort == "followersAscending"
      ? (resultsQuery = resultsQuery.order("followers_count", {
          ascending: true,
        }))
      : sort == "followersDescending"
      ? (resultsQuery = resultsQuery.order("followers_count", {
          ascending: false,
        }))
      : sort == "tweetsAscending"
      ? (resultsQuery = resultsQuery.order("tweet_count", { ascending: true }))
      : sort == "tweetsDescending"
      ? (resultsQuery = resultsQuery.order("tweet_count", { ascending: false }))
      : sort == "followingAscending"
      ? (resultsQuery = resultsQuery.order("following_count", {
          ascending: true,
        }))
      : sort == "followingDescending"
      ? (resultsQuery = resultsQuery.order("following_count", {
          ascending: false,
        }))
      : resultsQuery;

  const { data } = await resultsQuery
    .range(100 * pageIndex, 100 * (pageIndex + 1) - 1)
    .throwOnError();

  return {
    count,
    results: data.map(parseTwitterProfile),
  };
};

// Get campaign tweets

type GetCampaignTweetsArgs = {
  supabase: SupabaseClient;
  campaignId: number;
  pageIndex: number;
};

type GetCampaignTweetsResults = {
  results: Tweet[];
  count: number;
};

export const getCampaignTweets = async ({
  supabase,
  campaignId,
  pageIndex,
}: GetCampaignTweetsArgs): Promise<GetCampaignTweetsResults> => {
  // Get count
  let countQuery = supabase
    .rpc(
      "get_campaign_profiles",
      { campaign_id: campaignId },
      { count: "exact" }
    )
    .select(twitterProfileColumns);
  const { count } = await countQuery.throwOnError();

  const { data } = await supabase
    .rpc("get_campaign_tweets", { campaign_id: campaignId })
    .select(tweetColumns)
    .range(100 * pageIndex, 100 * (pageIndex + 1) - 1)
    .throwOnError();

  return {
    count,
    results: data.map(parseTweet),
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
