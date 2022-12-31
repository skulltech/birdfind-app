import * as dotenv from "dotenv";
import winston from "winston";
import TelegramLogger from "winston-telegram";
import { createClient } from "@supabase/supabase-js";
import { ConnectionOptions, Queue } from "bullmq";
import { Client } from "pg";
dotenv.config();

// To suppress warnings
process.removeAllListeners("warning");

// Monkeypatching BigInt
BigInt.prototype["toJSON"] = function () {
  return this.toString();
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

export const queue = new Queue<number, void, JobName>("twips-jobs", {
  connection,
  defaultJobOptions: {
    // Keep up to 1 hour and 100 jobs
    removeOnComplete: true,
    // Keep up to 48 hours and 1000 jobs
    removeOnFail: {
      age: 48 * 3600,
      count: 1000,
    },
  },
});

export const getPgClient = async () => {
  const client = new Client(process.env.PG_CONNECTION);
  await client.connect();
  return client;
};

export type JobName = "update-relation" | "add-list-members";

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));
