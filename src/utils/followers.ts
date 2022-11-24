import {
  defaultCacheTimeout,
  getSupabaseClient,
  getTwitterClient,
} from "./helpers";

export const getFollowersFromCache = async (id: string) => {
  const supabase = getSupabaseClient();

  const { data: users, error: selectError } = await supabase
    .from("twitter_follow")
    .select("follower_id")
    .eq("following_id", id);
  if (selectError) throw selectError;

  return users.map((x) => x.follower_id);
};

export const updateFollowers = async (id: string) => {
  const twitter = getTwitterClient();
  const supabase = getSupabaseClient();

  const followers = [];
  let paginationToken: string;

  while (true) {
    const response = await twitter.users.usersIdFollowers(id, {
      max_results: 1000,
      "user.fields": [
        "created_at",
        "public_metrics",
        "description",
        "location",
        "profile_image_url",
      ],
      pagination_token: paginationToken,
    });

    followers.push(...response.data);
    if (response.meta.result_count < 1000) break;
    paginationToken = response.meta.next_token;
  }

  // Remove duplicates
  const followerIds = new Set<string>();
  const dedupedFollowers = followers.filter((x) => {
    if (followerIds.has(x.id)) return false;
    followerIds.add(x.id);
    return true;
  });

  //   console.log(followers.length);
  //   console.log(new Set(followers.map((x) => x.id)).size);
  //   console.log(dedupedFollowers.length);
  //   return;

  const { error: insertUsersError } = await supabase
    .from("twitter_user")
    .upsert(
      followers.map((x) => {
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
        };
      })
    );
  if (insertUsersError) throw insertUsersError;

  console.log("Inserted users");

  const { error: insertFollowsError } = await supabase
    .from("twitter_follow")
    .upsert(
      followers.map((x) => {
        return {
          follower_id: x.id,
          following_id: id,
          updated_at: new Date().toISOString(),
        };
      })
    );
  if (insertFollowsError) throw insertFollowsError;
};

export const getFollowers = async (id: string) => {
  const twitter = getTwitterClient();
  const supabase = getSupabaseClient();

  // Fetch cached user
  const { data: cachedUsers, error: selectCachedError } = await supabase
    .from("twitter_user")
    .select("id,followers_updated_at")
    .eq("id", id);
  if (selectCachedError) throw selectCachedError;

  // Check if the cache has expired
  const isCacheFresh =
    Boolean(cachedUsers.length) &&
    Date.now() - Date.parse(cachedUsers[0].followers_updated_at) <=
      defaultCacheTimeout;
  console.log(isCacheFresh);

  // If needed, fetch users from API and cache in DB
  if (!isCacheFresh) {
    console.log("Fetching followers of", id);
    const followers = [];

    let paginationToken: string;
    while (true) {
      const response = await twitter.users.usersIdFollowers(id, {
        max_results: 1000,
        "user.fields": [
          "created_at",
          "public_metrics",
          "description",
          "location",
          "profile_image_url",
        ],
        pagination_token: paginationToken,
      });
      followers.push(...response.data);
      if (response.meta.result_count < 1000) break;
      paginationToken = response.meta.next_token;
    }

    const { error: insertUsersError } = await supabase
      .from("twitter_user")
      .upsert(
        followers.map((x) => {
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
    if (insertUsersError) throw insertUsersError;

    const { error: insertFollowsError } = await supabase
      .from("twitter_follow")
      .upsert(
        followers.map((x) => {
          return {
            follower_id: x.id,
            following_id: id,
            updated_at: new Date().toISOString(),
          };
        })
      );
    if (insertFollowsError) throw insertFollowsError;
  }

  // Finally fetch users from DB and return
  const { data: users, error: selectError } = await supabase
    .from("twitter_follow")
    .select("*")
    .eq("following_id", id);
  if (selectError) throw selectError;

  return users;
};
