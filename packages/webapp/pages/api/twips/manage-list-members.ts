import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { NextApiRequest, NextApiResponse } from "next";
import { getUserDetails, insertUserEvent } from "../../../utils/supabase";
import { z } from "zod";
import { getTwitterClient } from "@twips/common";
import { twitterSecrets } from "../../../utils/twitter";
import { getOrigin, zodBigint } from "../../../utils/helpers";

type ErrorData = {
  error?: string;
};

const schema = z.object({
  memberId: zodBigint,
  listId: zodBigint,
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
  const { memberId, add: addStr, listId } = parsedQuery.data;
  const add = addStr == "true";

  const supabase = createServerSupabaseClient({
    req,
    res,
  });

  const userDetails = await getUserDetails(supabase);
  const twitter = await getTwitterClient({
    ...twitterSecrets,
    supabase,
    userId: userDetails.id,
    oauthToken: userDetails.twitter.oauthToken,
    origin: getOrigin(req),
  });

  // Perform action
  if (add) await twitter.lists.listAddMember(listId, { user_id: memberId });
  else await twitter.lists.listRemoveMember(listId, memberId);

  // Update relation on Supabase
  if (add)
    await supabase
      .from("twitter_list_member")
      .upsert({
        list_id: listId,
        member_id: memberId,
      })
      .throwOnError();
  else
    await supabase
      .from("twitter_list_member")
      .delete()
      .eq("list_id", listId)
      .eq("member_id", memberId)
      .throwOnError();

  // Insert user event
  await insertUserEvent(supabase, "manage-list-members", {
    memberId,
    listId,
    add,
  });

  res.status(200).send(null);
}
