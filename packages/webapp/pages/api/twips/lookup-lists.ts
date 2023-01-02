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

  // Mark rows for delete
  const { error } = await supabase
    .from("twitter_list")
    .update({ to_delete: true })
    .eq("owner_id", userDetails.twitter.id);
  // TODO: fix this hack
  if (error?.message) throw error;

  // Insert to supabase
  const { data: lists } = await supabase
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
    .select("*")
    .throwOnError();

  // Delete the ones still marked for delete
  await supabase
    .from("twitter_list")
    .delete()
    .eq("owner_id", userDetails.twitter.id)
    .eq("to_delete", true)
    .throwOnError();

  // Update user's twitter profile
  await supabase
    .from("twitter_profile")
    .update({ lists_owned_updated_at: new Date().toISOString() })
    .eq("id", userDetails.twitter.id)
    .throwOnError();

  // Return the lists
  return res.status(200).json(lists);
}
