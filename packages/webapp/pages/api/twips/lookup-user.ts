import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { NextApiRequest, NextApiResponse } from "next";
import {
  getServiceRoleSupabase,
  getUserDetails,
  upsertTwitterProfile,
} from "../../../utils/supabase";
import { getTwitterUser } from "../../../utils/twitter";
import { z } from "zod";
import { TwitterProfile } from "../../../utils/helpers";
import { Client } from "twitter-api-sdk";

const schema = z.object({
  username: z.string(),
});

type ErrorData = {
  error?: string;
};

type SuccessData = {
  profile: TwitterProfile;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SuccessData | ErrorData>
) {
  // Schema validation and get params
  const parsedQuery = schema.safeParse(req.query);
  if (!parsedQuery.success)
    return res.status(400).send({ error: "Bad request params" });
  const { username } = parsedQuery.data;

  const supabase = createServerSupabaseClient({
    req,
    res,
  });

  const userDetails = await getUserDetails(supabase);
  const twitter = new Client(userDetails.twitter.accessToken);
  const twitterUser = await getTwitterUser(twitter, username);

  if (!twitterUser) return res.status(200).json({ profile: null });

  const serviceRoleSupabase = getServiceRoleSupabase();
  const profile = await upsertTwitterProfile(serviceRoleSupabase, twitterUser);

  res.status(200).json({ profile });
}
