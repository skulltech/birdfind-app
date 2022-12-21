import {
  getUpdateRelationJobParams,
  Relation,
  serializeTwitterUser,
  twitterUserFields,
} from "@twips/common";
import { queue, supabase, twitter } from "./utils";

type AddJobArgs = {
  email: string;
  relation: Relation;
  username: string;
};

export const addJob = async ({ email, relation, username }: AddJobArgs) => {
  // Get twitter ID of target twitter user
  const { data: userIds, error: error1 } = await supabase
    .from("twitter_profile")
    .select("id::text")
    .eq("username", username);
  if (error1) throw error1;

  let userId: BigInt;

  // @ts-ignore
  if (userIds.length) userId = BigInt(userIds[0].id);
  else {
    const { data: user } = await twitter.users.findUserByUsername(username, {
      "user.fields": twitterUserFields,
    });
    const { data, error } = await supabase
      .from("twitter_profile")
      .insert(serializeTwitterUser(user))
      .select("id::text");
    if (error) throw error;

    // @ts-ignore
    userId = BigInt(data[0].id);
  }

  // Get user ID of logged in user's email
  const { data: signedInUserIds, error: error2 } = await supabase
    .from("user_profile")
    .select("id")
    .eq("email", email);
  if (error2) throw error2;
  const signedInUserId = signedInUserIds[0].id;

  const { jobName, opts } = await getUpdateRelationJobParams({
    relation,
    supabase,
    username,
    userId,
  });
  // Remove existing job if there's any
  await queue.remove(opts.jobId);
  // Add job
  return await queue.add(jobName, { signedInUserId, relation, userId }, opts);
};
