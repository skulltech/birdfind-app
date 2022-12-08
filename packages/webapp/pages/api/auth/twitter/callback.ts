import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { upsertTwitterProfiles } from "@twips/lib";
import type { NextApiRequest, NextApiResponse } from "next";
import { Client } from "twitter-api-sdk";
import {
  completeOauthFlow,
  getServiceRoleSupabase,
  getUserProfile,
} from "../../../../utils/supabase";
import {
  getSignedInTwitterUser,
  getTwitterAuthClient,
} from "../../../../utils/twitter";

type Data = {
  message?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const supabase = createServerSupabaseClient({
    req,
    res,
  });
  const userProfile = await getUserProfile(supabase);
  const { code, state } = req.query;

  // Validations
  if (!userProfile.twitter_oauth_state)
    return res.status(500).send({ message: "No existing Oauth flow found" });
  if (!(code && state && typeof code == "string" && typeof state == "string"))
    return res.status(500).send({ message: "Incomplete or invalid params" });
  if (state !== userProfile.twitter_oauth_state.state)
    return res.status(500).send({ message: "Oauth state is not matching" });

  // Prime authClient with oauth state and then get access token
  const authClient = getTwitterAuthClient();
  authClient.generateAuthURL({
    state,
    code_challenge_method: "plain",
    code_challenge: userProfile.twitter_oauth_state.challenge,
  });
  const { token: token } = await authClient.requestAccessToken(code);

  // Get logged in Oauth user's Twitter profile
  const twitter = new Client(token.access_token);
  const profile = await getSignedInTwitterUser(twitter);

  const serviceRoleSupabase = getServiceRoleSupabase();

  // Update profile in the twitter_profile table
  await upsertTwitterProfiles(serviceRoleSupabase, [profile]);

  // Complete Oauth flow in DB
  await completeOauthFlow(
    serviceRoleSupabase,
    userProfile.id,
    profile.id,
    token
  );

  res.redirect("/");
}
