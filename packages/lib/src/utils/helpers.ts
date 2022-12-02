import { PostgrestFilterBuilder } from "@supabase/postgrest-js";
import { findUsersById, TwitterParams } from "twitter-api-sdk/dist/types";
import { GeneralFilters } from "./types";

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

export const userApiFields: TwitterParams<findUsersById>["user.fields"] = [
  "created_at",
  "public_metrics",
  "description",
  "location",
  "profile_image_url",
];

export const dedupeUsers = <T extends { id: string }>(arr: T[]) => {
  const dedupedUsers = new Set<string>();

  return arr.filter((x) => {
    if (dedupedUsers.has(x.id)) return false;
    dedupedUsers.add(x.id);
    return true;
  });
};

export const appendGeneralFilters = (
  query: PostgrestFilterBuilder<any, any, any>,
  filters?: GeneralFilters
): PostgrestFilterBuilder<any, any, any> => {
  const appendFilterFunctions = {
    followersCountLessThan: (query, value: number) =>
      query.lt("followers_count", value),
    followersCountGreaterThan: (query, value: number) =>
      query.gt("followers_count", value),
    followingCountLessThan: (query, value: number) =>
      query.lt("following_count", value),
    followingCountGreaterThan: (query, value: number) =>
      query.gt("following_count", value),
    tweetCountLessThan: (query, value: number) =>
      query.lt("tweet_count", value),
    tweetCountGreaterThan: (query, value: number) =>
      query.gt("following_count", value),
    createdBefore: (query, value: Date) =>
      query.lt("user_created_at", value.toISOString()),
    createdAfter: (query, value: Date) =>
      query.gt("user_created_at", value.toISOString()),
  };

  if (filters)
    for (const [key, value] of Object.entries(filters)) {
      query = appendFilterFunctions[key](query, value);
    }

  return query;
};
