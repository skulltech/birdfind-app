import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
  JobName,
  serializeTwitterUser,
  twitterProfileColumns,
} from "@twips/common";
import camelCase from "camelcase";
import { TwitterResponse, usersIdFollowers } from "twitter-api-sdk/dist/types";
import { parseTwitterProfile, TwitterProfile, Filters, Job } from "./helpers";

export const getServiceRoleSupabase = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

const userProfileFields = [
  "id",
  "twitter_oauth_state",
  "twitter_oauth_token",
  "twitter_id::text",
];

const userDetailsFields = [
  "id",
  "email",
  "twitter_id::text",
  "twitter_username",
  "twitter_oauth_token",
  "twitter_profile_image_url",
  "twitter_name",
];

export type List = {
  id: BigInt;
  name: string;
};

export type UserDetails = {
  id: string;
  email: string;
  twitter: {
    id: BigInt;
    username: string;
    profileImageUrl: string;
    oauthToken: any;
    name: string;
  } | null;
};

const parseUserDetails = (row: any) => {
  const camelCaseRow: any = Object.entries(row).reduce((prev, [key, value]) => {
    prev[camelCase(key)] = value;
    return prev;
  }, {});

  return {
    id: camelCaseRow.id,
    email: camelCaseRow.email,
    twitter: camelCaseRow.twitterId
      ? {
          id: BigInt(camelCaseRow.twitterId),
          username: camelCaseRow.twitterUsername,
          profileImageUrl: camelCaseRow.twitterProfileImageUrl,
          oauthToken: camelCaseRow.twitterOauthToken,
          name: camelCaseRow.twitterName,
        }
      : null,
  };
};

export const getUserProfile = async (
  supabase: SupabaseClient
): Promise<any> => {
  const { data } = await supabase
    .from("user_profile")
    .select(userProfileFields.join(","))
    .throwOnError();
  return data.length ? data[0] : null;
};

export const startOauthFlow = async (
  supabase: SupabaseClient,
  state: string,
  challenge: string
) => {
  const {
    data: { user: user },
  } = await supabase.auth.getUser();

  await supabase
    .from("user_profile")
    .update({ twitter_oauth_state: { state, challenge } })
    .eq("id", user.id)
    .throwOnError();
};

export const completeOauthFlow = async (
  supabase: SupabaseClient,
  userId: string,
  twitterId: string,
  oauthToken: any
) => {
  // Check if someone has this Twitter account linked already
  const { count } = await supabase
    .from("user_profile")
    .select("*", { count: "exact", head: true })
    .eq("twitter_id", twitterId)
    .throwOnError();

  // If yes, then remove that link
  if (count)
    await supabase
      .from("user_profile")
      .update({ twitter_oauth_token: null, twitter_id: null })
      .eq("twitter_id", twitterId)
      .throwOnError();

  // Link twitter to the new account
  await supabase
    .from("user_profile")
    .update({
      twitter_oauth_state: null,
      twitter_oauth_token: oauthToken,
      twitter_id: twitterId,
    })
    .eq("id", userId)
    .throwOnError();
};

export const getUserDetails = async (
  supabase: SupabaseClient
): Promise<UserDetails> => {
  const { data } = await supabase
    .rpc("get_user_details")
    .select(userDetailsFields.join(","))
    .throwOnError();
  // @ts-ignore
  return data.length ? parseUserDetails(data[0]) : null;
};

export interface SearchResult extends TwitterProfile {
  isFollowing: boolean;
  isFollower: boolean;
  isBlocked: boolean;
  isMuted: boolean;
}

type searchTwitterProfilesArgs = {
  supabase: SupabaseClient;
  userTwitterId: BigInt;
  filters: Filters;
  pageIndex: number;
};

type SearchTwitterProfilesResult = {
  results: SearchResult[];
  count: number;
};

export const searchTwitterProfiles = async ({
  supabase,
  userTwitterId,
  filters,
  pageIndex,
}: searchTwitterProfilesArgs): Promise<SearchTwitterProfilesResult> => {
  const {
    followerOf: followerOfSet,
    followedBy: followedBySet,
    blockedByMe,
    mutedByMe,
    ...otherFilters
  } = filters;
  const blockedBy = blockedByMe ? [userTwitterId] : null;
  const mutedBy = mutedByMe ? [userTwitterId] : null;
  const followerOf = followerOfSet ? Array.from(followerOfSet) : null;
  const followedBy = followedBySet ? Array.from(followedBySet) : null;

  const appendFilterFunctions: Record<
    keyof typeof otherFilters,
    (query: any, value: any) => any
  > = {
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
    searchText: (query, value: string) =>
      query.ilike("concat(username,name,description)", `%${value}%`),
  };

  // Get count

  let countQuery = supabase
    .rpc(
      "search_twitter_profiles",
      {
        follower_of: followerOf,
        followed_by: followedBy,
        blocked_by: blockedBy,
        muted_by: mutedBy,
      },
      { count: "exact" }
    )
    .select("id");

  for (const [key, value] of Object.entries(otherFilters))
    countQuery = appendFilterFunctions[key](countQuery, value);

  const { count } = await countQuery.throwOnError();

  // Get results

  let resultsQuery = supabase
    .rpc("search_twitter_profiles", {
      reference_user: userTwitterId,
      follower_of: followerOf,
      followed_by: followedBy,
      blocked_by: blockedBy,
      muted_by: mutedBy,
    })
    .select(
      [
        ...twitterProfileColumns,
        "is_follower",
        "is_following",
        "is_blocked",
        "is_muted",
      ].join(",")
    );

  for (const [key, value] of Object.entries(otherFilters))
    resultsQuery = appendFilterFunctions[key](resultsQuery, value);

  const { data } = await resultsQuery
    .order("updated_at", { ascending: true })
    .order("id", { ascending: true })
    .range(100 * pageIndex, 100 * (pageIndex + 1) - 1)
    .throwOnError();

  // Insert event in user_event table
  await insertUserEvent(supabase, "search-filters", filters);

  const results = data.map((x: any) => {
    return {
      ...parseTwitterProfile(x),
      isFollower: x.is_follower,
      isFollowing: x.is_following,
      isBlocked: x.is_blocked,
      isMuted: x.is_muted,
    };
  });

  return {
    count,
    results,
  };
};

export const upsertTwitterProfile = async (
  supabase: SupabaseClient,
  user: TwitterResponse<usersIdFollowers>["data"][number]
) => {
  const { data } = await supabase
    .from("twitter_profile")
    .upsert(serializeTwitterUser(user))
    .select(twitterProfileColumns.join(","))
    .throwOnError();

  return parseTwitterProfile(data[0]);
};

export const insertUserEvent = async (
  supabase: SupabaseClient,
  type: string,
  data: object
) => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  await supabase
    .from("user_event")
    .insert({ user_id: user.id, type, data })
    .throwOnError();
};

const parseManageListMembersJob = (job: any, rateLimits: RateLimit[]): Job => {
  const rateLimitResetsAtStr = rateLimits.filter(
    (x) => x.endpoint == `${job.add ? "add" : "remove"}-list-members`
  )[0]?.resets_at;
  const rateLimitResetsAt = rateLimitResetsAtStr
    ? new Date(rateLimitResetsAtStr)
    : null;

  return {
    id: parseInt(job.id),
    name: "manage-list-members",
    label: `Add ${job.member_ids.length} users to list "${job.twitter_list.name}"`,
    createdAt: new Date(job.created_at),
    paused: job.paused,
    progress: (job.member_ids_done.length / job.member_ids.length) * 100,
    rateLimitResetsAt,
    add: job.add,
  };
};

const parseManageRelationJob = (job: any, rateLimits: RateLimit[]): Job => {
  const rateLimitResetsAtStr = rateLimits.filter(
    (x) => x.endpoint == `${job.add ? "add" : "remove"}-${job.relation}`
  )[0]?.resets_at;
  const rateLimitResetsAt = rateLimitResetsAtStr
    ? new Date(rateLimitResetsAtStr)
    : null;

  return {
    id: parseInt(job.id),
    name: "manage-relation",
    label: `${
      job.relation == "follow"
        ? job.add
          ? "Follow"
          : "Unfollow"
        : job.relation == "block"
        ? job.add
          ? "Block"
          : "Unblock"
        : job.relation == "mute"
        ? job.add
          ? "Mute"
          : "Unmute"
        : null
    } ${job.target_ids.length} users`,
    createdAt: new Date(job.created_at),
    paused: job.paused,
    progress: (job.target_ids_done.length / job.target_ids.length) * 100,
    rateLimitResetsAt,
    relation: job.relation,
    add: job.add,
  };
};

type RateLimit = {
  endpoint: string;
  resets_at: Date;
};

const getAllRateLimits = async (supabase: SupabaseClient) => {
  const { data } = await supabase
    .from("twitter_api_rate_limit")
    .select("endpoint,resets_at")
    .throwOnError();
  return data;
};

const parseLookupRelationJob = (job: any, rateLimits: RateLimit[]): Job => {
  const updatedCount: number = job.updated_count;
  const totalCount: number =
    job.relation === "followers"
      ? job.twitter_profile.followers_count
      : job.relation === "following"
      ? job.twitter_profile.following_count
      : null;
  const rateLimitResetsAtStr = rateLimits.filter(
    (x) => x.endpoint == `lookup-${job.relation}`
  )[0]?.resets_at;
  const rateLimitResetsAt = rateLimitResetsAtStr
    ? new Date(rateLimitResetsAtStr)
    : null;

  return {
    id: parseInt(job.id),
    name: "lookup-relation",
    label: `Fetch ${
      job.relation == "blocking"
        ? "blocklist"
        : job.relation == "muting"
        ? "mutelist"
        : job.relation
    } of @${job.twitter_profile.username}`,
    createdAt: new Date(job.created_at),
    paused: job.paused,
    totalCount,
    relation: job.relation,
    username: job.twitter_profile.username,
    progress: totalCount ? (updatedCount / totalCount) * 100 : null,
    rateLimitResetsAt,
  };
};

const lookupRelationJobColumns = `id,created_at,paused,relation,updated_count,finished,
  twitter_profile (username,followers_count,following_count)`;
const manageListMembersJobColumns =
  "id,created_at,paused,add,member_ids,member_ids_done,twitter_list(name)";
const manageRelationJobColumns =
  "id,created_at,relation,add,paused,target_ids,target_ids_done";

export const getJob = async (
  supabase: SupabaseClient,
  name: JobName,
  id: number
): Promise<Job> => {
  const rateLimits = await getAllRateLimits(supabase);
  switch (name) {
    case "lookup-relation": {
      const { data } = await supabase
        .from("lookup_relation_job")
        .select(lookupRelationJobColumns)
        .eq("id", id)
        .throwOnError()
        .maybeSingle();
      return data ? parseLookupRelationJob(data, rateLimits) : null;
    }
    case "manage-list-members": {
      const { data } = await supabase
        .from("manage_list_members_job")
        .select(manageListMembersJobColumns)
        .eq("id", id)
        .throwOnError()
        .maybeSingle();
      return data ? parseManageListMembersJob(data, rateLimits) : null;
    }
    case "manage-relation": {
      const { data } = await supabase
        .from("manage_relation_job")
        .select(manageRelationJobColumns)
        .eq("id", id)
        .throwOnError()
        .maybeSingle();
      return data ? parseManageRelationJob(data, rateLimits) : null;
    }
  }
};

export const getAllJobs = async (supabase: SupabaseClient): Promise<Job[]> => {
  // Lookup relation jobs
  const { data: lookupRelationJobs } = await supabase
    .from("lookup_relation_job")
    .select(lookupRelationJobColumns)
    .eq("finished", false)
    .eq("deleted", false)
    .order("created_at", { ascending: false })
    .throwOnError();

  // Manage list members jobs
  const { data: manageListMembersJobs } = await supabase
    .from("manage_list_members_job")
    .select(manageListMembersJobColumns)
    .eq("finished", false)
    .eq("deleted", false)
    .order("created_at", { ascending: false })
    .throwOnError();

  // Manage relation jobs
  const { data: manageRelationJobs } = await supabase
    .from("manage_relation_job")
    .select(manageRelationJobColumns)
    .eq("finished", false)
    .eq("deleted", false)
    .order("created_at", { ascending: false })
    .throwOnError();

  // Get all rate limits
  const rateLimits = await getAllRateLimits(supabase);

  return [
    ...lookupRelationJobs.map((job) => parseLookupRelationJob(job, rateLimits)),
    ...manageListMembersJobs.map((job) =>
      parseManageListMembersJob(job, rateLimits)
    ),
    ...manageRelationJobs.map((job) => parseManageRelationJob(job, rateLimits)),
  ];
};
