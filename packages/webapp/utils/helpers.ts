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

export type TwitterProfile = {
  id: BigInt;
  username: string;
  name: string;
  userCreatedAt: Date;
  description: string;
  location?: string;
  profileImageUrl: string;
  protected: boolean;
  followersCount: number;
  followingCount: number;
  tweetCount: number;
  listedCount: number;
  verified: boolean;
};

export const parseTwitterProfile = (row: any): TwitterProfile => {
  const x: any = Object.entries(row).reduce((prev, [key, value]) => {
    prev[camelcase(key)] = value;
    return prev;
  }, {});

  return {
    id: BigInt(x.id),
    userCreatedAt: new Date(x.userCreatedAt),
    username: x.username,
    name: x.name,
    description: x.description,
    location: x.location,
    profileImageUrl: x.profileImageUrl,
    protected: x.protected,
    followersCount: x.followersCount,
    followingCount: x.followingCount,
    tweetCount: x.tweetCount,
    listedCount: x.listedCount,
    verified: x.verified,
  };
};

export type Tweet = {
  id: BigInt;
  authorId: BigInt;
  text: string;
  tweetCreatedAt: Date;
  retweetCount: number;
  replyCount: number;
  likeCount: number;
  quoteCount: number;
};

export const parseTweet = (row: any): Tweet => {
  const x: any = Object.entries(row).reduce((prev, [key, value]) => {
    prev[camelcase(key)] = value;
    return prev;
  }, {});

  return {
    id: BigInt(x.id),
    authorId: BigInt(x.authorId),
    tweetCreatedAt: new Date(x.tweetCreatedAt),
    text: x.text,
    retweetCount: x.retweetCount,
    replyCount: x.replyCount,
    likeCount: x.likeCount,
    quoteCount: x.quoteCount,
  };
};

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
