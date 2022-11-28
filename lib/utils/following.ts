import { TwitterResponse, usersIdFollowing } from "twitter-api-sdk/dist/types";
import { getSupabaseClient, getTwitterClient } from "./clients";
import {
  convertApiUserToPostgresRow,
  dedupeUsers,
  userApiFields,
} from "./helpers";

export const getFollowing = async (id: BigInt) => {
  const supabase = getSupabaseClient();

  const { data: users, error: selectError } = await supabase
    .from("twitter_follow")
    .select("following_id::text")
    .eq("follower_id", id);
  if (selectError) throw selectError;

  // @ts-ignore
  return users.map((x) => BigInt(x.following_id));
};

export const updateFollowing = async (id: BigInt) => {
  const twitter = getTwitterClient();
  const supabase = getSupabaseClient();

  const following: TwitterResponse<usersIdFollowing>["data"] = [];
  let paginationToken: string;

  while (true) {
    console.log("Making request to usersIdFollowing.");
    const response = await twitter.users.usersIdFollowing(id.toString(), {
      max_results: 1000,
      "user.fields": userApiFields,
      pagination_token: paginationToken,
    });
    following.push(...response.data);
    if (response.meta.result_count < 1000) break;
    paginationToken = response.meta.next_token;
  }

  // Remove duplicates
  const dedupedFollowing = dedupeUsers(following);

  const { error: insertUsersError } = await supabase
    .from("twitter_user")
    .upsert(dedupedFollowing.map(convertApiUserToPostgresRow));
  if (insertUsersError) throw insertUsersError;

  const { error: insertFollowsError } = await supabase
    .from("twitter_follow")
    .upsert(
      dedupedFollowing.map((x) => {
        return {
          follower_id: id.toString(),
          following_id: x.id,
          updated_at: new Date().toISOString(),
        };
      })
    );
  if (insertFollowsError) throw insertFollowsError;

  const { error: updateUserError } = await supabase
    .from("twitter_user")
    .update({
      following_updated_at: new Date().toISOString(),
    })
    .eq("id", id.toString());
  if (updateUserError) throw updateUserError;
};
