import { joinStrings } from "@birdfind/common";
import { SupabaseClient } from "@supabase/supabase-js";

const userProfileColumns = joinStrings(
  [
    "id",
    "twitter_oauth_state",
    "twitter_oauth_token",
    "twitter_id::text",
  ] as const,
  ","
);

const userDetailsColumns = joinStrings(
  [
    "id",
    "email",
    "twitter_id::text",
    "twitter_username",
    "twitter_oauth_token",
    "twitter_profile_image_url",
    "twitter_name",
  ] as const,
  ","
);

export type UserDetails = {
  id: string;
  email: string;
  twitter: {
    id: BigInt;
    username: string;
    profileImageUrl: string;
    oauthToken: any;
    name: string;
  } | null;
};

const parseUserDetails = (row: any) => {
  return {
    id: row.id,
    email: row.email,
    twitter: row.twitter_id
      ? {
          id: BigInt(row.twitter_id),
          username: row.twitter_username,
          profileImageUrl: row.twitter_profile_image_url,
          oauthToken: row.twitter_oauth_token,
          name: row.twitter_name,
        }
      : null,
  };
};

export const getUserProfile = async (
  supabase: SupabaseClient
): Promise<any> => {
  const { data } = await supabase
    .from("user_profile")
    .select(userProfileColumns)
    .throwOnError();
  return data.length ? data[0] : null;
};

export const startOauthFlow = async (
  supabase: SupabaseClient,
  state: string,
  challenge: string
) => {
  const {
    data: { user: user },
  } = await supabase.auth.getUser();

  await supabase
    .from("user_profile")
    .update({ twitter_oauth_state: { state, challenge } })
    .eq("id", user.id)
    .throwOnError();
};

export const completeOauthFlow = async (
  supabase: SupabaseClient,
  userId: string,
  twitterId: string,
  oauthToken: any
) => {
  // Check if someone has this Twitter account linked already
  const { count } = await supabase
    .from("user_profile")
    .select("*", { count: "exact", head: true })
    .eq("twitter_id", twitterId)
    .throwOnError();

  // If yes, then remove that link
  if (count)
    await supabase
      .from("user_profile")
      .update({ twitter_oauth_token: null, twitter_id: null })
      .eq("twitter_id", twitterId)
      .throwOnError();

  // Link twitter to the new account
  await supabase
    .from("user_profile")
    .update({
      twitter_oauth_state: null,
      twitter_oauth_token: oauthToken,
      twitter_id: twitterId,
    })
    .eq("id", userId)
    .throwOnError();
};

export const getUserDetails = async (
  supabase: SupabaseClient
): Promise<UserDetails> => {
  const { data } = await supabase
    .rpc("get_user_details")
    .select(userDetailsColumns)
    .throwOnError();
  // @ts-ignore
  return data.length ? parseUserDetails(data[0]) : null;
};
