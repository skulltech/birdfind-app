import { twitterUserFields } from "@twips/lib";
import { auth, Client } from "twitter-api-sdk";

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

export const getTwitterUser = async (twitter: Client, username: string) => {
  const { data: user } = await twitter.users.findUserByUsername(username, {
    "user.fields": twitterUserFields,
  });
  return user;
};

export const getSignedInTwitterUser = async (twitter: Client) => {
  const { data: profile } = await twitter.users.findMyUser({
    "user.fields": twitterUserFields,
  });
  return profile;
};
