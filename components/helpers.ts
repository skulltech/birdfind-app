import { Filters } from "../lib/utils/helpers";

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

export const renderFilter = (filter: FlattenedFilter): string => {
  if (filter[0] == "followedBy") return "Followed by @" + filter[1];
  if (filter[0] == "followerOf") return "Follower of @" + filter[1];

  if (filter[0] == "followersCountLessThan")
    return "Followers count <" + filter[1].toString();
  if (filter[0] == "followersCountGreaterThan")
    return "Followers count >" + filter[1].toString();

  if (filter[0] == "followingCountLessThan")
    return "Following count <" + filter[1].toString();
  if (filter[0] == "followingCountGreaterThan")
    return "Following count >" + filter[1].toString();

  if (filter[0] == "tweetCountLessThan")
    return "Tweet count <" + filter[1].toString();
  if (filter[0] == "tweetCountGreaterThan")
    return "Tweet count >" + filter[1].toString();

  if (filter[0] == "createdBefore")
    // @ts-ignore
    return "Created before " + filter[1].toDateString()();
  if (filter[0] == "createdAfter")
    // @ts-ignore
    return "Created after " + filter[1].toDateString()();
};
