import { SupabaseClient } from "@supabase/supabase-js";
import { auth, Client } from "twitter-api-sdk";

export type GetTwitterAuthClientArgs = {
  clientId: string;
  clientSecret: string;
  oauthToken?: auth.OAuth2UserOptions["token"];
};

export const getTwitterAuthClient = ({
  clientId,
  clientSecret,
  oauthToken,
}: GetTwitterAuthClientArgs) =>
  new auth.OAuth2User({
    client_id: clientId,
    client_secret: clientSecret,
    callback:
      process.env.NODE_ENV == "development"
        ? "http://127.0.0.1:3000/api/auth/twitter/callback"
        : "https://app.twips.xyz/api/auth/twitter/callback",
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
    token: oauthToken,
  });

type RequiredField<T, K extends keyof T> = T & Required<Pick<T, K>>;

export interface GetTwitterClientArgs
  extends RequiredField<GetTwitterAuthClientArgs, "oauthToken"> {
  supabase: SupabaseClient;
  userId: string;
}

export const getTwitterClient = async ({
  clientId,
  clientSecret,
  oauthToken,
  supabase,
  userId,
}: GetTwitterClientArgs) => {
  // Refresh token and save it to Supabase if it has expired
  if (oauthToken.expires_at <= Date.now()) {
    const authClient = getTwitterAuthClient({
      clientId,
      clientSecret,
      oauthToken,
    });
    const { token } = await authClient.refreshAccessToken();

    // Update refreshed token in Supabase
    const { error } = await supabase
      .from("user_profile")
      .update({ twitter_oauth_token: token })
      .eq("id", userId);
    if (error) throw error;

    oauthToken = token;
  }

  return new Client(oauthToken.access_token);
};
