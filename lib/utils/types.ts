import { TwitterResponse, usersIdFollowing } from "twitter-api-sdk/dist/types";

export type GeneralFilters = {
  followersCountLessThan?: number;
  followersCountGreaterThan?: number;
  followingCountLessThan?: number;
  followingCountGreaterThan?: number;
  tweetCountLessThan?: number;
  tweetCountGreaterThan?: number;
  createdBefore?: Date;
  createdAfter?: Date;
};

export interface Filters extends GeneralFilters {
  followedBy?: string[];
  followerOf?: string[];
}

export type TwitterUser = {
  id: BigInt;
  updatedAt: Date;
  followersUpdatedAt: Date;
  followingUpdatedAt: Date;
  username: string;
  name: string;
  followersCount: number;
  followingCount: number;
  tweetCount: number;
  description: string;
  userCreatedAt: Date;
  profileImageUrl: string;
};

export type ApiTwitterUser = TwitterResponse<usersIdFollowing>["data"][number];
