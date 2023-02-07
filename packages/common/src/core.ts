import {
  findTweetById,
  findUserByUsername,
  TwitterParams,
  TwitterResponse,
} from "twitter-api-sdk/dist/types";
import { joinStrings } from "./utils";

export const twitterUserFields: TwitterParams<findUserByUsername>["user.fields"] =
  [
    "created_at",
    "description",
    "location",
    "profile_image_url",
    "protected",
    "public_metrics",
    "url",
    "verified",
  ];

export const twitterProfileColumns = joinStrings(
  [
    "id::text",
    "created_at",
    "updated_at",
    "username",
    "name",
    "user_created_at",
    "description",
    "location",
    "profile_image_url",
    "protected",
    "followers_count",
    "following_count",
    "tweet_count",
    "listed_count",
    "verified",
  ] as const,
  ","
);

export const serializeTwitterUser = (
  user: TwitterResponse<findUserByUsername>["data"]
) =>
  JSON.parse(
    JSON.stringify({
      id: user.id,
      username: user.username,
      name: user.name,
      user_created_at: user.created_at,
      description: user.description,
      location: user.location ?? null,
      profile_image_url: user.profile_image_url,
      protected: user.protected,
      followers_count: user.public_metrics.followers_count,
      following_count: user.public_metrics.following_count,
      tweet_count: user.public_metrics.tweet_count,
      listed_count: user.public_metrics.listed_count,
      verified: user.verified,
      // Remove Unicode zero character because not supported by Postgres
    }).replaceAll("\\u0000", "")
  );

export const tweetFields: TwitterParams<findTweetById>["tweet.fields"] = [
  "created_at",
  "author_id",
  "context_annotations",
  "public_metrics",
];

export const tweetColumns = joinStrings(
  [
    "id::text",
    "created_at",
    "updated_at",
    "text",
    "author_id::text",
    "tweet_created_at",
    "retweet_count",
    "reply_count",
    "like_count",
    "quote_count",
  ] as const,
  ","
);

export const serializeTweet = (tweet: TwitterResponse<findTweetById>["data"]) =>
  JSON.parse(
    JSON.stringify({
      id: tweet.id,
      text: tweet.text,
      author_id: tweet.author_id,
      tweet_created_at: tweet.created_at,
      retweet_count: tweet.public_metrics.retweet_count,
      reply_count: tweet.public_metrics.reply_count,
      like_count: tweet.public_metrics.like_count,
      quote_count: tweet.public_metrics.quote_count,
      // Remove Unicode zero character because not supported by Postgres
    }).replaceAll("\\u0000", "")
  );

export const searchTwitterProfilesColumns = [...twitterProfileColumns];

export const campaignColumns = joinStrings(
  [
    "id",
    "name",
    "created_at",
    "updated_at",
    "user_id",
    "paused",
    "filters",
    // Pagination fields
    "pagination_started_at",
    "pagination_token",
    "latest_tweet_id::text",
    // Rate limit fields
    "last_run_at",
    "tweets_fetched_today",
  ] as const,
  ","
);

export const lookupRelationJobColumns = [
  "id",
  "created_at",
  "updated_at",
  "user_id",
  "relation",
  "target_id::text",
  "priority",
  "finished",
  "pagination_token",
  "updated_count",
  "paused",
];

export const jobNames = ["run-campaign"] as const;

export type JobName = typeof jobNames[number];
