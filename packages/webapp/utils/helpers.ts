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
  blockedByUser?: boolean;
  mutedByUser?: boolean;
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
