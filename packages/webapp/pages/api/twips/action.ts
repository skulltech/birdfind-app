import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { NextApiRequest, NextApiResponse } from "next";
import { isBigIntish } from "../../../utils/helpers";
import { getUserDetails } from "../../../utils/supabase";
import { getTwitterClient } from "../../../utils/twitter";

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
type Action = typeof actions[number];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ErrorData>
) {
  const supabase = createServerSupabaseClient({
    req,
    res,
  });
  const { userId, action } = req.query;

  // Validate params
  if (!userId || userId != "string" || !isBigIntish(userId))
    return res.status(400).json({
      error: "UserId param is not provided or invalid",
    });
  if (
    !action ||
    typeof action != "string" ||
    !actions.includes(action as Action)
  )
    return res.status(400).json({
      error: "Action param is not provided or invalid",
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
