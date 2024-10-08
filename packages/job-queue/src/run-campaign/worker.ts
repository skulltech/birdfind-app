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
  const { data: campaignData } = await supabase
    .from("campaign")
    .select(campaignColumns)
    .eq("id", campaignId)
    .throwOnError()
    .single();
  const campaign = campaignData as any;

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

  // Whether to start new pagination or continue the last one
  const startNewPagination =
    // Pagination started over a day ago
    dayjs().diff(campaign.pagination_started_at, "hour") > 24 ||
    // First run
    campaign.pagination_started_at == null;
  console.log("startNewPagination", startNewPagination, {
    pagination_token: startNewPagination ? null : campaign.pagination_token,
    since_id: startNewPagination ? campaign.latest_tweet_id : null,
  });

  const page = await twitter.tweets.tweetsRecentSearch({
    query,
    max_results: 100,
    "tweet.fields": tweetFields,
    "user.fields": twitterUserFields,
    expansions: ["author_id"],
    pagination_token: startNewPagination ? null : campaign.pagination_token,
    since_id: startNewPagination ? campaign.latest_tweet_id : null,
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

  console.log("Updating campaign", {
    pagination_token: page.meta.next_token,
    latest_tweet_id: page.meta.newest_id,
  });

  // Update campaign
  await supabase
    .from("campaign")
    .update({
      // Pagination fields
      pagination_token: page.meta.next_token,
      latest_tweet_id: page.meta.newest_id,
      pagination_started_at: startNewPagination
        ? new Date().toISOString()
        : campaign.pagination_started_at,

      // Rate limiting fields
      last_run_at: new Date().toISOString(),
      tweets_fetched_today: dayjs(campaign.last_run_at).isYesterday()
        ? tweets.length
        : campaign.tweets_fetched_today + tweets.length,
    })
    .eq("id", campaignId)
    .throwOnError();
};
