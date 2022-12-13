import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import {
  getTwitterProfile,
  Relation,
  relations,
  updateNetwork,
} from "@twips/lib";
import axios from "axios";
import type { NextApiRequest, NextApiResponse } from "next";
import { isBigIntish } from "../../../utils/helpers";
import {
  getServiceRoleSupabase,
  getUserDetails,
} from "../../../utils/supabase";
import { getTwitterClient } from "../../../utils/twitter";

type ErrorData = {
  error?: string;
};

const fetchNumDirectly = 2000;

type SuccessData = {
  // Whether fetched or scheduled
  fetched: boolean;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SuccessData | ErrorData>
) {
  const supabase = createServerSupabaseClient({
    req,
    res,
  });

  const { userId, relation } = req.query;

  // Validate params
  if (!userId || typeof userId != "string" || !isBigIntish(userId))
    return res.status(400).json({
      error: "UserId param is not provided or invalid",
    });
  if (
    !relation ||
    typeof relation != "string" ||
    !relations.includes(relation as Relation)
  )
    return res.status(400).json({
      error: "Direction param is not provided or invalid",
    });

  const profile = getTwitterProfile(supabase, userId);
  if (
    profile[relation == "followers" ? "followersCount" : "followingCount"] <
    fetchNumDirectly
  ) {
    const serviceRoleSupabase = getServiceRoleSupabase();
    const userDetails = await getUserDetails(supabase);
    const twitter = await getTwitterClient(
      supabase,
      userDetails.id,
      userDetails.twitter.oauthToken
    );
    const { rateLimitResetsAt } = await updateNetwork({
      userId: BigInt(userId),
      relation: relation as Relation,
      supabase: serviceRoleSupabase,
      twitter,
    });
    if (!rateLimitResetsAt) {
      res.status(200).send({ fetched: true });
      return;
    }
  }

  const response = await axios.get(
    `${process.env.JOB_QUEUE_API_URL}/network/update`,
    {
      params: { userId, relation, key: process.env.JOB_QUEUE_API_KEY },
    }
  );
  if (response.status != 200) throw Error(response.data.message);
  res.status(200).send({ fetched: false });
}
