import { getTwitterAuthClient } from "@twips/common";
import { supabase } from "../utils";

export const refreshTwitterTokens = async () => {
  // Get all users
  const { data: userProfiles } = await supabase
    .from("user_profile")
    .select("id,twitter_oauth_token")
    .throwOnError();

  for (const userProfile of userProfiles) {
    const authClient = getTwitterAuthClient({
      clientId: process.env.TWITTER_CLIENT_ID,
      clientSecret: process.env.TWITTER_CLIENT_SECRET,
      oauthToken: userProfile.twitter_oauth_token,
      origin: "https://app.twips.xyz",
    });

    let oauthToken: any;
    try {
      const { token } = await authClient.refreshAccessToken();
      oauthToken = token;
    } catch (error) {
      // If expired or invalid, then delete the Twitter link
      if (error.status == 400) {
        await supabase
          .from("user_profile")
          .update({ twitter_oauth_token: null, twitter_id: null })
          .eq("id", userProfile.id)
          .throwOnError();
        return;
      }
    }

    // Update on Supabase if successfully refreshed
    await supabase
      .from("user_profile")
      .update({ twitter_oauth_token: oauthToken })
      .eq("id", userProfile.id)
      .throwOnError();
  }
};
