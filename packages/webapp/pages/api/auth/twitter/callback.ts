import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { getTwitterAuthClient } from "@twips/common";
import type { NextApiRequest, NextApiResponse } from "next";
import { Client } from "twitter-api-sdk";
import {
  completeOauthFlow,
  getServiceRoleSupabase,
  getUserProfile,
  upsertTwitterProfile,
} from "../../../../utils/supabase";
import {
  getSignedInTwitterUser,
  twitterSecrets,
} from "../../../../utils/twitter";
import { z } from "zod";

const schema = z.object({
  code: z.string(),
  state: z.string(),
});

type ErrorData = {
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ErrorData>
) {
  // Schema validation and get params
  const parsedQuery = schema.safeParse(req.query);
  if (!parsedQuery.success)
    return res.status(400).send({ error: "Bad request params" });
  const { code, state } = parsedQuery.data;

  // Get user
  const supabase = createServerSupabaseClient({
    req,
    res,
  });
  const userProfile = await getUserProfile(supabase);

  // Check if Oauth flow exists and is valid
  if (!userProfile.twitter_oauth_state)
    return res.status(500).send({ error: "No existing Oauth flow found" });
  if (state !== userProfile.twitter_oauth_state.state)
    return res.status(500).send({ error: "Oauth state is not matching" });

  // Prime authClient with oauth state and then get access token
  const authClient = getTwitterAuthClient(twitterSecrets);
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
  await upsertTwitterProfile(serviceRoleSupabase, profile);

  // Complete Oauth flow in DB
  await completeOauthFlow(
    serviceRoleSupabase,
    userProfile.id,
    profile.id,
    token
  );

  res.redirect("/");
}
