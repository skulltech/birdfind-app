import { createClient } from "@supabase/supabase-js";
import { TwitterUser } from "@twips/lib/src/utils/types";
import { getUsers, updateUsers } from "@twips/lib/src/utils/users";
import type { NextApiRequest, NextApiResponse } from "next";
import { unstable_getServerSession } from "next-auth";
import Client from "twitter-api-sdk";
import { getNextAuthOptions } from "../auth/[...nextauth]";

type SuccessData = {
  user?: Omit<TwitterUser, "id"> & { id: string };
};

type ErrorData = {
  error?: string;
};

const serializeUser = (user: TwitterUser) => {
  return { ...user, id: user.id.toString() };
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SuccessData | ErrorData>
) {
  const authOptions = getNextAuthOptions(req);
  const session = await unstable_getServerSession(req, res, authOptions);
  if (!session) {
    res.status(401).json({ error: "You are not authorized" });
    return;
  }

  const { username } = req.query;
  if (!username || typeof username != "string")
    return res.status(400).json({
      error: "Username param is not provided or invalid",
    });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const cachedUsers = await getUsers({ usernames: [username], supabase });
  if (cachedUsers.length)
    res.status(200).json({
      user: serializeUser(cachedUsers[0]),
    });
  else {
    const twitter = new Client(process.env.TWITTER_BEARER_TOKEN);
    const response = await updateUsers({
      usernames: [username],
      supabase,
      twitter,
    });
    if (response.data && response.data.length === 1) {
      const cachedUsers = await getUsers({ usernames: [username], supabase });
      res.status(200).json({
        user: serializeUser(cachedUsers[0]),
      });
    } else res.status(200).json({});
  }
}
