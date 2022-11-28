import type { NextApiRequest, NextApiResponse } from "next";
import { searchUsers } from "../../lib/search";
import { camelCase } from "lodash";

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
  });

  res.status(200).json({
    users: users.map((x) => {
      return { ...x, id: x.id.toString() };
    }),
  });
}
