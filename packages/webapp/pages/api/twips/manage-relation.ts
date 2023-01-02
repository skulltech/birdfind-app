import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { NextApiRequest, NextApiResponse } from "next";
import {
  getServiceRoleSupabase,
  getUserDetails,
  insertUserEvent,
} from "../../../utils/supabase";
import { z } from "zod";
import { getTwitterClient } from "@twips/common";
import { twitterSecrets } from "../../../utils/twitter";
import { zodBigint } from "../../../utils/helpers";

type ErrorData = {
  error?: string;
};

const schema = z.object({
  targetId: zodBigint,
  relation: z.enum(["follow", "block", "mute"]),
  add: z.union([z.literal("true"), z.literal("false")]),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ErrorData>
) {
  // Schema validation
  const parsedQuery = schema.safeParse(req.query);
  if (!parsedQuery.success)
    return res.status(400).send({ error: "Bad request params" });
  const { targetId, add, relation } = parsedQuery.data;

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
  const userTwitterId = userDetails.twitter.id.toString();

  // Perform action
  if (add) {
    if (relation == "follow")
      await twitter.users.usersIdFollow(userTwitterId, {
        target_user_id: targetId,
      });
    if (relation == "block")
      await twitter.users.usersIdBlock(userTwitterId, {
        target_user_id: targetId,
      });
    if (relation == "mute")
      await twitter.users.usersIdMute(userTwitterId, {
        target_user_id: targetId,
      });
  } else {
    if (relation == "follow")
      await twitter.users.usersIdUnfollow(userTwitterId, targetId);
    if (relation == "block")
      await twitter.users.usersIdUnblock(userTwitterId, targetId);
    if (relation == "mute")
      await twitter.users.usersIdUnmute(userTwitterId, targetId);
  }

  // Update relation on Supabase
  const serviceRoleSupabase = getServiceRoleSupabase();
  const table = `twitter_${relation}`;

  if (add)
    await serviceRoleSupabase
      .from(table)
      .upsert({
        source_id: userTwitterId,
        target_id: targetId,
        updated_at: new Date().toISOString(),
      })
      .throwOnError();
  else
    await serviceRoleSupabase
      .from(table)
      .delete()
      .eq("source_id", userTwitterId)
      .eq("target_id", targetId)
      .throwOnError();

  res.status(200).send(null);
}
