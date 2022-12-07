import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { TwitterProfile } from "@twips/lib";
import { NextApiRequest, NextApiResponse } from "next";
import { Client } from "twitter-api-sdk";
import {
  getServiceRoleSupabase,
  getUserDetails,
  upsertTwitterProfile,
} from "../../../utils/supabase";
import { getTwitterUser } from "../../../utils/twitter";

type ErrorData = {
  message?: string;
};

type SuccessData = {
  twitterProfile: TwitterProfile;
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
      .json({ message: "Username param is invalid or not provided" });
    return;
  }

  const userDetails = await getUserDetails(supabase);
  const twitter = new Client(userDetails.twitter.oauthToken.access_token);
  const twitterUser = await getTwitterUser(twitter, username);

  if (!twitterUser) {
    res.status(200).json({ twitterProfile: null });
    return;
  }

  const serviceRoleSupabase = getServiceRoleSupabase();
  const twitterProfile = await upsertTwitterProfile(
    serviceRoleSupabase,
    twitterUser
  );

  res.status(200).json({ twitterProfile });
}
