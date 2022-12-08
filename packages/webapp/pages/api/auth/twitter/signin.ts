import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { randomBytes } from "crypto";
import type { NextApiRequest, NextApiResponse } from "next";
import { startOauthFlow, updateUserProfile } from "../../../../utils/supabase";
import { getTwitterAuthClient } from "../../../../utils/twitter";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const supabase = createServerSupabaseClient({
    req,
    res,
  });

  // Generate random Oauth state and save in DB
  const state = randomBytes(16).toString("hex");
  const challenge = randomBytes(16).toString("hex");
  await startOauthFlow(supabase, state, challenge);

  // Generate auth URL and redirect
  const authClient = getTwitterAuthClient();
  const authUrl = authClient.generateAuthURL({
    state,
    code_challenge_method: "plain",
    code_challenge: challenge,
  });
  res.redirect(authUrl);
}
