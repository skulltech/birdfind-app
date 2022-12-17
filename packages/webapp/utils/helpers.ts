import camelcase from "camelcase";
import { z } from "zod";

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
  blockedBy?: string[];
  mutedBy?: string[];
};

export interface FilterInputProps {
  label: string;
}

// Custom bigint Zod type
export const zodBigint = z.string().refine((x) => {
  try {
    BigInt(x);
    return true;
  } catch (error) {
    return false;
  }
});

export const actions = [
  "follow",
  "unfollow",
  "block",
  "unblock",
  "mute",
  "unmute",
] as const;

export type Action = typeof actions[number];

export const parseTwitterProfile = (row: any): TwitterProfile => {
  const x: any = Object.entries(row).reduce((prev, [key, value]) => {
    prev[camelcase(key)] = value;
    return prev;
  }, {});

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
};

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
