import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { Relation } from "@twips/common";
import { NextApiRequest, NextApiResponse } from "next";
import { queue } from "../../../utils/job-queue";
import { getUserDetails, UserDetails } from "../../../utils/supabase";

const addCron = async (relation: Relation, userDetails: UserDetails) => {
  await queue.add(
    `Cron for updating ${relation} of ${userDetails.twitter.username}`,
    {
      signedInUserId: userDetails.id,
      userId: userDetails.twitter.id,
      relation,
    },
    // Repeat every 2 minutes
    { repeat: { every: 2 * 60 * 1000 } }
  );
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const supabase = createServerSupabaseClient({
    req,
    res,
  });
  const userDetails = await getUserDetails(supabase);

  // Add two crons
  await addCron("blocking", userDetails);
  await addCron("muting", userDetails);

  res.status(200).send(null);
}
