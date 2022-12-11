import Client from "twitter-api-sdk";
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { updateNetwork } from "@twips/lib";
dotenv.config();

const main = async () => {
  const supabase = createClient(
    process.env.SUPABASE_API_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  const twitter = new Client(process.env.TWITTER_BEARER_TOKEN);

  // const result = await getUsers({ usernames: ["summitkg"], supabase });

  // const result = await searchUsers({
  //   filters: {
  //     followerOf: ["summitkg", "ghuubear"],
  //     followedBy: ["simranster"],
  //     // tweetCountGreaterThan: 200,
  //     // followersCountGreaterThan: 10,
  //   },
  //   supabase,
  //   twitter,
  // });
  // console.log(result);
  // console.log(result.length);

  const result = await updateNetwork({
    // userId: BigInt(44196397),
    userId: BigInt("1575106696334413825"),
    supabase,
    twitter,
    relation: "blocking",
  });
  console.log(result);
};

main()
  .then(() => {})
  .catch((error) => {
    console.log(error);
  });
