import dayjs from "dayjs";
import { Filters } from "@twips/lib";

export type FlattenedFilter = [string, number | string | Date];

export const flattenFilters = (filters: Filters) => {
  const { followedBy, followerOf, ...generalFilters } = filters;
  const flattenedFilters: FlattenedFilter[] = Object.entries(generalFilters);
  if (followedBy)
    // @ts-ignore
    flattenedFilters.push(...followedBy.map((x) => ["followedBy", x]));
  if (followerOf)
    // @ts-ignore
    flattenedFilters.push(...followerOf.map((x) => ["followerOf", x]));
  return flattenedFilters;
};

export const usernameFilters = ["followerOf", "followedBy"];
export const numberFilters = [
  "followersCountLessThan",
  "followersCountGreaterThan",
  "followingCountLessThan",
  "followingCountGreaterThan",
  "tweetCountLessThan",
  "tweetCountGreaterThan",
];
export const dateFilters = ["createdBefore", "createdAfter"];

export const renderFilter = (filter: FlattenedFilter): string => {
  const renderFunctions = {
    followedBy: (x: string) => "Followed by @" + x,
    followerOf: (x: string) => "Follower of @" + x,
    followersCountLessThan: (x: number) => "Followers count <" + x.toString(),
    followersCountGreaterThan: (x: number) =>
      "Followers count >" + x.toString(),
    followingCountLessThan: (x: number) => "Following count <" + x.toString(),
    followingCountGreaterThan: (x: number) =>
      "Following count >" + x.toString(),
    tweetCountLessThan: (x: number) => "Tweet count <" + x.toString(),
    tweetCountGreaterThan: (x: number) => "Tweet count >" + x.toString(),
    createdBefore: (x: Date) =>
      "Created before " + dayjs(x).format("DD MMM YYYY"),
    createdAfter: (x: Date) =>
      "Created after " + dayjs(x).format("DD MMM YYYY"),
  };

  return renderFunctions[filter[0]](filter[1]);
};

export const isBigIntish = (arg: string) => {
  try {
    BigInt(arg);
    return true;
  } catch (error) {
    return false;
  }
};
