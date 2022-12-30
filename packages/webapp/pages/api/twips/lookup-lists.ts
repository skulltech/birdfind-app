import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { getTwitterClient } from "@twips/common";
import { NextApiRequest, NextApiResponse } from "next";
import {
  listUserOwnedLists,
  TwitterResponse,
} from "twitter-api-sdk/dist/types";
import { twitterListFields } from "../../../utils/helpers";
import { getUserDetails } from "../../../utils/supabase";
import { twitterSecrets } from "../../../utils/twitter";

type ErrorData = {
  error?: string;
};

type SuccessData = any[];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SuccessData | ErrorData>
) {
  if (req.method != "GET")
    return res.status(405).json({ error: "Method not allowed" });

  // Get Supabase client
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
  });

  // Get all user's lists from Twitter API
  const userOwnedLists: TwitterResponse<listUserOwnedLists>["data"] = [];
  const response = twitter.lists.listUserOwnedLists(
    userDetails.twitter.id.toString(),
    {
      max_results: 100,
      // @ts-ignore
      "list.fields": twitterListFields,
    }
  );
  for await (const page of response) userOwnedLists.push(...page.data);

  // Mark columns for delete
  const { error: markForDeleteError } = await supabase
    .from("twitter_list")
    .update({ to_delete: true })
    .eq("owner_id", userDetails.twitter.id);
  if (markForDeleteError) throw markForDeleteError;

  // Insert to supabase
  const { data: lists, error: upsertListsError } = await supabase
    .from("twitter_list")
    .upsert(
      userOwnedLists.map((x) => {
        return {
          id: x.id,
          updated_at: new Date().toISOString(),
          list_created_at: x.created_at,
          name: x.name,
          description: x.description,
          followers_count: x.follower_count,
          members_count: x.member_count,
          private: x.private,
          owner_id: userDetails.twitter.id,
          to_delete: false,
        };
      })
    )
    .select("*");
  if (upsertListsError) throw upsertListsError;

  // Delete the ones still marked for delete
  const { error: deleteOldRows } = await supabase
    .from("twitter_list")
    .delete()
    .eq("owner_id", userDetails.twitter.id)
    .eq("to_delete", true);
  if (deleteOldRows) throw deleteOldRows;

  // Update user's twitter profile
  const { error: updateProfileError } = await supabase
    .from("twitter_profile")
    .update({ lists_owned_updated_at: new Date().toISOString() })
    .eq("id", userDetails.twitter.id);
  if (updateProfileError) throw updateProfileError;

  // Return the lists
  return res.status(200).json(lists);
}
