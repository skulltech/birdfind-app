import {
  IconReceipt2,
  IconSettings,
  IconSubtask,
  TablerIcon,
} from "@tabler/icons";
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
  searchText?: string;
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

type AccountMenuItem = {
  page: string;
  label: string;
  icon: TablerIcon;
};

export const accountMenuItems: AccountMenuItem[] = [
  { page: "settings", label: "Account Settings", icon: IconSettings },
  {
    page: "jobs",
    label: "Background Jobs",
    icon: IconSubtask,
  },
  {
    page: "subscription",
    label: "Billing and Subscription",
    icon: IconReceipt2,
  },
];

export const twitterListFields = [
  "created_at",
  "description",
  "follower_count",
  "member_count",
  "private",
];
