import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { getTwitterProfile, updateNetwork } from "@twips/lib";
import axios from "axios";
import type { NextApiRequest, NextApiResponse } from "next";
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

const isBigIntish = (arg: string) => {
  try {
    BigInt(arg);
    return true;
  } catch (error) {
    return false;
  }
};

type Direction = "followers" | "following";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SuccessData | ErrorData>
) {
  const supabase = createServerSupabaseClient({
    req,
    res,
  });

  const { userId, direction } = req.query;

  // Validate params
  if (!userId || typeof userId != "string" || !isBigIntish(userId))
    return res.status(400).json({
      error: "UserId param is not provided or invalid",
    });
  if (
    !direction ||
    typeof direction != "string" ||
    !["followers", "following"].includes(direction)
  )
    return res.status(400).json({
      error: "Direction param is not provided or invalid",
    });

  const profile = getTwitterProfile(supabase, userId);
  if (
    profile[direction == "followers" ? "followersCount" : "followingCount"] <
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
      direction: direction as Direction,
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
      params: { userId, direction, key: process.env.JOB_QUEUE_API_KEY },
    }
  );
  if (response.status != 200) throw Error(response.data.message);
  res.status(200).send({ fetched: false });
}
