import { auth, Client } from "twitter-api-sdk";
import {
  TwitterParams,
  findMyUser,
  findUserByUsername,
} from "twitter-api-sdk/dist/types";

export const getTwitterAuthClient = () =>
  new auth.OAuth2User({
    client_id: process.env.TWITTER_CLIENT_ID,
    client_secret: process.env.TWITTER_CLIENT_SECRET,
    callback: "http://127.0.0.1:3000/api/auth/twitter/callback",
    scopes: [
      "users.read",
      "tweet.read",
      "follows.read",
      "follows.write",
      "mute.read",
      "mute.write",
      "block.read",
      "block.write",
      "offline.access",
    ],
  });

const userFields:
  | TwitterParams<findMyUser>["user.fields"]
  | TwitterParams<findUserByUsername>["user.fields"] = [
  "created_at",
  "description",
  "entities",
  "location",
  "pinned_tweet_id",
  "profile_image_url",
  "protected",
  "public_metrics",
  "url",
  "verified",
  "withheld",
];

export const getTwitterProfile = async (token, username: string) => {
  const authClient = getTwitterAuthClient();
  authClient.token = token;

  const client = new Client(authClient);
  const { data: profile } = await client.users.findUserByUsername(username, {
    "user.fields": userFields,
  });

  return profile;
};

export const getTwitterProfileOfUser = async (token) => {
  const authClient = getTwitterAuthClient();
  authClient.token = token;

  const client = new Client(authClient);
  const { data: profile } = await client.users.findMyUser({
    "user.fields": userFields,
  });

  return profile;
};
