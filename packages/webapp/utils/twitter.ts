import { twitterUserFields } from "@twips/common";
import { Client } from "twitter-api-sdk";

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

export const twitterSecrets = {
  clientId: process.env.TWITTER_CLIENT_ID,
  clientSecret: process.env.TWITTER_CLIENT_SECRET,
};
