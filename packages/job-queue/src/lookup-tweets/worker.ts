import {
  getTwitterClient,
  serializeTwitterUser,
  twitterUserFields,
} from "@birdfind/common";
import {
  TwitterResponse,
  usersIdFollowing,
  usersIdTweets,
} from "twitter-api-sdk/dist/types";
import { dedupeObjects, supabase } from "../utils";

export const lookupRelation = async (jobId: number) => {
  // Get job from Supabase
  const { data: jobData } = await supabase
    .from("lookup_tweets_job")
    .select(lookupTweetsJobColumns.join(","))
    .eq("id", jobId)
    .throwOnError()
    .single();
  const job = jobData as any;

  // Return immediately if job is finished
  if (job.finished) return;

  const endpoint = "lookup-tweets";

  // Get twitter client of user
  const { data: userProfileData } = await supabase
    .from("user_profile")
    .select("twitter_id::text,twitter_oauth_token")
    .eq("id", job.user_id)
    .throwOnError()
    .single();
  const userProfile = userProfileData as any;

  const twitter = await getTwitterClient({
    clientId: process.env.TWITTER_CLIENT_ID,
    clientSecret: process.env.TWITTER_CLIENT_SECRET,
    supabase,
    userId: job.user_id,
    oauthToken: userProfile.twitter_oauth_token,
    origin: "https://app.birdfind.xyz",
  });

  let tweets: TwitterResponse<usersIdTweets>["data"];
  let paginationToken = job.pagination_token;

  try {
    const page = await twitter.tweets.usersIdTweets(job.target_id, {
      max_results: 100,
      "tweet.fields": [
        "attachments",
        "author_id",
        "context_annotations",
        "conversation_id",
        "created_at",
        "edit_controls",
        "edit_history_tweet_ids",
        "entities",
        "geo",
        "in_reply_to_user_id",
        "lang",
        "possibly_sensitive",
        "public_metrics",
        "referenced_tweets",
        "reply_settings",
        "source",
        "text",
        "withheld",
      ],
      expansions: [
        "author_id",
        "attachments.media_keys",
        "referenced_tweets.id",
        "referenced_tweets.id.author_id",
      ],
      pagination_token: paginationToken,
    });

    tweets = page.data ?? [];
    paginationToken = page.meta.next_token ?? null;
  } catch (error) {
    // If rate-limited, delay the job
    if (error.status == 429) {
      await supabase
        .from("twitter_api_rate_limit")
        .insert({
          user_twitter_id: userProfile.twitter_id,
          endpoint,
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
    .update({ deleted: true })
    .eq("endpoint", endpoint)
    .eq("user_twitter_id", userProfile.twitter_id)
    .throwOnError();

  // Remove duplicates
  tweets = dedupeObjects(tweets);

  // Upsert users to database
  await supabase
    .from("twitter_tweet")
    .upsert(tweets.map(serializeTwitterUser))
    .throwOnError();

  // Upsert relations to database
  await supabase
    .from(relationTable)
    .upsert(
      users.map((x) => {
        // Only in the case of followers target user is target_id
        const row =
          relation == "followers"
            ? {
                source_id: x.id,
                target_id: job.target_id,
              }
            : { source_id: job.target_id, target_id: x.id };
        return {
          ...row,
          to_delete: false,
        };
      })
    )
    .throwOnError();

  // When no more pagination remaining
  const finished = paginationToken === null;

  if (finished) {
    // delete old relations with delete flag
    await supabase
      .from(relationTable)
      .delete()
      // Only in the case of followers the user is target_id
      .eq(relation == "followers" ? "target_id" : "source_id", job.target_id)
      .eq("to_delete", true)
      .throwOnError();

    // Update user's relationUpdatedAt field in database
    await supabase
      .from("twitter_profile")
      .update({ [`${relation}_updated_at`]: new Date() })
      .eq("id", job.target_id)
      .throwOnError();
  }

  // Update job
  await supabase
    .from("lookup_relation_job")
    .update({
      pagination_token: paginationToken,
      updated_count: job.updated_count + users.length,
      priority: job.priority - 1,
      finished,
    })
    .eq("id", jobId)
    .throwOnError();
};
