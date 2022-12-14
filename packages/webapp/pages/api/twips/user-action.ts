import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { NextApiRequest, NextApiResponse } from "next";
import { getUserDetails } from "../../../utils/supabase";
import { z } from "zod";
import { getTwitterClient } from "@twips/lib";

type ErrorData = {
  error?: string;
};

const actions = [
  "follow",
  "unfollow",
  "block",
  "unblock",
  "mute",
  "unmute",
] as const;

const schema = z.object({
  userId: z.bigint(),
  action: z.enum(actions),
});

type Action = typeof actions[number];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ErrorData>
) {
  // Schema validation
  const parsedQuery = schema.safeParse(req.query);
  if (!parsedQuery.success)
    return res.status(400).send({ error: "Bad request params" });
  const { userId, action } = parsedQuery.data;

  const supabase = createServerSupabaseClient({
    req,
    res,
  });

  // const serviceRoleSupabase = getServiceRoleSupabase();
  const userDetails = await getUserDetails(supabase);
  const twitter = await getTwitterClient(
    supabase,
    userDetails.id,
    userDetails.twitter.oauthToken
  );

  const funcs = {
    follow: twitter.users.usersIdFollow,
    unfollow: twitter.users.usersIdUnfollow,
    block: twitter.users.usersIdBlock,
    unblock: twitter.users.usersIdUnblock,
    mute: twitter.users.usersIdMute,
    unmute: twitter.users.usersIdMute,
  };

  const x = await funcs[action as Action](userDetails.twitter.id.toString(), {
    target_user_id: userId,
  });
}
