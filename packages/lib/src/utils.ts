import {
  findUserByUsername,
  TwitterParams,
  TwitterResponse,
} from "twitter-api-sdk/dist/types";

export type Filters = {
  followedBy?: BigInt[];
  followerOf?: BigInt[];
  followersCountLessThan?: number;
  followersCountGreaterThan?: number;
  followingCountLessThan?: number;
  followingCountGreaterThan?: number;
  tweetCountLessThan?: number;
  tweetCountGreaterThan?: number;
  createdBefore?: Date;
  createdAfter?: Date;
};

export type TwitterProfile = {
  id: BigInt;
  createdAt: Date;
  updatedAt: Date;
  followersUpdatedAt: Date;
  followingUpdatedAt: Date;
  username: string;
  name: string;
  userCreatedAt: Date;
  description: string;
  entities?: object;
  location?: string;
  pinnedTweetId?: BigInt;
  profileImageUrl: string;
  protected: boolean;
  followersCount: number;
  followingCount: number;
  tweetCount: number;
  listedCount: number;
  url?: string;
  verified: boolean;
  withheld?: object;
};

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
