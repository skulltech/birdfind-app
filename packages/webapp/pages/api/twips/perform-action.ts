import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { NextApiRequest, NextApiResponse } from "next";
import { getUserDetails } from "../../../utils/supabase";
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

  const funcs = {
    follow: () =>
      twitter.users.usersIdFollow(sourceUserId, {
        target_user_id: targetUserId,
      }),
    unfollow: () => twitter.users.usersIdUnfollow(sourceUserId, targetUserId),
    block: () =>
      twitter.users.usersIdBlock(sourceUserId, {
        target_user_id: targetUserId,
      }),
    unblock: () => twitter.users.usersIdUnblock(sourceUserId, targetUserId),
    mute: () =>
      twitter.users.usersIdMute(sourceUserId, { target_user_id: targetUserId }),
    unmute: () => twitter.users.usersIdUnmute(sourceUserId, targetUserId),
  };

  // Perform action
  const { errors } = await funcs[action]();

  if (errors && errors.length)
    res.status(500).send({ error: errors[0].detail });
  else res.status(200).send(null);
}
