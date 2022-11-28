import { getSupabaseClient, getTwitterClient } from "./clients";
import {
  convertApiUserToPostgresRow,
  dedupeUsers,
  userApiFields,
} from "./helpers";

export const getFollowers = async (id: BigInt) => {
  const supabase = getSupabaseClient();

  const { data: users, error: selectError } = await supabase
    .from("twitter_follow")
    .select("follower_id::text")
    .eq("following_id", id);
  if (selectError) throw selectError;

  // @ts-ignore
  return users.map((x) => BigInt(x.follower_id));
};

export const updateFollowers = async (id: BigInt) => {
  const twitter = getTwitterClient();
  const supabase = getSupabaseClient();

  const followers = [];
  let paginationToken: string;

  while (true) {
    console.log("Making request to usersIdFollowers.");
    const response = await twitter.users.usersIdFollowers(id.toString(), {
      max_results: 1000,
      "user.fields": userApiFields,
      pagination_token: paginationToken,
    });

    followers.push(...response.data);
    if (response.meta.result_count < 1000) break;
    paginationToken = response.meta.next_token;
  }

  // Remove duplicates
  const dedupedFollowers = dedupeUsers(followers);

  const { error: insertUsersError } = await supabase
    .from("twitter_user")
    .upsert(dedupedFollowers.map(convertApiUserToPostgresRow));
  if (insertUsersError) throw insertUsersError;

  const { error: insertFollowsError } = await supabase
    .from("twitter_follow")
    .upsert(
      dedupedFollowers.map((x) => {
        return {
          follower_id: x.id,
          following_id: id.toString(),
          updated_at: new Date().toISOString(),
        };
      })
    );
  if (insertFollowsError) throw insertFollowsError;

  const { error: updateUserError } = await supabase
    .from("twitter_user")
    .update({
      followers_updated_at: new Date().toISOString(),
    })
    .eq("id", id.toString());
  if (updateUserError) throw updateUserError;
};
