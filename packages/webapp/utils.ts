import dayjs from "dayjs";
import axios from "axios";
import qs from "qs";
import { Filters, TwitterUser } from "@twips/lib";
import { createClient } from "@supabase/supabase-js";

export type FlattenedFilter = [string, number | string | Date];

export type TwitterToken = {
  accessToken: string;
  profile: {
    profile_image_url: string;
    username: string;
    name: string;
    id: string;
  };
};

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

const parseUser = (user): TwitterUser => {
  return {
    ...user,
    id: BigInt(user.id),
    updatedAt: new Date(user.updatedAt),
    followersUpdatedAt: new Date(user.followersUpdatedAt),
    followingUpdatedAt: new Date(user.followingUpdatedAt),
    userCreatedAt: new Date(user.userCreatedAt),
  };
};

export const apiUserSearch = async (filters: Filters) => {
  const response = await axios.get("/api/user/search", {
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

  const users: TwitterUser[] = response.data.users.map(parseUser);
  return users;
};

export const apiUserLookup = async (username: string) => {
  const response = await axios.get("/api/user/lookup", {
    params: { username: username },
  });

  if (response.status != 200) {
    throw Error(response.data.message);
  }

  // Check if user doesn't exist
  if (!response.data.user) {
    return null;
  }

  return parseUser(response.data.user);
};

export const apiUserUpdate = async (
  userId: BigInt,
  direction: "followers" | "following"
) => {
  const response = await axios.get("/api/user/update", {
    params: { userId: userId.toString(), direction },
  });
  return response.status;
};

// Get the user linked with an oauth account
export const getUserByOauthAccount = async (providerAccountId: string) => {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { db: { schema: "next_auth" } }
  );
  const { data, error } = await supabase
    .from("accounts")
    .select("*")
    .eq("providerAccountId", providerAccountId);
  if (error) throw error;

  return data.length ? data[0] : null;
};

// Get the Oauth account linked with user
export const getOauthAccountByUser = async (
  userId: string,
  provider: string
) => {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { db: { schema: "next_auth" } }
  );
  const { data, error } = await supabase
    .from("accounts")
    .select("*")
    .eq("userId", userId)
    .eq("provider", provider);
  if (error) throw error;

  return data.length ? data[0] : null;
};
