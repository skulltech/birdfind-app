import {
  defaultCacheTimeout,
  getSupabaseClient,
  getTwitterClient,
} from "./helpers";

// Fetch users from Twitter API and update DB cache
export const updateUsers = async (usernames: string[]) => {
  const twitter = getTwitterClient();
  const supabase = getSupabaseClient();

  const response = await twitter.users.findUsersByUsername({
    usernames,
    "user.fields": [
      "created_at",
      "public_metrics",
      "description",
      "location",
      "profile_image_url",
    ],
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
        user_updated_at: new Date().toISOString(),
      };
    })
  );
  if (error) throw error;
};

export const getCacheStatusOfUsers = async (usernames: string[]) => {
  const supabase = getSupabaseClient();

  // Fetch cached users
  const { data: cachedUsers, error: selectCachedError } = await supabase
    .from("twitter_user")
    .select("username,user_updated_at")
    .in("username", usernames);
  if (selectCachedError) throw selectCachedError;

  // Check if cached users exists and the cache has not expired
  const usersToFetch = usernames.filter(
    (username) =>
      !cachedUsers
        .map((user) => {
          return Date.now() - Date.parse(user.user_updated_at) <=
            defaultCacheTimeout
            ? user.username
            : null;
        })
        .includes(username)
  );
};

// Fetch users from DB cache
export const getUsersFromCache = async (usernames: string[]) => {
  const supabase = getSupabaseClient();

  const { data: users, error: selectError } = await supabase
    .from("twitter_user")
    .select(
      "id::text,user_updated_at,followers_updated_at,following_updated_at,username,name,followers_count,following_count,tweet_count,description,user_created_at"
    )
    .in("username", usernames);
  if (selectError) throw selectError;

  return users.map((x) => {
    // @ts-ignore
    return { ...x, id: BigInt(x.id) };
  });
};

export type GetUsersArgs = {
  usernames: string[];
  cacheTimeout?: number;
};

// Get users
export const getUsers = async ({
  usernames,
  cacheTimeout = defaultCacheTimeout,
}: GetUsersArgs) => {
  const supabase = getSupabaseClient();

  // Fetch cached users
  const { data: cachedUsers, error: selectCachedError } = await supabase
    .from("twitter_user")
    .select("username,user_updated_at")
    .in("username", usernames);
  if (selectCachedError) throw selectCachedError;

  // Check if cached users exists and the cache has not expired
  const usersToFetch = usernames.filter(
    (username) =>
      !cachedUsers
        .map((user) => {
          return Date.now() - Date.parse(user.user_updated_at) <= cacheTimeout
            ? user.username
            : null;
        })
        .includes(username)
  );

  if (usersToFetch.length) {
    console.log("Fetching users", usersToFetch);
    await updateUsers(usersToFetch);
  }

  return await getUsersFromCache(usernames);
};
