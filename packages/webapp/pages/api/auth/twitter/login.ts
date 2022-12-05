import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import type { NextApiRequest, NextApiResponse } from "next";
import { twitterAuthClient } from "../../../../utils";

type ErrorData = {
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ErrorData>
) {
  const supabase = createServerSupabaseClient({ req, res });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return res.status(401).json({
      error: "The user is not authenticated",
    });

  const authUrl = twitterAuthClient.generateAuthURL({
    state: "state-to-prevent-csrf",
    code_challenge_method: "s256",
  });
  console.log(authUrl);
  res.redirect(authUrl);
}
