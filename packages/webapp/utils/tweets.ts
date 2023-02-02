import { joinStrings } from "@birdfind/common";
import { SupabaseClient } from "@supabase/supabase-js";

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

export type CampaignTweet = {
  id: BigInt;
  text: string;
  tweetCreatedAt: Date;
  retweetCount: number;
  replyCount: number;
  likeCount: number;
  quoteCount: number;
  author: {
    id: BigInt;
    name: string;
    username: string;
    profileImageUrl: string;
  };
};

export const parseCampaignTweet = (row: any): CampaignTweet => {
  return {
    id: BigInt(row.id),
    tweetCreatedAt: new Date(row.tweet_created_at),
    text: row.text,
    retweetCount: row.retweet_count,
    replyCount: row.reply_count,
    likeCount: row.like_count,
    quoteCount: row.quote_count,
    author: {
      id: BigInt(row.author_id),
      name: row.author_name,
      username: row.author_username,
      profileImageUrl: row.author_profile_image_url,
    },
  };
};

// Get campaign tweets

type GetCampaignTweetsArgs = {
  supabase: SupabaseClient;
  campaignId: number;
  pageIndex: number;
  sort: TweetSort;
};

type GetCampaignTweetsResults = {
  results: CampaignTweet[];
  count: number;
};

const campaignTweetColumns = joinStrings(
  [
    "id::text",
    "text",
    "author_id::text",
    "tweet_created_at",
    "retweet_count",
    "reply_count",
    "like_count",
    "quote_count",
    "author_name",
    "author_username",
    "author_profile_image_url",
  ] as const,
  ","
);

const applySort = (query: any, sort: TweetSort) => {
  switch (sort) {
    case "ageAscending":
      return query.order("tweet_created_at", { ascending: true });
    case "ageDescending":
      return query.order("tweet_created_at", { ascending: false });
    case "likesAscending":
      return query.order("like_count", { ascending: true });
    case "likesDescending":
      return query.order("like_count", { ascending: false });
    case "repliesAscending":
      return query.order("reply_count", { ascending: true });
    case "repliesDescending":
      return query.order("reply_count", { ascending: false });
    case "retweetsAscending":
      return query.order("retweet_count", { ascending: true });
    case "retweetsDescending":
      return query.order("retweet_count", { ascending: false });
    case "quotesAscending":
      return query.order("quote_count", { ascending: true });
    case "quotesDescending":
      return query.order("quote_count", { ascending: false });
    default:
      return query;
  }
};

export const getCampaignTweets = async ({
  supabase,
  campaignId,
  pageIndex,
  sort,
}: GetCampaignTweetsArgs): Promise<GetCampaignTweetsResults> => {
  // Get count
  const { count } = await supabase
    .rpc("get_campaign_tweets", { campaign_id: campaignId }, { count: "exact" })
    .select("id")
    .throwOnError();

  // Get data
  let resultsQuery = supabase
    .rpc("get_campaign_tweets", { campaign_id: campaignId })
    .select(campaignTweetColumns);
  resultsQuery = applySort(resultsQuery, sort);
  const { data } = await resultsQuery
    .range(100 * pageIndex, 100 * (pageIndex + 1) - 1)
    .throwOnError();

  return {
    count,
    results: data.map(parseCampaignTweet),
  };
};
