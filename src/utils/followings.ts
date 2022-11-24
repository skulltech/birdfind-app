import { getSupabaseClient, getTwitterClient } from "./helpers";

export const getFollowings = async (id: BigInt) => {
  const supabase = getSupabaseClient();

  const { data: users, error: selectError } = await supabase
    .from("twitter_follow")
    .select("following_id::text")
    .eq("follower_id", id);
  if (selectError) throw selectError;

  // @ts-ignore
  return users.map((x) => BigInt(x.following_id));
};

export const updateFollowings = async (id: BigInt) => {
  const twitter = getTwitterClient();
  const supabase = getSupabaseClient();

  const followings = [];
  let paginationToken: string;

  while (true) {
    console.log("Making request to usersIdFollowing.");
    const response = await twitter.users.usersIdFollowing(id.toString(), {
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

    followings.push(...response.data);
    if (response.meta.result_count < 1000) break;
    paginationToken = response.meta.next_token;
  }

  // Remove duplicates
  const followingIds = new Set<string>();
  const dedupedFollowings = followings.filter((x) => {
    if (followingIds.has(x.id)) return false;
    followingIds.add(x.id);
    return true;
  });

  const { error: insertUsersError } = await supabase
    .from("twitter_user")
    .upsert(
      dedupedFollowings.map((x) => {
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

  const { error: insertFollowsError } = await supabase
    .from("twitter_follow")
    .upsert(
      dedupedFollowings.map((x) => {
        return {
          follower_id: id.toString(),
          following_id: x.id,
          updated_at: new Date().toISOString(),
        };
      })
    );
  if (insertFollowsError) throw insertFollowsError;
};
