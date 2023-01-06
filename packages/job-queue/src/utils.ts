import * as dotenv from "dotenv";
import winston from "winston";
import TelegramLogger from "winston-telegram";
import {
  createClient,
  RealtimePostgresInsertPayload,
  RealtimePostgresUpdatePayload,
} from "@supabase/supabase-js";
import { ConnectionOptions, Queue } from "bullmq";
import { Client } from "pg";
import { JobName } from "@twips/common";
import { createLookupRelationJobEventMetadata } from "./lookup-relation/utils";
import { createAddListMembersJobEventMetadata } from "./manage-list-members/utils";
import { createManageRelationJobEventMetadata } from "./manage-relation/utils";
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

const handleJobEvent = async (
  name: JobName,
  payload:
    | RealtimePostgresInsertPayload<{ [key: string]: any }>
    | RealtimePostgresUpdatePayload<{ [key: string]: any }>
) => {
  try {
    logger.info(
      `${name} job ${
        payload.eventType == "INSERT"
          ? "added"
          : payload.new.finished
          ? "finished"
          : "progressed"
      }`,
      {
        metadata:
          name == "lookup-relation"
            ? await createLookupRelationJobEventMetadata(payload.new.id)
            : name == "manage-list-members"
            ? await createAddListMembersJobEventMetadata(payload.new.id)
            : name == "manage-relation"
            ? await createManageRelationJobEventMetadata(payload.new.id)
            : null,
      }
    );
  } catch (error) {
    logger.error("Error at daemon while logging event", {
      metadata: { error },
    });
  }
};

export const getJobEventListener = (name: JobName) => {
  const table =
    name == "lookup-relation"
      ? "lookup_relation_job"
      : name == "manage-list-members"
      ? "manage_list_members_job"
      : name == "manage-relation"
      ? "manage_relation_job"
      : null;
  return supabase
    .channel(`public:${table}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table },
      (payload) => handleJobEvent(name, payload)
    )
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table },
      (payload) => handleJobEvent(name, payload)
    );
};

export const formatDate = (str: string) =>
  new Date(str).toLocaleString("en-IN");
