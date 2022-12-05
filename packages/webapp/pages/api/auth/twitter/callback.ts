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

  const { code, state } = req.query;
  if (state !== "state-to-prevent-csrf")
    return res.status(500).send({ error: "State isn't matching" });
  const token = await twitterAuthClient.requestAccessToken(code as string);
  console.log(token);

  res.redirect("/");
}
