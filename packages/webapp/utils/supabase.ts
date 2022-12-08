import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { camelCase } from "lodash";

export const getServiceRoleSupabase = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

const userProfileFields = [
  "id",
  "twitter_oauth_state",
  "twitter_oauth_token",
  "twitter_id::text",
];

const userDetailsFields = [
  "id",
  "email",
  "twitter_id::text",
  "twitter_username",
  "twitter_oauth_token",
  "twitter_profile_image_url",
];

export type UserDetails = {
  id: string;
  email: string;
  twitter: {
    id: BigInt;
    username: string;
    profileImageUrl: string;
    oauthToken: any;
  } | null;
};

const parseUserDetails = (row: any) => {
  const camelCaseRow: any = Object.entries(row).reduce((prev, [key, value]) => {
    prev[camelCase(key)] = value;
    return prev;
  }, {});

  return {
    id: camelCaseRow.id,
    email: camelCaseRow.email,
    twitter: camelCaseRow.twitterId
      ? {
          id: BigInt(camelCaseRow.twitterId),
          username: camelCaseRow.twitterUsername,
          profileImageUrl: camelCaseRow.twitterProfileImageUrl,
          oauthToken: camelCaseRow.twitterOauthToken,
        }
      : null,
  };
};

export const getUserProfile = async (
  supabase: SupabaseClient
): Promise<any> => {
  const { data, error } = await supabase
    .from("user_profile")
    .select(userProfileFields.join(","));
  if (error) throw error;
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

  const { error } = await supabase
    .from("user_profile")
    .update({ twitter_oauth_state: { state, challenge } })
    .eq("id", user.id);
  if (error) throw error;
};

export const completeOauthFlow = async (
  supabase: SupabaseClient,
  userId: string,
  twitterId: string,
  oauthToken: any
) => {
  // Check if someone has this Twitter account linked already
  const { count, error: selectError } = await supabase
    .from("user_profile")
    .select("*", { count: "exact", head: true })
    .eq("twitter_id", twitterId);
  if (selectError) throw selectError;

  // If yes, then remove that link
  if (count) {
    const { error: removeLinkError } = await supabase
      .from("user_profile")
      .update({ twitter_oauth_token: null, twitter_id: null })
      .eq("twitter_id", twitterId);
    if (removeLinkError) throw removeLinkError;
  }

  // Link twitter to the new account
  const { error: addLinkError } = await supabase
    .from("user_profile")
    .update({
      twitter_oauth_state: null,
      twitter_oauth_token: oauthToken,
      twitter_id: twitterId,
    })
    .eq("id", userId);
  if (addLinkError) throw addLinkError;
};

export const updateUserProfile = async (
  supabase: SupabaseClient,
  userId: string,
  values: any
) => {
  const { error } = await supabase
    .from("user_profile")
    .update(values)
    .eq("id", userId);
  if (error) throw error;
};

export const getUserDetails = async (
  supabase: SupabaseClient
): Promise<UserDetails> => {
  const { data, error } = await supabase
    .from("user_details")
    .select(userDetailsFields.join(","));
  if (error) throw error;

  // @ts-ignore
  return data.length ? parseUserDetails(data[0]) : null;
};
