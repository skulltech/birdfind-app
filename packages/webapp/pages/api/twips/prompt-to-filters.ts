import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { getFiltersFromPrompt } from "../../../utils/openai";
import { getUserDetails, insertUserEvent } from "../../../utils/supabase";

type SuccessData = {
  filters: any;
};

type ErrorData = {
  error?: string;
};

const schema = z.object({
  prompt: z.string(),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SuccessData | ErrorData>
) {
  // Schema validation and get params
  const parsedQuery = schema.safeParse(req.query);
  if (!parsedQuery.success)
    return res.status(400).send({ error: "Bad request params" });
  const { prompt } = parsedQuery.data;

  const supabase = createServerSupabaseClient({
    req,
    res,
  });
  const userDetails = await getUserDetails(supabase);

  const filters = await getFiltersFromPrompt(
    userDetails.twitter.username,
    prompt
  );

  // Insert event in user_event table
  await insertUserEvent(supabase, "prompt-to-filters", { prompt, filters });

  res.status(200).json({ filters });
}
