import { Filters } from "../lib/utils/helpers";
import dayjs from "dayjs";
import axios from "axios";
import qs from "qs";
import { camelCase } from "lodash";

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

export const callSearchApi = async (filters: Filters) => {
  const response = await axios.get("/api/search", {
    params: filters,
    paramsSerializer: {
      serialize: (params) => {
        return qs.stringify(params, { arrayFormat: "repeat" });
      },
    },
  });
  const users = response.data.users;
  const camelCaseUsers = users.map((user) => {
    return Object.entries(user).reduce((prev, [key, value]) => {
      prev[camelCase(key)] = value;
      return prev;
    }, {});
  });
  const parsedUsers: TwitterUser[] = camelCaseUsers.map((x) => {
    return {
      ...x,
      id: BigInt(x.id),
      updatedAt: new Date(x.updatedAt),
      followersUpdatedAt: new Date(x.followersUpdatedAt),
      followingUpdatedAt: new Date(x.followingUpdatedAt),
      userCreatedAt: new Date(x.userCreatedAt),
    };
  });
  return parsedUsers;
};
