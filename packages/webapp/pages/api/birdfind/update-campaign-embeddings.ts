import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { updateCampaignEmbeddings } from "../../../utils/campaigns";

const schema = z.object({
  id: z.coerce.number(),
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
  const { id } = parsedQuery.data;

  const supabase = createServerSupabaseClient({
    req,
    res,
  });
  await updateCampaignEmbeddings({ id, supabase });

  res.status(200).json(null);
}
