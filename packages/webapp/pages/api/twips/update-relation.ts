import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { relations, updateRelationJobOpts } from "@twips/common";
import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { zodBigint } from "../../../utils/helpers";
import { queue } from "../../../utils/job-queue";
import { insertUserEvent } from "../../../utils/supabase";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const schema = z.object({
  userId: zodBigint,
  relation: z.enum(relations),
});

type ErrorData = {
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<null | ErrorData>
) {
  // Schema validation and get params
  const parsedQuery = schema.safeParse(req.query);
  if (!parsedQuery.success)
    return res.status(400).send({ error: "Bad request params" });
  const { userId: strUserId, relation } = parsedQuery.data;
  const userId = BigInt(strUserId);

  // Get logged in user
  const supabase = createServerSupabaseClient({
    req,
    res,
  });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Add job
  const job = await queue.add(
    "Update relation",
    {
      signedInUserId: user.id,
      userId,
      relation,
    },
    updateRelationJobOpts
  );

  // Insert event in user_event table
  await insertUserEvent(supabase, "update-relation", { userId, relation });

  // Check if job is completed or failed in a loop
  while (true) {
    const jobState = await job.getState();

    // Return if failed or completed
    if (jobState == "failed") {
      res.status(500).send({ error: "Error while processing job" });
      return;
    } else if (jobState == "completed") {
      res.status(200).send(null);
      return;
    }

    // Otherwise wait for a second and go again
    await sleep(1000);
  }
}
