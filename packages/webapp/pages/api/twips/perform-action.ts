import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { NextApiRequest, NextApiResponse } from "next";
import {
  getServiceRoleSupabase,
  getUserDetails,
} from "../../../utils/supabase";
import { z } from "zod";
import { getTwitterClient } from "@twips/lib";
import { twitterSecrets } from "../../../utils/twitter";
import { actions, zodBigint } from "../../../utils/helpers";

type ErrorData = {
  error?: string;
};

const schema = z.object({
  userId: zodBigint,
  action: z.enum(actions),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ErrorData>
) {
  // Schema validation
  const parsedQuery = schema.safeParse(req.query);
  if (!parsedQuery.success)
    return res.status(400).send({ error: "Bad request params" });
  const { userId: targetUserId, action } = parsedQuery.data;

  const supabase = createServerSupabaseClient({
    req,
    res,
  });

  // const serviceRoleSupabase = getServiceRoleSupabase();
  const userDetails = await getUserDetails(supabase);
  const twitter = await getTwitterClient({
    ...twitterSecrets,
    supabase,
    userId: userDetails.id,
    oauthToken: userDetails.twitter.oauthToken,
  });
  const sourceUserId = userDetails.twitter.id.toString();

  const params = {
    follow: {
      twitterFunction: () =>
        twitter.users.usersIdFollow(sourceUserId, {
          target_user_id: targetUserId,
        }),
      updateRelationArgs: ["twitter_follow", true] as const,
    },
    unfollow: {
      twitterFunction: () =>
        twitter.users.usersIdUnfollow(sourceUserId, targetUserId),
      updateRelationArgs: ["twitter_follow", false] as const,
    },
    block: {
      twitterFunction: () =>
        twitter.users.usersIdBlock(sourceUserId, {
          target_user_id: targetUserId,
        }),
      updateRelationArgs: ["twitter_block", true] as const,
    },
    unblock: {
      twitterFunction: () =>
        twitter.users.usersIdUnblock(sourceUserId, targetUserId),
      updateRelationArgs: ["twitter_block", false] as const,
    },
    mute: {
      twitterFunction: () =>
        twitter.users.usersIdMute(sourceUserId, {
          target_user_id: targetUserId,
        }),
      updateRelationArgs: ["twitter_mute", true] as const,
    },
    unmute: {
      twitterFunction: () =>
        twitter.users.usersIdUnmute(sourceUserId, targetUserId),
      updateRelationArgs: ["twitter_mute", false] as const,
    },
  };

  // Perform action
  const { errors } = await params[action].twitterFunction();

  if (errors && errors.length)
    res.status(500).send({ error: errors[0].detail });
  else {
    // Update relation on Supabase
    const supabase = getServiceRoleSupabase();
    const [table, add] = params[action].updateRelationArgs;
    if (add) {
      const { error } = await supabase.from(table).upsert({
        source_id: sourceUserId,
        target_id: targetUserId,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq("source_id", sourceUserId)
        .eq("target_id", targetUserId);
      if (error) throw error;
    }

    res.status(200).send(null);
  }
}
