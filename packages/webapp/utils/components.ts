import dayjs from "dayjs";
import { Filters } from "@twips/lib";
import { SupabaseClient } from "@supabase/supabase-js";
import { getTwitterProfile, getUserProfile } from "./supabase";

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

export type UserDetails = {
  email: string;
  username?: string;
  profileImageUrl?: string;
};

export const getUserDetails = async (
  supabase: SupabaseClient
): Promise<UserDetails> => {
  const {
    data: { user: user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const userProfile = await getUserProfile(supabase);
  const twitterProfile = userProfile.twitter_id
    ? await getTwitterProfile(supabase, userProfile.twitter_id)
    : null;

  return {
    email: user.email,
    username: twitterProfile?.username,
    profileImageUrl: twitterProfile?.profile_image_url,
  };
};
