import { relations } from "@twips/lib";
import axios from "axios";
import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";

const schema = z.object({
  userId: z.bigint(),
  relation: z.enum(relations),
});

type ErrorData = {
  error?: string;
};

type SuccessData = {
  // Whether fetched or scheduled
  fetched: boolean;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SuccessData | ErrorData>
) {
  // Schema validation
  const parsedQuery = schema.safeParse(req.query);
  if (!parsedQuery.success)
    return res.status(400).send({ error: "Bad request params" });
  const { userId, relation } = parsedQuery.data;

  const response = await axios.get(
    `${process.env.JOB_QUEUE_API_URL}/network/update`,
    {
      params: { userId, relation, key: process.env.JOB_QUEUE_API_KEY },
    }
  );
  if (response.status != 200) throw Error(response.data.message);
  res.status(200).send({ fetched: false });
}
