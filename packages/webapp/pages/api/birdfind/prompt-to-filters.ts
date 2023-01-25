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

const querySchema = z.object({
  prompt: z.string(),
});

const filtersSchema = z
  .object({
    followedBy: z.array(z.string()).optional(),
    followerOf: z.array(z.string()).optional(),
    followersCountLessThan: z.number().optional(),
    followersCountGreaterThan: z.number().optional(),
    followingCountLessThan: z.number().optional(),
    followingCountGreaterThan: z.number().optional(),
    tweetCountLessThan: z.number().optional(),
    tweetCountGreaterThan: z.number().optional(),
    createdBefore: z.date().optional(),
    createdAfter: z.date().optional(),
    blockedBy: z.array(z.string()).optional(),
    mutedBy: z.array(z.string()).optional(),
    searchText: z.string().optional(),
  })
  .strict();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SuccessData | ErrorData>
) {
  // Schema validation and get params
  const parsedQuery = querySchema.safeParse(req.query);
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

  const { success } = filtersSchema.safeParse(filters);
  if (!success) {
    // Insert user event
    await insertUserEvent(supabase, "prompt-to-filters", {
      prompt,
      filters,
      parseSuccess: false,
    });
    return res.status(400).send(null);
  }

  // Insert user event
  await insertUserEvent(supabase, "prompt-to-filters", {
    prompt,
    filters,
    parseSuccess: true,
  });

  res.status(200).json({ filters });
}
