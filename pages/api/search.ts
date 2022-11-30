import type { NextApiRequest, NextApiResponse } from "next";
import { searchUsers } from "../../lib/search";
import { camelCase } from "lodash";
import { createClient } from "@supabase/supabase-js";
import Client from "twitter-api-sdk";

type Data = {
  users: any[];
};

type QueryParams = Partial<{
  [key: string]: string | string[];
}>;

const parseInts = (params: QueryParams) => {
  const result = {};
  for (const [key, value] of Object.entries(params)) {
    if (typeof value == "string") {
      const num = Number.parseInt(value);
      if (num != NaN) {
        result[key] = num;
      }
    }
  }
  return result;
};

const parseDates = (params: QueryParams) => {
  const result = {};
  for (const [key, value] of Object.entries(params)) {
    if (typeof value == "string") {
      if (Date.parse(value) != NaN) {
        result[key] = new Date(value);
      }
    }
  }
  return result;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const supabase = createClient(
    process.env.SUPABASE_API_URL,
    process.env.SUPABASE_KEY
  );
  const twitter = new Client(process.env.TWITTER_BEARER_TOKEN);

  // Convert snake_case keys to camelCase
  const camelCaseQuery: typeof req.query = Object.entries(req.query).reduce(
    (prev, [key, value]) => {
      prev[camelCase(key)] = value;
      return prev;
    },
    {}
  );
  // Get args out of camelCase req params
  const {
    followedBy,
    followerOf,
    tweetCountLessThan,
    tweetCountGreaterThan,
    followersCountLessThan,
    followersCountGreaterThan,
    followingCountLessThan,
    followingCountGreaterThan,
    createdBefore,
    createdAfter,
  } = camelCaseQuery;

  const users = await searchUsers({
    filters: {
      followedBy: typeof followedBy == "string" ? [followedBy] : followedBy,
      followerOf: typeof followerOf == "string" ? [followerOf] : followerOf,
      ...parseInts({
        tweetCountLessThan,
        tweetCountGreaterThan,
        followersCountLessThan,
        followersCountGreaterThan,
        followingCountLessThan,
        followingCountGreaterThan,
      }),
      ...parseDates({ createdBefore, createdAfter }),
    },
    supabase,
    twitter,
  });

  res.status(200).json({
    users: users.map((x) => {
      return { ...x, id: x.id.toString() };
    }),
  });
}
