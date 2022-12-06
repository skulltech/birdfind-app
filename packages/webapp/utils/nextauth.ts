import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: "next_auth" } }
);

export type TwitterToken = {
  accessToken: string;
  profile: {
    profile_image_url: string;
    username: string;
    name: string;
    id: string;
  };
};

// Get the user linked with an oauth account
export const getUserByOauthAccount = async (providerAccountId: string) => {
  const { data, error } = await supabase
    .from("accounts")
    .select("*")
    .eq("providerAccountId", providerAccountId);
  if (error) throw error;

  return data.length ? data[0] : null;
};

// Get the Oauth account linked with user
export const getOauthAccountByUser = async (
  userId: string,
  provider: string
) => {
  const { data, error } = await supabase
    .from("accounts")
    .select("*")
    .eq("userId", userId)
    .eq("provider", provider);
  if (error) throw error;

  return data.length ? data[0] : null;
};
