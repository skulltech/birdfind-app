import dayjs from "dayjs";
import axios from "axios";
import qs from "qs";
import { camelCase } from "lodash";
import { Filters, TwitterUser } from "../lib/utils/types";

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

export const callSearchApi = async (filters: Filters) => {
  const response = await axios.get("/api/search", {
    params: filters,
    paramsSerializer: {
      serialize: (params) => {
        return qs.stringify(params, { arrayFormat: "repeat" });
      },
    },
  });

  if (response.status != 200) {
    throw Error(response.data.message);
  }

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
