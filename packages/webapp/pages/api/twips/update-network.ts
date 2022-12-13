import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { relations } from "@twips/lib";
import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import {
  addUpdateNetworkJob,
  getUpdateNetworkJobStatus,
} from "../../../utils/job-queue";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const retries = 5;

// Custom bigint Zod type
const bigint = z.string().refine((x) => {
  try {
    BigInt(x);
    return true;
  } catch (error) {
    return false;
  }
});

const schema = z.object({
  userId: bigint,
  relation: z.enum(relations),
});

const redisConnection = {
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT),
};

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

  const supabase = createServerSupabaseClient({
    req,
    res,
  });
  const {
    data: { user: user },
  } = await supabase.auth.getUser();

  const jobId = await addUpdateNetworkJob({
    connection: redisConnection,
    relation,
    userId: BigInt(userId),
    signedInUserId: user.id,
  });

  // Check if job is completed in a loop
  let fetched = false;
  for (const i of Array(retries)) {
    const jobStatus = await getUpdateNetworkJobStatus({
      jobId,
      connection: redisConnection,
      relation,
    });
    if (jobStatus != "completed") await sleep(1);
    else fetched = true;
  }

  res.status(200).send({ fetched });
}
