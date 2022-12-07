import axios from "axios";
import type { NextApiRequest, NextApiResponse } from "next";

type ErrorData = {
  error?: string;
};

const isBigIntish = (arg: string) => {
  try {
    BigInt(arg);
    return true;
  } catch (error) {
    return false;
  }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<null | ErrorData>
) {
  const { userId, direction } = req.query;

  // Validate UserId param
  if (!userId || typeof userId != "string" || !isBigIntish(userId))
    return res.status(400).json({
      error: "UserId param is not provided or invalid",
    });

  // Validate direction param
  if (
    !direction ||
    typeof direction != "string" ||
    !["followers", "following"].includes(direction)
  )
    return res.status(400).json({
      error: "Direction param is not provided or invalid",
    });

  const response = await axios.get(
    `${process.env.JOB_QUEUE_API_URL}/network/update`,
    {
      params: { userId, direction, key: process.env.JOB_QUEUE_API_KEY },
    }
  );

  if (response.status != 200) throw Error(response.data.message);

  res.status(200).send(null);
}
