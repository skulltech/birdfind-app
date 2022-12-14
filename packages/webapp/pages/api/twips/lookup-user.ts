import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import {
  getTwitterClient,
  TwitterProfile,
  upsertTwitterProfiles,
} from "@twips/lib";
import { NextApiRequest, NextApiResponse } from "next";
import {
  getServiceRoleSupabase,
  getUserDetails,
} from "../../../utils/supabase";
import { getTwitterUser, twitterSecrets } from "../../../utils/twitter";
import { z } from "zod";

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
  const twitter = await getTwitterClient({
    ...twitterSecrets,
    supabase,
    userId: userDetails.id,
    oauthToken: userDetails.twitter.oauthToken,
  });
  const twitterUser = await getTwitterUser(twitter, username);

  if (!twitterUser) {
    res.status(200).json({ profile: null });
    return;
  }

  const serviceRoleSupabase = getServiceRoleSupabase();
  const profiles = await upsertTwitterProfiles(serviceRoleSupabase, [
    twitterUser,
  ]);

  res.status(200).json({ profile: profiles[0] });
}
