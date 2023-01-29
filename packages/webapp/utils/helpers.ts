import camelcase from "camelcase";
import { NextApiRequest } from "next";
import { z } from "zod";

// Custom bigint Zod type
export const zodBigint = z.string().refine((x) => {
  try {
    BigInt(x);
    return true;
  } catch (error) {
    return false;
  }
});

export const parseTwitterProfile = (row: any): TwitterProfile => {
  const x: any = Object.entries(row).reduce((prev, [key, value]) => {
    prev[camelcase(key)] = value;
    return prev;
  }, {});

  return {
    ...x,
    id: BigInt(x.id),
    pinnedTweetId: x.pinnedTweetId ? BigInt(x.pinnedTweetId) : null,
    createdAt: new Date(x.createdAt),
    updatedAt: new Date(x.updatedAt),
    followersUpdatedAt: new Date(x.followersUpdatedAt),
    followingUpdatedAt: new Date(x.followingUpdatedAt),
    blockingUpdatedAt: new Date(x.blockingUpdatedAt),
    mutingUpdatedAt: new Date(x.mutingUpdatedAt),
    userCreatedAt: new Date(x.userCreatedAt),
  };
};

export type TwitterProfile = {
  id: BigInt;
  createdAt: Date;
  updatedAt: Date;
  followersUpdatedAt: Date;
  followingUpdatedAt: Date;
  blockingUpdatedAt: Date;
  mutingUpdatedAt: Date;
  username: string;
  name: string;
  userCreatedAt: Date;
  description: string;
  entities?: object;
  location?: string;
  pinnedTweetId?: BigInt;
  profileImageUrl: string;
  protected: boolean;
  followersCount: number;
  followingCount: number;
  tweetCount: number;
  listedCount: number;
  url?: string;
  verified: boolean;
  withheld?: object;
};

export const twitterListFields = [
  "created_at",
  "description",
  "follower_count",
  "member_count",
  "private",
];

function isLocalNetwork(hostname = window.location.host) {
  return (
    hostname.startsWith("localhost") ||
    hostname.startsWith("127.0.0.1") ||
    hostname.startsWith("192.168.") ||
    hostname.startsWith("10.0.") ||
    hostname.endsWith(".local")
  );
}

export const getOrigin = (req: NextApiRequest) => {
  const host = req.headers.host;
  const protocol = isLocalNetwork(host) ? "http:" : "https:";
  return protocol + "//" + host;
};
