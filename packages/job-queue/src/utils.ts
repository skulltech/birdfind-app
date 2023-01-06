import * as dotenv from "dotenv";
import winston from "winston";
import TelegramLogger from "winston-telegram";
import { createClient } from "@supabase/supabase-js";
import { ConnectionOptions, Queue } from "bullmq";
import { Client } from "pg";
import { JobName } from "@twips/common";
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

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const addJobs = async (pgClient: Client, name: JobName) => {
  // Get jobs from queue
  const activeJobs = (await queue.getJobs(["active", "waiting"]))
    .filter((x) => x != undefined)
    .filter((x) => x.name == name)
    .map((x) => x.data);

  const failedJobs = (await queue.getFailed())
    .filter((x) => x != undefined)
    .filter((x) => x.name == name)
    .map((x) => x.data);

  // Get jobs which can be added
  const result = await pgClient.query({
    text:
      name == "lookup-relation"
        ? "select id from get_lookup_relation_jobs_to_add($1, $2)"
        : name == "manage-list-members"
        ? "select id from get_manage_list_members_jobs_to_add($1, $2)"
        : name == "manage-relation"
        ? "select id from get_manage_relation_jobs_to_add($1, $2)"
        : null,
    values: [activeJobs, failedJobs],
  });
  const jobIds = result.rows.map((x) => x.id);

  // Add jobs
  for (const jobId of jobIds) await queue.add(name, jobId);
};

export const runAddJobsLoop = async (name: JobName) => {
  // Get postgres client
  const pgClient = await getPgClient();

  while (true) {
    try {
      await addJobs(pgClient, name);
    } catch (error) {
      logger.error(`Error at daemon while adding ${name} jobs`, {
        metadata: { error },
      });
    }
    // Sleep for 2 seconds
    sleep(2 * 1000);
  }
};

export const formatDate = (str: string) =>
  new Date(str).toLocaleString("en-IN");

export const getUserProfileEventListener = () =>
  supabase
    .channel("public:user_profile")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "user_profile" },
      async (payload) => {
        if (payload.eventType == "INSERT" || payload.eventType == "UPDATE") {
          const { data: userDetails } = await supabase
            .rpc("get_user_details", {
              id: payload.new.id,
            })
            .select("email,twitter_username,twitter_name")
            .throwOnError()
            .single();
          logger.info(
            payload.eventType == "INSERT" ? "User registered" : "User updated",
            {
              metadata: {
                email: userDetails.email,
                twitter: userDetails.twitter_username
                  ? {
                      username: "@" + userDetails.twitter_username,
                      name: userDetails.twitter_name,
                    }
                  : null,
              },
            }
          );
        }
      }
    );
