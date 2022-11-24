import { createClient } from "@supabase/supabase-js";
import { Client } from "twitter-api-sdk";
import * as dotenv from "dotenv";
dotenv.config();

// 1 minutes
const cacheTimeout = 1 * 60 * 1000;

// Util functions
export const getTwitterClient = () =>
  new Client(process.env.TWITTER_BEARER_TOKEN);
export const getSupabaseClient = () =>
  createClient(process.env.SUPABASE_API_URL, process.env.SUPABASE_KEY);

export const getUsers = async (usernames: string[]) => {
  const twitter = getTwitterClient();
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

  // If needed, fetch users from API and cache in DB
  if (usersToFetch.length) {
    console.log("Fetching users", usersToFetch);
    const response = await twitter.users.findUsersByUsername({
      usernames: usersToFetch,
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
  }

  // Finally fetch users from DB and return
  const { data: users, error: selectError } = await supabase
    .from("twitter_user")
    .select("*")
    .in("username", usernames);
  if (selectError) throw selectError;

  return users;
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
      cacheTimeout;
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
