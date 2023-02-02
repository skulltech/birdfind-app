import {
  getTwitterClient,
  campaignColumns,
  serializeTwitterUser,
  tweetFields,
  twitterUserFields,
  serializeTweet,
} from "@birdfind/common";
import { dedupeObjects, supabase } from "../utils";
import dayjs from "dayjs";
import isYesterday from "dayjs/plugin/isYesterday";
import { SupabaseClient } from "@supabase/supabase-js";
import { Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

dayjs.extend(isYesterday);

const getCampaignQuery = async (
  id: number,
  supabase: SupabaseClient
): Promise<string> => {
  // Get all entities
  const { data: campaignEntities } = await supabase
    .from("campaign_entity")
    .select("entity_id::text,is_positive")
    .eq("campaign_id", id)
    .throwOnError();

  const entities = [];
  for (const campaignEntity of campaignEntities) {
    const { data: entityDomains } = await supabase
      .from("domain_entity")
      .select("domain_id")
      // @ts-ignore
      .eq("entity_id", campaignEntity.entity_id)
      .throwOnError();
    entities.push(
      ...entityDomains.map((x) => ({
        domain_id: x.domain_id,
        // @ts-ignore
        entity_id: campaignEntity.entity_id,
        // @ts-ignore
        is_positive: campaignEntity.is_positive,
      }))
    );
  }

  // Get all keywords
  const { data: keywords } = await supabase
    .from("campaign_keyword")
    .select("keyword,is_positive")
    .eq("campaign_id", id)
    .throwOnError();

  const positiveConstraints = [
    ...entities
      .filter((x) => x.is_positive)
      .map((x) => `domain:${x.domain_id} entity:${x.entity_id}`),
    ...keywords.filter((x) => x.is_positive).map((x) => `"${x.keyword}"`),
  ];
  const negativeConstraints = [
    ...entities
      .filter((x) => !x.is_positive)
      .map((x) => `domain:${x.domain_id} entity:${x.entity_id}`),
    ...keywords.filter((x) => !x.is_positive).map((x) => `"${x.keyword}"`),
  ];

  const query =
    positiveConstraints.join(" OR ") +
    (negativeConstraints.length > 0
      ? " -(" + negativeConstraints.join(" OR ") + ")"
      : "") +
    " lang:en -is:retweet -is:reply -is:quote";
  return query;
};

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

  // Create query from constraints
  const query = await getCampaignQuery(campaign.id, supabase);

  const page = await twitter.tweets.tweetsRecentSearch({
    query,
    max_results: 100,
    "tweet.fields": tweetFields,
    "user.fields": twitterUserFields,
    expansions: ["author_id"],
    sort_order: "relevancy",
    since_id: campaign.latest_tweet_id,
  });
  let tweets = page.data ?? [];
  let users = page.includes?.users ?? [];

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

  // Get tweet embeddings
  const tweetsToInsert = [];
  for (const tweet of tweets.map(serializeTweet)) {
    const response = await openai.createEmbedding({
      model: "text-embedding-ada-002",
      input: tweet.text,
    });
    const embedding = response.data.data[0].embedding;
    tweetsToInsert.push({ embedding, ...tweet });
  }

  // Upsert tweets to database
  await supabase.from("tweet").upsert(tweetsToInsert).throwOnError();
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
      latest_tweet_id: tweets.sort(
        (a, b) =>
          // Sort by created at descending
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0].id,
      last_run_at: new Date().toISOString(),
      tweets_fetched_today: dayjs(campaign.last_run_at).isYesterday()
        ? tweets.length
        : campaign.tweets_fetched_today + tweets.length,
    })
    .eq("id", campaignId)
    .throwOnError();
};
