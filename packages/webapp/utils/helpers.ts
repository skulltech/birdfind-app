import camelcase from "camelcase";
import { NextApiRequest } from "next";
import { z } from "zod";
import { RemoveFiltersArg } from "../pages/search";

export type Filters = {
  followersCountLessThan?: number;
  followersCountGreaterThan?: number;
  followingCountLessThan?: number;
  followingCountGreaterThan?: number;
  tweetCountLessThan?: number;
  tweetCountGreaterThan?: number;
  createdBefore?: Date;
  createdAfter?: Date;
  searchText?: string;
};

export type Query = ["followedBy", string] | ["followerOf", string];
export type Queries = Query[];

export interface FilterProps {
  filters: Filters;
  addFilters: (arg: Filters) => void;
  removeFilters: (...arg: RemoveFiltersArg[]) => void;
}

export interface FilterInputProps extends FilterProps {
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
    blockingUpdatedAt: new Date(x.blockingUpdatedAt),
    mutingUpdatedAt: new Date(x.mutingUpdatedAt),
    userCreatedAt: new Date(x.userCreatedAt),
  };
};

export type TwitterProfile = {
  id: BigInt;
  createdAt: Date;
  updatedAt: Date;
  followersUpdatedAt: Date;
  followingUpdatedAt: Date;
  blockingUpdatedAt: Date;
  mutingUpdatedAt: Date;
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

export const twitterListFields = [
  "created_at",
  "description",
  "follower_count",
  "member_count",
  "private",
];

interface CommonJob {
  id: number;
  createdAt: Date;
  label: string;
  paused: boolean;
  rateLimitResetsAt?: Date;
}

export interface LookupRelationJob extends CommonJob {
  name: "lookup-relation";
  relation: "followers" | "following" | "muting" | "blocking";
  username: string;
  totalCount?: number;
  progress?: number;
}

export interface ManageRelationJob extends CommonJob {
  name: "manage-relation";
  relation: "follow" | "block" | "mute";
  add: boolean;
  progress: number;
}

export interface ManageListMembersJob extends CommonJob {
  name: "manage-list-members";
  add: boolean;
  progress: number;
}

export type Job = LookupRelationJob | ManageRelationJob | ManageListMembersJob;

function isLocalNetwork(hostname = window.location.host) {
  return (
    hostname.startsWith("localhost") ||
    hostname.startsWith("127.0.0.1") ||
    hostname.startsWith("192.168.") ||
    hostname.startsWith("10.0.") ||
    hostname.endsWith(".local")
  );
}

export const getOrigin = (req: NextApiRequest) => {
  const host = req.headers.host;
  const protocol = isLocalNetwork(host) ? "http:" : "https:";
  return protocol + "//" + host;
};
