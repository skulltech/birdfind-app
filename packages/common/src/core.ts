import {
  findUserByUsername,
  TwitterParams,
  TwitterResponse,
} from "twitter-api-sdk/dist/types";

export const relations = [
  "followers",
  "following",
  "blocking",
  "muting",
] as const;
export type Relation = typeof relations[number];

export const twitterUserFields: TwitterParams<findUserByUsername>["user.fields"] =
  [
    "created_at",
    "description",
    "entities",
    "location",
    "pinned_tweet_id",
    "profile_image_url",
    "protected",
    "public_metrics",
    "url",
    "verified",
    "withheld",
  ];

export const twitterProfileFields = [
  "id::text",
  "created_at",
  "updated_at",
  "followers_updated_at",
  "following_updated_at",
  "muting_updated_at",
  "blocking_updated_at",
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

export const serializeTwitterUser = (
  user: TwitterResponse<findUserByUsername>["data"]
) => {
  return {
    id: user.id,
    updated_at: new Date().toISOString(),
    username: user.username,
    name: user.name,
    user_created_at: user.created_at,
    description: user.description,
    entities: user.entities ?? null,
    location: user.location ?? null,
    pinned_tweet_id: user.pinned_tweet_id ?? null,
    profile_image_url: user.profile_image_url,
    protected: user.protected,
    followers_count: user.public_metrics.followers_count,
    following_count: user.public_metrics.following_count,
    tweet_count: user.public_metrics.tweet_count,
    listed_count: user.public_metrics.listed_count,
    url: user.url ?? null,
    verified: user.verified,
    withheld: user.withheld ?? null,
  };
};

export const updateRelationJobColumns = [
  "id",
  "created_at",
  "updated_at",
  "user_id",
  "relation",
  "target_twitter_id::text",
  "priority",
  "finished",
  "pagination_token",
  "updated_count",
  "paused",
];
