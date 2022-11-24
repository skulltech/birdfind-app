import { createClient } from "@supabase/supabase-js";
import { Client } from "twitter-api-sdk";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

// Util functions
export const getTwitterClient = () =>
  new Client(process.env.TWITTER_BEARER_TOKEN);
export const getSupabaseClient = () =>
  createClient(process.env.SUPABASE_API_URL, process.env.SUPABASE_KEY);

// Take the intersection of set1 and set2
export const getIntersection = <T>(set1: Set<T>, set2?: Set<T>) => {
  if (set2) {
    const intersect = new Set<T>();
    for (const x of set1) if (set2.has(x)) intersect.add(x);
    return intersect;
  } else {
    return set1;
  }
};

export const dedupeUsers = (arr: any[]) => {
  const dedupedUsers = new Set<string>();

  return arr.filter((x) => {
    if (dedupedUsers.has(x.id)) return false;
    dedupedUsers.add(x.id);
    return true;
  });
};

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

export const appendGeneralFilters = (query, filters?: GeneralFilters) => {
  const {
    followersCountLessThan,
    followersCountGreaterThan,
    followingCountLessThan,
    followingCountGreaterThan,
    tweetCountLessThan,
    tweetCountGreaterThan,
    createdBefore,
    createdAfter,
  } = filters ?? {};

  if (followersCountLessThan)
    query = query.lt("followers_count", followersCountLessThan);
  if (followersCountGreaterThan)
    query = query.gt("followers_count", followersCountGreaterThan);
  if (followingCountLessThan)
    query = query.lt("following_count", followingCountLessThan);
  if (followingCountGreaterThan)
    query = query.gt("following_count", followingCountGreaterThan);
  if (tweetCountLessThan) query = query.lt("tweet_count", tweetCountLessThan);
  if (tweetCountGreaterThan)
    query = query.gt("following_count", tweetCountGreaterThan);
  if (createdBefore)
    query = query.lt("user_created_at", createdBefore.toISOString());
  if (createdAfter)
    query = query.gt("user_created_at", createdAfter.toISOString());

  return query;
};
