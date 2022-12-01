import { searchUsers } from "./packages/lib/src";
import Client from "twitter-api-sdk";
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config();

const main = async () => {
  const supabase = createClient(
    process.env.SUPABASE_API_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  const twitter = new Client(process.env.TWITTER_BEARER_TOKEN);

  const result = await searchUsers({
    filters: {
      followerOf: ["summitkg", "philomathamit", "ghuubear"],
      followedBy: ["simranster"],
      tweetCountGreaterThan: 200,
      followersCountGreaterThan: 10,
      // createdBefore: new Date(2016, 1, 1),
    },
    supabase,
    twitter,
    options: {
      // useCacheOnly: false,
      // forceRefreshCache: true,
    },
  });
  console.log(result);
  console.log(result.length);
};

main()
  .then(() => {})
  .catch((error) => {
    console.log(error);
  });
