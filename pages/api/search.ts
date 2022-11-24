import type { NextApiRequest, NextApiResponse } from "next";
import { searchUsers } from "../../lib/search";

type Data = {
  users: any[];
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const { followedBy, followerOf } = req.query;

  const users = await searchUsers({
    filters: {
      followedBy: typeof followedBy == "string" ? [followedBy] : followedBy,
      followerOf: typeof followerOf == "string" ? [followerOf] : followerOf,
    },
  });

  res.status(200).json({
    users: users.map((x) => {
      return { ...x, id: x.id.toString() };
    }),
  });
}
