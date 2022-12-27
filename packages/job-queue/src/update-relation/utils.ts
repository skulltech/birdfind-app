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

export const updateRelationColumns = [
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
];

export const pgClient = new Client(process.env.PG_CONNECTION);

export const prettifyLog = async (log: any) => {
  const { data: userDetails, error: getUserDetailsError } = await supabase
    .rpc("get_user_details", {
      id: log.user_id,
    })
    .select("email,twitter_username")
    .single();
  if (getUserDetailsError) throw getUserDetailsError;

  const { data: targetDetails, error: getTwitterProfileError } = await supabase
    .from("twitter_profile")
    .select("username")
    .eq("id", log.target_twitter_id)
    .single();
  if (getTwitterProfileError) throw getTwitterProfileError;

  return {
    id: log.id,
    user: {
      user_id: log.user_id,
      email: userDetails.email,
      twitter_username: "@" + userDetails.twitter_username,
    },
    target: {
      twitter_username: "@" + targetDetails.username,
      twitter_id: log.target_twitter_id,
    },
    relation: log.relation,
    created_at: new Date(log.created_at).toLocaleString("en-IN"),
    updated_at: new Date(log.updated_at).toLocaleString("en-IN"),
    time_elapsed: ms(
      new Date(log.updated_at).getTime() - new Date(log.created_at).getTime()
    ),
    updated_count: log.updated_count,
    pagination_token: log.pagination_token,
    priority: log.priority,
  };
};
