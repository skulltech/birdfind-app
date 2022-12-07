import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { NextApiRequest, NextApiResponse } from "next";
import { Client } from "twitter-api-sdk";
import {
  getServiceRoleSupabase,
  getUserProfile,
  upsertTwitterProfile,
} from "../../../utils/supabase";
import { getTwitterProfile } from "../../../utils/twitter";

type ErrorData = {
  message?: string;
};

type SuccessData = {
  user: any;
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

  const userProfile = await getUserProfile(supabase);
  const token = userProfile.twitter_oauth_token;
  const twitter = new Client(token.access_token);
  const user = await getTwitterProfile(twitter, username);

  const serviceRoleSupabase = getServiceRoleSupabase();
  await upsertTwitterProfile(serviceRoleSupabase, user);

  res.status(200).json({ user });
}
