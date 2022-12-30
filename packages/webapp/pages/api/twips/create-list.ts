import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { getTwitterClient } from "@twips/common";
import { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { twitterListFields } from "../../../utils/helpers";
import { getUserDetails } from "../../../utils/supabase";
import { twitterSecrets } from "../../../utils/twitter";

type ErrorData = {
  error?: string;
};

const schema = z.object({
  name: z.string(),
  description: z.string(),
  private: z.union([z.literal("true"), z.literal("false")]),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any | ErrorData>
) {
  // Schema validation and get params
  const parsedQuery = schema.safeParse(req.query);
  if (!parsedQuery.success)
    return res.status(400).send({ error: "Bad request params" });
  const { description, name, private: isPrivate } = parsedQuery.data;

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

  // Create list on Twitter
  const createListResponse = await twitter.lists.listIdCreate({
    description,
    name,
    private: isPrivate === "true",
  });
  if (createListResponse.errors?.length)
    return res.status(500).json({ error: createListResponse.errors[0].title });

  // Get details of created list
  const getListResponse = await twitter.lists.listIdGet(
    createListResponse.data.id,
    {
      // @ts-ignore
      "list.fields": twitterListFields,
    }
  );
  if (getListResponse.errors?.length)
    return res.status(500).json({ error: getListResponse.errors[0].title });

  // Insert to supabase
  const { data: list, error } = await supabase
    .from("twitter_list")
    .insert({
      id: getListResponse.data.id,
      list_created_at: getListResponse.data.created_at,
      name: getListResponse.data.name,
      description: getListResponse.data.description,
      followers_count: getListResponse.data.follower_count,
      members_count: getListResponse.data.member_count,
      private: getListResponse.data.private,
      owner_id: userDetails.twitter.id,
    })
    .select("*")
    .single();
  if (error) throw error;

  return res.status(200).json(list);
}
