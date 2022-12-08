import { findUserByUsername, TwitterParams } from "twitter-api-sdk/dist/types";

export type Filters = {
  followedBy?: string[];
  followerOf?: string[];
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
