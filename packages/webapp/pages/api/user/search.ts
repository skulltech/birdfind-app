import type { NextApiRequest, NextApiResponse } from "next";
import { searchUsers } from "@twips/lib";
import { camelCase } from "lodash";
import Client from "twitter-api-sdk";
import { createClient } from "@supabase/supabase-js";

type Data = {
  error?: string;
  users?: any[];
};

type QueryParams = Partial<{
  [key: string]: string | string[];
}>;

const parseInts = (params: QueryParams) => {
  const result = {};
  for (const [key, value] of Object.entries(params)) {
    if (typeof value == "string") {
      const num = Number.parseInt(value);
      if (!Number.isNaN(num)) {
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
      if (!Number.isNaN(Date.parse(value))) {
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
  const twitter = new Client(process.env.TWITTER_BEARER_TOKEN);
  const serviceRoleSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

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
    supabase: serviceRoleSupabase,
    twitter,
  });

  res.status(200).json({
    users: users.map((x) => {
      return { ...x, id: x.id.toString() };
    }),
  });
}
