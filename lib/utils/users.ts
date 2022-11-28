import { appendGeneralFilters, userApiFields } from "./helpers";
import { camelCase } from "lodash";
import { GeneralFilters, TwitterUser } from "./types";
import { getSupabaseClient, getTwitterClient } from "./clients";

const userSelectFields = [
  "id::text",
  "updated_at",
  "followers_updated_at",
  "following_updated_at",
  "username",
  "name",
  "followers_count",
  "following_count",
  "tweet_count",
  "description",
  "user_created_at",
  "profile_image_url",
];

// Fetch users from Twitter API and update DB cache
export const updateUsers = async (usernames: string[]) => {
  const twitter = getTwitterClient();
  const supabase = getSupabaseClient();

  console.log("Making request to findUsersByUsername.");
  const response = await twitter.users.findUsersByUsername({
    usernames,
    "user.fields": userApiFields,
  });

  const { error } = await supabase.from("twitter_user").upsert(
    response.data.map((x) => {
      return {
        username: x.username,
        id: x.id,
        name: x.name,
        followers_count: x.public_metrics.followers_count,
        following_count: x.public_metrics.following_count,
        tweet_count: x.public_metrics.tweet_count,
        description: x.description,
        user_created_at: x.created_at,
        updated_at: new Date().toISOString(),
        profile_image_url: x.profile_image_url,
      };
    })
  );
  if (error) throw error;
};

export const parseUsers = (users: any[]) => {
  const camelCaseUsers: any[] = users.map((user) => {
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

export const getUsersByUsernames = async (usernames: string[]) => {
  const supabase = getSupabaseClient();

  const { data: users, error: selectError } = await supabase
    .from("twitter_user")
    .select(userSelectFields.join(","))
    .in("username", usernames);
  if (selectError) throw selectError;

  return parseUsers(users);
};

export const getUsersByIds = async (
  ids: BigInt[],
  filters?: GeneralFilters
): Promise<TwitterUser[]> => {
  const supabase = getSupabaseClient();

  let query = supabase
    .from("twitter_user")
    .select(userSelectFields.join(","))
    .in(
      "id",
      ids.map((x) => x.toString())
    );
  query = appendGeneralFilters(query, filters);

  const { data: users, error: selectError } = await query;
  if (selectError) throw selectError;

  return parseUsers(users);
};

export const getUserIds = async (usernames: string[]) => {
  const supabase = getSupabaseClient();

  const { data: users, error: selectError } = await supabase
    .from("twitter_user")
    .select("id::text")
    .in("username", usernames);
  if (selectError) throw selectError;

  // @ts-ignore
  return users.map((x) => BigInt(x.id));
};
