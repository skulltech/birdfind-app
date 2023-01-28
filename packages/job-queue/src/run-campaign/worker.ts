import {
  getTwitterClient,
  campaignColumns,
  serializeTwitterUser,
  tweetFields,
  twitterUserFields,
  serializeTweet,
} from "@birdfind/common";
import {
  findUsersById,
  TwitterResponse,
  usersIdTweets,
} from "twitter-api-sdk/dist/types";
import { dedupeObjects, supabase } from "../utils";

export const runCampaign = async (campaignId: number) => {
  // Get campaign from Supabase
  const { data: campaign } = await supabase
    .from("campaign")
    .select(campaignColumns)
    .eq("id", campaignId)
    .throwOnError()
    .single();

  // Get twitter client of user
  const { data: userProfile } = await supabase
    .from("user_profile")
    .select("twitter_oauth_token,twitter_id::text")
    .eq("id", campaign.user_id)
    .throwOnError()
    .single();
  const twitter = await getTwitterClient({
    clientId: process.env.TWITTER_CLIENT_ID,
    clientSecret: process.env.TWITTER_CLIENT_SECRET,
    supabase,
    userId: campaign.user_id,
    // @ts-ignore
    oauthToken: userProfile.twitter_oauth_token,
    origin: "https://app.birdfind.xyz",
  });

  // Prepare query
  const queryInputs = [...campaign.keywords.map((x: string) => `"${x}"`)];
  const query = `${queryInputs.join(" OR ")} lang:en -is:retweet`;

  let tweets: TwitterResponse<usersIdTweets>["data"];
  let users: TwitterResponse<findUsersById>["data"];
  try {
    const page = await twitter.tweets.tweetsRecentSearch({
      query,
      max_results: 100,
      "tweet.fields": tweetFields,
      "user.fields": twitterUserFields,
      expansions: ["author_id"],
    });

    tweets = page.data ?? [];
    users = page.includes?.users ?? [];
  } catch (error) {
    // If rate-limited, delay the job
    if (error.status == 429) {
      await supabase
        .from("twitter_api_rate_limit")
        .insert({
          // @ts-ignore
          twitter_id: userProfile.twitter_id,
          endpoint: "tweets-recent-search",
          resets_at: new Date(
            Number(error.headers["x-rate-limit-reset"]) * 1000
          ),
        })
        .throwOnError();
      return;
    } else throw error;
  }

  // Delete rate limit
  await supabase
    .from("twitter_api_rate_limit")
    .delete()
    .eq("endpoint", "tweets-recent-search")
    // @ts-ignore
    .eq("twitter_id", userProfile.twitter_id)
    .throwOnError();

  // If no tweets, finish the job
  if (tweets.length == 0) return;

  // Remove duplicates
  tweets = dedupeObjects(tweets);
  users = dedupeObjects(users);

  // Upsert users to database
  await supabase
    .from("twitter_profile")
    .upsert(users.map(serializeTwitterUser))
    .throwOnError();

  // Upsert domains and entities to database
  const domains = dedupeObjects(
    tweets
      .map((x) => x.context_annotations?.map((x) => x.domain))
      .flat()
      .filter(Boolean)
  );
  const entities = dedupeObjects(
    tweets
      .map((x) => x.context_annotations?.map((x) => x.entity))
      .flat()
      .filter(Boolean)
  );
  const domainsEntities = dedupeObjects(
    tweets
      .map((x) => x.context_annotations)
      .flat()
      .filter(Boolean)
      .map((x) => ({
        domain_id: x.domain.id,
        entity_id: x.entity.id,
      })),
    // Key to be used for deduping
    (x) => x.domain_id + x.entity_id
  );

  await supabase
    .from("domain")
    .upsert(domains.map((x) => ({ description: null, ...x })))
    .throwOnError();
  await supabase
    .from("entity")
    .upsert(entities.map((x) => ({ description: null, ...x })))
    .throwOnError();
  await supabase.from("domain_entity").upsert(domainsEntities).throwOnError();

  // Upsert tweets to database
  await supabase
    .from("tweet")
    .upsert(tweets.map(serializeTweet))
    .throwOnError();
  const tweetsEntities = dedupeObjects(
    tweets
      .map((x) => ({
        tweet_id: x.id,
        entity_id: x.context_annotations?.map((x) => x.entity.id),
      }))
      .filter((x) => x.entity_id)
      .flatMap((x) =>
        x.entity_id.map((y) => ({ tweet_id: x.tweet_id, entity_id: y }))
      ),
    // Key to be used for deduping
    (x) => x.tweet_id + x.entity_id
  );
  await supabase.from("tweet_entity").upsert(tweetsEntities).throwOnError();

  // Update campaign
  await supabase
    .from("campaign")
    .update({
      latest_tweet_id: tweets[0]?.id,
    })
    .eq("id", campaignId)
    .throwOnError();
};
