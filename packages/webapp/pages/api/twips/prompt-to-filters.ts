import { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { getFiltersFromPrompt } from "../../../utils/openai";

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

  const filtersJson = await getFiltersFromPrompt(prompt);
  res.status(200).json({ filters: filtersJson });
}
