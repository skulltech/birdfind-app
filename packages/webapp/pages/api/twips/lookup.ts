import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { TwitterProfile, upsertTwitterProfiles } from "@twips/lib";
import { NextApiRequest, NextApiResponse } from "next";
import {
  getServiceRoleSupabase,
  getUserDetails,
} from "../../../utils/supabase";
import { getTwitterClient, getTwitterUser } from "../../../utils/twitter";

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
  const supabase = createServerSupabaseClient({
    req,
    res,
  });

  const { username } = req.query;
  if (!username || typeof username != "string") {
    res
      .status(400)
      .json({ error: "Username param is invalid or not provided" });
    return;
  }

  const userDetails = await getUserDetails(supabase);
  const twitter = await getTwitterClient(
    supabase,
    userDetails.id,
    userDetails.twitter.oauthToken
  );
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
