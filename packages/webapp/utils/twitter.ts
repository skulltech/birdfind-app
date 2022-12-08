import { SupabaseClient } from "@supabase/supabase-js";
import { twitterUserFields } from "@twips/lib";
import { auth, Client } from "twitter-api-sdk";
import { updateUserProfile } from "./supabase";

export const getTwitterAuthClient = (token?: any) =>
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
    token,
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

export const getTwitterClient = async (
  supabase: SupabaseClient,
  userId: string,
  oauthToken: any
) => {
  console.log(
    "Token expires at",
    new Date(oauthToken.expires_at).toLocaleTimeString()
  );
  // Refresh token and save it to DB if it has expired
  if (oauthToken.expires_at <= Date.now() / 1000) {
    const authClient = getTwitterAuthClient(oauthToken);
    const { token } = await authClient.refreshAccessToken();
    await updateUserProfile(supabase, userId, { twitter_oauth_token: token });
    oauthToken = token;
  }

  return new Client(oauthToken.access_token);
};
