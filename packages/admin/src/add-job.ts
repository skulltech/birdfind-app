import {
  Relation,
  serializeTwitterUser,
  twitterUserFields,
} from "@twips/common";
import { supabase, twitter } from "./utils";

type AddJobArgs = {
  email: string;
  relation: Relation;
  username: string;
};

export const addJob = async ({ email, relation, username }: AddJobArgs) => {
  // Get twitter ID of target twitter user
  const { data: userIds } = await supabase
    .from("twitter_profile")
    .select("id::text")
    .eq("username", username)
    .throwOnError();

  let userId: BigInt;

  // @ts-ignore
  if (userIds.length) userId = BigInt(userIds[0].id);
  else {
    const { data: user } = await twitter.users.findUserByUsername(username, {
      "user.fields": twitterUserFields,
    });
    const { data } = await supabase
      .from("twitter_profile")
      .insert(serializeTwitterUser(user))
      .select("id::text")
      .throwOnError();

    // @ts-ignore
    userId = BigInt(data[0].id);
  }

  // Get user ID of logged in user's email
  const { data: signedInUserIds } = await supabase
    .from("user_profile")
    .select("id")
    .eq("email", email)
    .throwOnError();
  const signedInUserId = signedInUserIds[0].id;

  // Add job
  const { data } = await supabase
    .from("lookup_relation_job")
    .insert({
      user_id: signedInUserId,
      target_twitter_id: userId,
      relation,
      // Higher priority if it was never updated
      priority: 200000,
    })
    .select("id")
    .throwOnError()
    .single();

  return data.id;
};
