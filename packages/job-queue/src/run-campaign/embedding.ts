import { serializeTweet, tweetColumns, tweetFields } from "@birdfind/common";
import { SupabaseClient } from "@supabase/supabase-js";
import { Configuration, OpenAIApi } from "openai";
import { Client } from "twitter-api-sdk";
import { dedupeObjects } from "../utils";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

type CreateProfileEmbeddingArgs = {
  user: {
    id: string;
    name: string;
    description: string;
    latest_tweet_id: string;
    embedding_updated_at: string;
  };
  supabase: SupabaseClient;
  twitter: Client;
};

export const updateProfileEmbedding = async ({
  user: { id, name, description, latest_tweet_id, embedding_updated_at },
  supabase,
  twitter,
}: CreateProfileEmbeddingArgs) => {
  // Get at most 100 most recent tweets
  const { data, meta } = await twitter.tweets.usersIdTweets(id, {
    max_results: 100,
    exclude: ["replies", "retweets"],
    "tweet.fields": tweetFields,
    since_id: latest_tweet_id,
  });
  if (meta.result_count === 0) return;

  // Insert tweets into database
  const tweets = data;
  await supabase
    .from("tweet")
    .upsert(dedupeObjects(tweets).map(serializeTweet));

  // Check if there are at least 50 more tweets since the last update
  const { count } = await supabase
    .from("tweet")
    .select("id", { count: "exact" })
    .eq("author_id", id)
    .gt("tweet_created_at", embedding_updated_at)
    .throwOnError()
    .maybeSingle();
  if (count < 50) return;

  // Get top 50 tweets by likes from database
  const { data: topTweets } = await supabase
    .from("tweet")
    .select(tweetColumns)
    .eq("author_id", id)
    .order("like_count", { ascending: false })
    .limit(50)
    .throwOnError();

  // Get embedding vector of profile and save in database
  const response = await openai.createEmbedding({
    model: "text-embedding-ada-002",
    input: [name, description, topTweets.map((x: any) => x.text)].join("\n"),
  });
  const embedding = response.data.data[0].embedding;
  await supabase
    .from("twitter_profile")
    .update({ embedding, embedding_updated_at: new Date().toISOString() })
    .eq("id", id);
};
