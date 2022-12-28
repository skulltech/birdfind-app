import winston from "winston";
import TelegramLogger from "winston-telegram";
import * as dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { ConnectionOptions, Queue } from "bullmq";
import { Client } from "pg";
import ms from "ms";
dotenv.config();

// To suppress warnings
process.removeAllListeners("warning");

export const dedupeUsers = <T extends { id: string }>(arr: T[]) => {
  const dedupedUsers = new Set<string>();

  return arr.filter((x) => {
    if (dedupedUsers.has(x.id)) return false;
    dedupedUsers.add(x.id);
    return true;
  });
};

const formatTelegramMessage = ({ level, message, metadata }) => `
<strong>[${level}]</strong> ${message}

<pre>${
  metadata
    ? JSON.stringify(metadata, null, 2)
        // Remove JSON delimiters
        .replaceAll("{", "")
        .replaceAll("}", "")
        .replaceAll('"', "")
        .replaceAll(",", "")
        // Get array of lines
        .split("\n")
        // Remove first level of indentation
        .map((x) => x.slice(2, x.length))
        // Get rid of empty lines
        .filter((x) => x.replace(/\s/g, "").length)
        // Join to a single string
        .join("\n")
    : "null"
}</pre>
`;

export const logger = winston.createLogger({
  transports: [
    new winston.transports.Console(),
    new TelegramLogger({
      token: process.env.TELEGRAM_API_KEY,
      chatId: parseInt(process.env.TELEGRAM_CHAT_ID),
      parseMode: "HTML",
      formatMessage: formatTelegramMessage,
    }),
  ],
});

export const supabase = createClient(
  process.env.SUPABASE_API_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const connection: ConnectionOptions = {
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT),
  password: process.env.REDIS_PASSWORD,
};

export const queue = new Queue<number>("update-relation", {
  connection,
});

export const updateRelationJobColumns = [
  "id",
  "created_at",
  "updated_at",
  "user_id",
  "relation",
  "target_twitter_id::text",
  "priority",
  "finished",
  "pagination_token",
  "updated_count",
  "paused",
];

export const pgClient = new Client(process.env.PG_CONNECTION);

const formatDate = (str: string) => new Date(str).toLocaleString("en-IN");

// Get log metadata object
export const getLog = async (jobId: number) => {
  // Get job details
  const { data: jobData, error: getJobError } = await supabase
    .from("update_relation_job")
    .select(updateRelationJobColumns.join(","))
    .eq("id", jobId)
    .single();
  if (getJobError) throw getJobError;
  const job = jobData as any;

  // Get user details
  const { data: userDetailsData, error: getUserDetailsError } = await supabase
    .rpc("get_user_details", {
      id: job.user_id,
    })
    .select("email,twitter_username,twitter_id::text")
    .single();
  if (getUserDetailsError) throw getUserDetailsError;
  const userDetails = userDetailsData as any;

  // Get target Twitter username
  const { data: targetDetails, error: getTwitterProfileError } = await supabase
    .from("twitter_profile")
    .select("username")
    .eq("id", job.target_twitter_id)
    .single();
  if (getTwitterProfileError) throw getTwitterProfileError;

  // Get rate limit information
  const { data: rateLimit, error: getRateLimitError } = await supabase
    .from("twitter_api_rate_limit")
    .select("resets_at")
    .eq("endpoint", "get-" + job.relation)
    .eq("user_twitter_id", userDetails.twitter_id)
    .maybeSingle();
  if (getRateLimitError) throw getRateLimitError;

  // Return log metadata object
  return {
    id: job.id,
    user: {
      user_id: job.user_id,
      email: userDetails.email,
      twitter_username: "@" + userDetails.twitter_username,
    },
    target: {
      twitter_username: "@" + targetDetails.username,
      twitter_id: job.target_twitter_id,
    },
    relation: job.relation,
    rate_limit_resets_at: rateLimit ? formatDate(rateLimit.resets_at) : null,
    created_at: formatDate(job.created_at),
    updated_at: formatDate(job.updated_at),
    time_elapsed: ms(
      new Date(job.updated_at).getTime() - new Date(job.created_at).getTime()
    ),
    updated_count: job.updated_count,
    pagination_token: job.pagination_token,
    priority: job.priority,
  };
};
