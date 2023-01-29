import * as dotenv from "dotenv";
import winston from "winston";
import TelegramLogger from "winston-telegram";
import { createClient } from "@supabase/supabase-js";
import { Client } from "pg";
import { JobName } from "@birdfind/common";
import { ConnectionOptions, Queue } from "bullmq";
dotenv.config();

// To suppress warnings
process.removeAllListeners("warning");

// Monkeypatching types for JSON serialization
BigInt.prototype["toJSON"] = function () {
  return this.toString();
};
Set.prototype["toJSON"] = function () {
  return Array.from(this);
};
Date.prototype["toJSON"] = function () {
  return this.toISOString();
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

export const queue = new Queue<number, void, JobName>("birdfind-jobs", {
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

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const addRunCampaignJobs = async () => {
  // Get postgres client
  const pgClient = await getPgClient();

  while (true) {
    try {
      // Get jobs from queue
      const jobsinQueue = (await queue.getJobs(["active", "waiting", "failed"]))
        .filter((x) => x != undefined)
        .filter((x) => x.name == "run-campaign")
        .map((x) => x.data);

      // Get jobs which can be added
      const result = await pgClient.query({
        text: "select id,name from campaign where paused=false and deleted=false and not (id = any($1))",
        values: [jobsinQueue],
      });

      // Add jobs
      for (const campaign of result.rows) {
        console.log("Adding job for campaign", campaign.name);
        await queue.add("run-campaign", campaign.id);
      }
    } catch (error) {
      logger.error("Error at daemon while adding run-campaign jobs", {
        metadata: { error },
      });
    }

    // Sleep for 1 hour
    await sleep(60 * 60 * 1000);
  }
};

export const formatDate = (str: string) =>
  new Date(str).toLocaleString("en-IN");

export const getUserProfileEventListener = () =>
  supabase.channel("public:user_profile").on(
    "postgres_changes",
    // User registration
    { event: "INSERT", schema: "public", table: "user_profile" },
    async (payload) =>
      logger.info("New user registered", {
        metadata: { email: payload.new.email },
      })
  );

export const dedupeObjects = <T>(
  arr: T[],
  // @ts-ignore
  getKey: (arg: T) => string = (x) => x.id
) => {
  const dedupedObjects = new Set<string>();

  return arr.filter((x) => {
    const key = getKey(x);
    if (dedupedObjects.has(key)) return false;
    dedupedObjects.add(key);
    return true;
  });
};
