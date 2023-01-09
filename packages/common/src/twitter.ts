import { SupabaseClient } from "@supabase/supabase-js";
import { auth, Client } from "twitter-api-sdk";

export type GetTwitterAuthClientArgs = {
  clientId: string;
  clientSecret: string;
  oauthToken?: auth.OAuth2UserOptions["token"];
  origin: string;
};

export const getTwitterAuthClient = ({
  clientId,
  clientSecret,
  oauthToken,
  origin,
}: GetTwitterAuthClientArgs) =>
  new auth.OAuth2User({
    client_id: clientId,
    client_secret: clientSecret,
    callback: new URL("/api/auth/twitter/callback", origin).toString(),
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
      "list.read",
      "list.write",
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
  origin,
}: GetTwitterClientArgs) => {
  // Refresh token and save it to Supabase if it has expired
  if (oauthToken.expires_at <= Date.now()) {
    const authClient = getTwitterAuthClient({
      clientId,
      clientSecret,
      oauthToken,
      origin,
    });
    const { token } = await authClient.refreshAccessToken();

    // Update refreshed token in Supabase
    await supabase
      .from("user_profile")
      .update({ twitter_oauth_token: token })
      .eq("id", userId)
      .throwOnError();

    oauthToken = token;
  }

  return new Client(oauthToken.access_token);
};
